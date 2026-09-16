import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@ems/shared';

export class ClockInDto {
  @ApiPropertyOptional({ description: 'Optional target employee ID for admin override' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'Clocking in from HQ office' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Office - Floor 4' })
  @IsString()
  @IsOptional()
  location?: string;
}

export class ClockOutDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;
}
