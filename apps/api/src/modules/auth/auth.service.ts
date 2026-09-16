import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from './dto/auth.dto';
import { SystemRole, AuthUserResponse, TokensResponse } from '@ems/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  private extractPermissions(user: any): string[] {
    const set = new Set<string>();
    for (const ur of user.roles || []) {
      for (const rp of ur.role?.permissions || []) {
        set.add(`${rp.permission.subject}:${rp.permission.action}`);
      }
    }
    return Array.from(set);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ user: AuthUserResponse; tokens: TokensResponse }> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      await this.recordLoginAudit(null, dto.email, false, 'User not found', ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      await this.recordLoginAudit(user.id, dto.email, false, 'Account deactivated', ipAddress, userAgent);
      throw new UnauthorizedException('Your account has been deactivated. Please contact HR.');
    }

    const isPasswordValid = await this.passwordService.verify(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.recordLoginAudit(user.id, dto.email, false, 'Invalid credentials', ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Success audit log
    await this.recordLoginAudit(user.id, dto.email, true, undefined, ipAddress, userAgent);

    const roles: SystemRole[] = user.roles.map((r) => r.role.name as SystemRole);
    const permissions = this.extractPermissions(user);

    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      roles,
      permissions,
      user.employee?.id,
      undefined,
      ipAddress,
    );

    const userProfile: AuthUserResponse = {
      id: user.id,
      email: user.email,
      firstName: user.employee?.firstName,
      lastName: user.employee?.lastName,
      roles,
      permissions,
      employeeId: user.employee?.id,
      employeeNumber: user.employee?.employeeNumber,
      avatarUrl: user.employee?.avatarUrl || undefined,
    };

    return { user: userProfile, tokens };
  }

  async register(dto: RegisterDto, ipAddress?: string): Promise<{ user: AuthUserResponse; tokens: TokensResponse }> {
    const passwordHash = await this.passwordService.hash(dto.password);
    const { user, employee } = await this.userService.createUser(
      dto.email,
      passwordHash,
      dto.firstName,
      dto.lastName,
      [SystemRole.EMPLOYEE],
    );

    const roles = [SystemRole.EMPLOYEE];
    const permissions: string[] = [];

    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      roles,
      permissions,
      employee.id,
      undefined,
      ipAddress,
    );

    const userProfile: AuthUserResponse = {
      id: user.id,
      email: user.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      roles,
      permissions,
      employeeId: employee.id,
      employeeNumber: employee.employeeNumber,
    };

    return { user: userProfile, tokens };
  }

  async refreshToken(token: string, ipAddress?: string): Promise<TokensResponse> {
    return this.tokenService.rotateRefreshToken(token, ipAddress);
  }

  async logout(token?: string, userId?: string): Promise<void> {
    if (token) {
      await this.tokenService.revokeToken(token);
    } else if (userId) {
      await this.tokenService.revokeAllUserTokens(userId);
    }
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }

    const roles: SystemRole[] = user.roles.map((r) => r.role.name as SystemRole);
    const permissions = this.extractPermissions(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.employee?.firstName,
      lastName: user.employee?.lastName,
      roles,
      permissions,
      employeeId: user.employee?.id,
      employeeNumber: user.employee?.employeeNumber,
      avatarUrl: user.employee?.avatarUrl || undefined,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await this.passwordService.verify(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const newHash = await this.passwordService.hash(dto.newPassword);
    await this.userService.updatePassword(userId, newHash);

    // Invalidate existing sessions for security
    await this.tokenService.revokeAllUserTokens(userId);
  }

  private async recordLoginAudit(
    userId: string | null,
    emailAttempted: string,
    isSuccess: boolean,
    failureReason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.prisma.loginAuditLog.create({
        data: {
          userId,
          emailAttempted,
          isSuccess,
          failureReason,
          ipAddress,
          userAgent,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to record login audit: ${e.message}`);
    }
  }
}
