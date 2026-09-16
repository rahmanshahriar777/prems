import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SystemRole } from '@ems/shared';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employee: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
    });
  }

  async createUser(
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    roleNames: SystemRole[] = [SystemRole.EMPLOYEE],
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email address already exists');
    }

    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
    });

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          roles: {
            create: roles.map((r) => ({ roleId: r.id })),
          },
        },
      });

      // Automatically scaffold employee profile record
      const count = await tx.employee.count();
      const employeeNumber = `EMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const employee = await tx.employee.create({
        data: {
          employeeNumber,
          userId: user.id,
          firstName,
          lastName,
          email: email.toLowerCase(),
        },
      });

      return { user, employee };
    });
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }
}
