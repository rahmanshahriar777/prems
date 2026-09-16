import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { JwtPayload, TokensResponse, SystemRole } from '@ems/shared';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async generateTokens(
    userId: string,
    email: string,
    roles: SystemRole[],
    permissions: string[],
    employeeId?: string,
    existingFamilyId?: string,
    ipAddress?: string,
  ): Promise<TokensResponse> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      roles,
      permissions,
      employeeId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiration', '15m'),
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = existingFamilyId || crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        familyId,
        expiresAt,
        createdIp: ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken: `${familyId}.${rawRefreshToken}`,
      tokenType: 'Bearer',
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  async rotateRefreshToken(refreshTokenString: string, ipAddress?: string): Promise<TokensResponse> {
    const parts = refreshTokenString.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const [familyId, rawToken] = parts;
    const tokenHash = this.hashToken(rawToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
            employee: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Reuse detection: If token was already revoked, revoke the entire family!
    if (storedToken.isRevoked) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Compromised refresh token reused. All active sessions invalidated.');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Extract user roles and permissions
    const roles: SystemRole[] = storedToken.user.roles.map((r) => r.role.name as SystemRole);
    const permissionsSet = new Set<string>();
    for (const ur of storedToken.user.roles) {
      for (const rp of ur.role.permissions) {
        permissionsSet.add(`${rp.permission.subject}:${rp.permission.action}`);
      }
    }

    return this.generateTokens(
      storedToken.userId,
      storedToken.user.email,
      roles,
      Array.from(permissionsSet),
      storedToken.user.employee?.id,
      familyId,
      ipAddress,
    );
  }

  async revokeToken(refreshTokenString: string): Promise<void> {
    const parts = refreshTokenString.split('.');
    if (parts.length === 2) {
      const tokenHash = this.hashToken(parts[1]);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}
