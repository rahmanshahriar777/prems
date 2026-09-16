import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AIProviderFactory } from '../providers/ai-provider.factory';
import { IAiProvider, AiGenerateOptions, AiProviderResult } from '../providers/ai-provider.interface';
import { CircuitBreaker } from './circuit-breaker';
import { LatencyTracker } from './latency-tracker';
import { AiAuditService } from '../audit/ai-audit.service';
import { AiResponseDto, AiErrorProviderAttempt } from '../dto/ai-response.dto';
import { AiHealthResponseDto, ProviderHealthDto } from '../dto/ai-health.dto';
import { loadAiConfig } from '../config/ai.config';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private readonly config = loadAiConfig();

  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private readonly latencyTrackers: Map<string, LatencyTracker> = new Map();

  constructor(
    private readonly providerFactory: AIProviderFactory,
    private readonly auditService: AiAuditService,
  ) {
    // Initialize Circuit Breakers and Latency Trackers for all providers
    for (const provider of this.providerFactory.getAllProviders()) {
      this.circuitBreakers.set(
        provider.name,
        new CircuitBreaker(provider.name, {
          failureThreshold: this.config.circuitFailureThreshold,
          recoveryWindowMs: this.config.circuitRecoveryWindowMs,
          halfOpenLimit: this.config.circuitHalfOpenLimit,
        }),
      );
      this.latencyTrackers.set(provider.name, new LatencyTracker());
    }
  }

  /**
   * Executes AI generation with resilient circuit breaker checks and automatic failover.
   */
  async generate(
    prompt: string,
    options?: AiGenerateOptions,
    actor?: { id?: string; email?: string },
  ): Promise<AiResponseDto> {
    const requestId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullPrompt = options?.model ? prompt : prompt; // Can incorporate system prompts

    const primaryProvider = this.providerFactory.getPrimary();
    const secondaryProvider = this.providerFactory.getSecondary();

    const providerQueue: IAiProvider[] = [primaryProvider, secondaryProvider];
    const attempts: AiErrorProviderAttempt[] = [];

    let successfulResult: AiProviderResult | null = null;
    let failoverUsed = false;
    let failoverReason: string | undefined;

    const overallStart = Date.now();

    for (let i = 0; i < providerQueue.length; i++) {
      const provider = providerQueue[i];
      const isFailoverAttempt = i > 0;
      const circuit = this.circuitBreakers.get(provider.name)!;
      const tracker = this.latencyTrackers.get(provider.name)!;

      // 1. Check Circuit Breaker State
      if (!circuit.canExecute()) {
        const skipReason = `Circuit Breaker for ${provider.name} is ${circuit.getState()}. Skipping.`;
        this.logger.warn(`[${requestId}] ${skipReason}`);
        attempts.push({
          provider: provider.name,
          model: options?.model || provider.defaultModel,
          error: skipReason,
          latencyMs: 0,
        });
        if (!isFailoverAttempt) {
          failoverUsed = true;
          failoverReason = skipReason;
        }
        continue;
      }

      circuit.registerAttempt();
      const attemptStart = Date.now();

      try {
        this.logger.log(
          `[${requestId}] Dispatching request to provider: ${provider.name} (model: ${options?.model || provider.defaultModel})...`,
        );

        const result = await provider.generate(fullPrompt, options);
        const latencyMs = Date.now() - attemptStart;

        // Record success in Circuit Breaker and Latency Tracker
        circuit.recordSuccess();
        tracker.recordLatency(latencyMs, true);

        successfulResult = result;
        if (isFailoverAttempt) {
          failoverUsed = true;
        }

        this.logger.log(
          `[${requestId}] Generation succeeded via ${provider.name} in ${latencyMs}ms (Failover: ${failoverUsed})`,
        );
        break; // Exit provider loop on success
      } catch (providerError: any) {
        const latencyMs = Date.now() - attemptStart;
        const errorMsg = providerError.message || 'Unknown provider error';

        circuit.recordFailure(providerError);
        tracker.recordLatency(latencyMs, false, errorMsg);

        this.logger.warn(
          `[${requestId}] Provider ${provider.name} failed in ${latencyMs}ms: "${errorMsg}".`,
        );

        attempts.push({
          provider: provider.name,
          model: options?.model || provider.defaultModel,
          error: errorMsg,
          latencyMs,
        });

        if (!isFailoverAttempt) {
          failoverUsed = true;
          failoverReason = `${provider.name} failure: ${errorMsg}`;
          this.logger.log(`[${requestId}] Transparent failover initiated -> Switching to ${secondaryProvider.name}`);
        }
      }
    }

    const totalLatencyMs = Date.now() - overallStart;

    // 2. Handle Complete Outage (Both Primary and Secondary Failed)
    if (!successfulResult) {
      const outageMessage = 'All configured AI providers are currently unavailable or in open circuit state.';
      this.logger.error(`[${requestId}] ${outageMessage} Attempts: ${JSON.stringify(attempts)}`);

      // Log outage event to audit database
      await this.auditService.recordLog({
        requestId,
        userId: actor?.id,
        actorEmail: actor?.email,
        provider: 'NONE',
        model: options?.model || 'unknown',
        prompt,
        latencyMs: totalLatencyMs,
        succeeded: false,
        error: outageMessage,
        metadata: { attempts },
      });

      throw new ServiceUnavailableException({
        statusCode: 503,
        message: outageMessage,
        errorCode: 'AI_OUTAGE_ALL_PROVIDERS_FAILED',
        attempts,
        retryAfterSeconds: 30,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Persist Token-Level Audit Log to PostgreSQL
    await this.auditService.recordLog({
      requestId,
      userId: actor?.id,
      actorEmail: actor?.email,
      provider: successfulResult.provider,
      model: successfulResult.model,
      prompt,
      response: successfulResult.content,
      promptTokens: successfulResult.usage?.promptTokens,
      completionTokens: successfulResult.usage?.completionTokens,
      totalTokens: successfulResult.usage?.totalTokens,
      latencyMs: totalLatencyMs,
      succeeded: true,
      metadata: {
        failoverUsed,
        failoverReason,
        attempts: attempts.length > 0 ? attempts : undefined,
      },
    });

    return {
      content: successfulResult.content,
      provider: successfulResult.provider as 'gemini' | 'groq',
      model: successfulResult.model,
      latencyMs: totalLatencyMs,
      failoverUsed,
      failoverReason,
      usage: successfulResult.usage,
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health and observability reporting for admin status dashboards.
   */
  async getHealthStatus(): Promise<AiHealthResponseDto> {
    const providersReport: Record<string, ProviderHealthDto> = {};
    let hasUnhealthy = false;
    let allUnhealthy = true;

    for (const provider of this.providerFactory.getAllProviders()) {
      const circuit = this.circuitBreakers.get(provider.name)!;
      const tracker = this.latencyTrackers.get(provider.name)!;

      const circuitSnapshot = circuit.getSnapshot();
      const p50 = tracker.getP50();
      const p95 = tracker.getP95();
      const errorRate = tracker.getErrorRate();

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (circuitSnapshot.state === 'OPEN') {
        status = 'unhealthy';
        hasUnhealthy = true;
      } else if (circuitSnapshot.state === 'HALF_OPEN' || errorRate > 0.1 || p95 > 10000) {
        status = 'degraded';
        hasUnhealthy = true;
        allUnhealthy = false;
      } else {
        allUnhealthy = false;
      }

      providersReport[provider.name] = {
        provider: provider.name,
        status,
        model: provider.defaultModel,
        circuit: circuitSnapshot,
        p50LatencyMs: p50,
        p95LatencyMs: p95,
        errorRate,
        lastSuccessfulRequest: tracker.getLastSuccess(),
        lastError: tracker.getLastError(),
        checkedAt: new Date().toISOString(),
      };
    }

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = allUnhealthy
      ? 'unhealthy'
      : hasUnhealthy
      ? 'degraded'
      : 'healthy';

    return {
      overallStatus,
      providers: providersReport,
      primaryProvider: this.config.primaryProvider,
      secondaryProvider: this.config.secondaryProvider,
      timestamp: new Date().toISOString(),
    };
  }
}
