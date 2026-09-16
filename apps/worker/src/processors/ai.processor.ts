import { Job } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export interface AIJobData {
  jobId: string;
  taskType: 'DOCUMENT_SUMMARIZATION' | 'BULK_COMPLETION' | 'POLICY_EXTRACTION' | string;
  prompt: string;
  systemInstruction?: string;
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  userId?: string;
}

export interface AIJobResult {
  jobId: string;
  content: string;
  provider: 'gemini' | 'groq';
  model: string;
  latencyMs: number;
  failoverUsed: boolean;
  failoverReason?: string;
}

export async function processAIJob(job: Job<AIJobData>): Promise<AIJobResult> {
  const { data } = job;
  console.log(`[Worker:AI] Processing job ${job.id} (Task: ${data.taskType})...`);

  await job.updateProgress(10);

  const geminiKey =
    process.env.AI_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  const groqKey =
    process.env.AI_GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    '';

  const startTime = Date.now();
  let failoverUsed = false;
  let failoverReason: string | undefined;

  // 1. Primary Attempt: Google Gemini 1.5 Flash
  try {
    await job.updateProgress(30);
    const gemini = new GoogleGenerativeAI(geminiKey);
    const model = gemini.getGenerativeModel({
      model: data.options?.model || 'gemini-1.5-flash',
      generationConfig: {
        temperature: data.options?.temperature ?? 0.7,
        maxOutputTokens: data.options?.maxTokens ?? 2048,
      },
    });

    const response = await model.generateContent(data.prompt);
    const text = response.response?.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Gemini returned empty response payload');
    }

    await job.updateProgress(100);
    const latencyMs = Date.now() - startTime;

    return {
      jobId: data.jobId || job.id!,
      content: text,
      provider: 'gemini',
      model: data.options?.model || 'gemini-1.5-flash',
      latencyMs,
      failoverUsed: false,
    };
  } catch (primaryErr: any) {
    failoverUsed = true;
    failoverReason = primaryErr.message || 'Primary provider error';
    console.warn(`[Worker:AI] Primary provider failed: "${failoverReason}". Triggering failover to Groq...`);

    await job.updateProgress(50);

    // 2. Secondary Attempt: Groq Cloud Llama 3.3 70B
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: data.prompt }],
      temperature: data.options?.temperature ?? 0.7,
      max_tokens: data.options?.maxTokens ?? 2048,
    });

    const text = completion.choices[0]?.message?.content || '';
    if (!text || text.trim().length === 0) {
      throw new Error('Both Gemini and Groq providers failed for async AI job.');
    }

    await job.updateProgress(100);
    const latencyMs = Date.now() - startTime;

    return {
      jobId: data.jobId || job.id!,
      content: text,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs,
      failoverUsed: true,
      failoverReason,
    };
  }
}
