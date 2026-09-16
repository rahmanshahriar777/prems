import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  liveness() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe inspecting DB and Redis dependencies' })
  async readiness() {
    let dbStatus = 'UNKNOWN';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'UP';
    } catch (e) {
      dbStatus = 'DOWN';
    }

    const redisStatus = this.redis.getIsConnected() ? 'UP' : 'DEGRADED';

    return {
      status: dbStatus === 'UP' ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      memoryUsage: process.memoryUsage(),
    };
  }
}
