import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LeaveStatus, LeaveTypeEnum } from '@ems/shared';

export class CreateLeaveRequestDto {
  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  leaveTypeId: string;

  @ApiProperty({ example: '2026-10-10' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD' })
  startDate: string;

  @ApiProperty({ example: '2026-10-12' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD' })
  endDate: string;

  @ApiProperty({ example: 'Family vacation and personal appointment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class ApproveLeaveDto {
  @ApiProperty({ enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] })
  @IsEnum([LeaveStatus.APPROVED, LeaveStatus.REJECTED])
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;

  @ApiPropertyOptional({ example: 'Approved. Enjoy your time off.' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  remarks?: string;
}

export class CreateLeaveTypeDto {
  @ApiProperty({ example: 'Maternity Leave' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'MATERNITY' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({ enum: LeaveTypeEnum, default: LeaveTypeEnum.ANNUAL })
  @IsEnum(LeaveTypeEnum)
  type: LeaveTypeEnum;

  @ApiProperty({ example: 90 })
  @IsInt()
  @Min(1)
  @Max(365)
  defaultDaysPerYear: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean = true;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateHolidayDto {
  @ApiProperty({ example: 'New Year Day' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean = true;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
