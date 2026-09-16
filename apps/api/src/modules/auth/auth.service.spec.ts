import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import { SystemRole } from '@ems/shared';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: Partial<UserService>;
  let passwordService: Partial<PasswordService>;
  let tokenService: Partial<TokenService>;
  let prismaService: Partial<PrismaService>;

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    passwordService = {
      hash: jest.fn().mockResolvedValue('hashed_password_string'),
      verify: jest.fn(),
    };

    tokenService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        tokenType: 'Bearer',
        expiresIn: 900,
      }),
    };

    prismaService = {
      loginAuditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: PasswordService, useValue: passwordService },
        { provide: TokenService, useValue: tokenService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should throw UnauthorizedException if user not found', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'unknown@ems.local', password: 'Password123!' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password does not match', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@ems.local',
      passwordHash: 'hash',
      isActive: true,
      roles: [],
    });
    (passwordService.verify as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({ email: 'test@ems.local', password: 'WrongPassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should login successfully and return tokens and user profile', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@ems.local',
      passwordHash: 'hash',
      isActive: true,
      roles: [{ role: { name: SystemRole.EMPLOYEE, permissions: [] } }],
      employee: { id: 'emp-1', firstName: 'John', lastName: 'Doe', employeeNumber: 'EMP-001' },
    });
    (passwordService.verify as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({ email: 'test@ems.local', password: 'Password123!' });

    expect(result.tokens.accessToken).toBe('mock_access_token');
    expect(result.user.email).toBe('test@ems.local');
    expect(result.user.roles).toContain(SystemRole.EMPLOYEE);
  });
});
