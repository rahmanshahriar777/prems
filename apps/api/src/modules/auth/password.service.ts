import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PasswordService {
  private readonly iterations = 100000;
  private readonly keyLength = 64;
  private readonly digest = 'sha512';

  async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, this.digest).toString('hex');
    return `pbkdf2$${this.iterations}$${salt}$${hash}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    if (!storedHash) return false;

    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      // Fallback check or invalid format
      return false;
    }

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    const computedHash = crypto.pbkdf2Sync(password, salt, iterations, this.keyLength, this.digest).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
  }
}
