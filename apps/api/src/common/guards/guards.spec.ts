import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SystemRole } from '@ems/shared';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRoles: SystemRole[]): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'user-1',
            roles: userRoles,
          },
        }),
      }),
    } as any;
  }

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const ctx = createMockContext([SystemRole.EMPLOYEE]);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow SUPER_ADMIN access to any role-protected endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([SystemRole.HR_ADMIN]);
    const ctx = createMockContext([SystemRole.SUPER_ADMIN]);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access if user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([SystemRole.HR_ADMIN]);
    const ctx = createMockContext([SystemRole.EMPLOYEE]);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
