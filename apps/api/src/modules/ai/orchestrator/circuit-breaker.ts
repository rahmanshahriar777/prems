import { Logger } from '@nestjs/common';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;       // Consecutive failures before opening circuit
  recoveryWindowMs: number;       // Delay before moving OPEN -> HALF_OPEN
  halfOpenLimit: number;          // Maximum probe requests in HALF_OPEN
}

export class CircuitBreaker {
  private readonly logger: Logger;
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private halfOpenAttempts = 0;
  private lastFailureTime = 0;
  private lastStateChange: Date = new Date();

  constructor(
    public readonly name: string,
    private readonly config: CircuitBreakerConfig,
  ) {
    this.logger = new Logger(`CircuitBreaker:${name}`);
  }

  getState(): CircuitState {
    // If OPEN, check if recovery window has elapsed to transition to HALF_OPEN
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.config.recoveryWindowMs) {
        this.transitionTo('HALF_OPEN');
        this.halfOpenAttempts = 0;
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const currentState = this.getState();
    if (currentState === 'CLOSED') {
      return true;
    }
    if (currentState === 'HALF_OPEN') {
      return this.halfOpenAttempts < this.config.halfOpenLimit;
    }
    return false; // OPEN
  }

  recordSuccess(): void {
    const currentState = this.getState();
    if (currentState === 'HALF_OPEN') {
      this.logger.log(`Probe succeeded in HALF_OPEN. Resetting circuit to CLOSED.`);
      this.transitionTo('CLOSED');
      this.failureCount = 0;
      this.halfOpenAttempts = 0;
    } else if (currentState === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  recordFailure(error: any): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    const currentState = this.getState();
    if (currentState === 'HALF_OPEN') {
      this.logger.warn(`Probe failed in HALF_OPEN state. Re-opening circuit.`);
      this.transitionTo('OPEN');
    } else if (currentState === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
      this.logger.warn(
        `Failure threshold (${this.config.failureThreshold}) reached for ${this.name}. Opening circuit for ${this.config.recoveryWindowMs}ms.`,
      );
      this.transitionTo('OPEN');
    }
  }

  registerAttempt(): void {
    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++;
    }
  }

  getSnapshot() {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      failureThreshold: this.config.failureThreshold,
      recoveryWindowMs: this.config.recoveryWindowMs,
      lastStateChange: this.lastStateChange.toISOString(),
    };
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();
    this.logger.log(`State transition: ${oldState} -> ${newState}`);
  }
}
