export interface AiConfiguration {
  geminiApiKey: string;
  groqApiKey: string;
  primaryProvider: 'gemini' | 'groq';
  secondaryProvider: 'gemini' | 'groq';
  geminiModel: string;
  groqModel: string;
  timeoutMs: number;
  circuitFailureThreshold: number;
  circuitRecoveryWindowMs: number;
  circuitHalfOpenLimit: number;
}

export const loadAiConfig = (): AiConfiguration => {
  const geminiApiKey =
    process.env.AI_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  const groqApiKey =
    process.env.AI_GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    '';

  return {
    geminiApiKey,
    groqApiKey,
    primaryProvider: (process.env.AI_PRIMARY_PROVIDER as any) || 'gemini',
    secondaryProvider: (process.env.AI_SECONDARY_PROVIDER as any) || 'groq',
    geminiModel: process.env.AI_GEMINI_MODEL || 'gemini-1.5-flash',
    groqModel: process.env.AI_GROQ_MODEL || 'llama-3.3-70b-versatile',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
    circuitFailureThreshold: parseInt(process.env.AI_CIRCUIT_FAILURE_THRESHOLD || '5', 10),
    circuitRecoveryWindowMs: parseInt(process.env.AI_CIRCUIT_RECOVERY_WINDOW_MS || '30000', 10),
    circuitHalfOpenLimit: parseInt(process.env.AI_CIRCUIT_HALF_OPEN_LIMIT || '2', 10),
  };
};
