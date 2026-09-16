import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentStatus, Gender } from '@ems/shared';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Rahman' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'sadia.rahman@ems.local' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1 (555) 123-4567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: '123 Main St, New York, NY' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional({ enum: EmploymentStatus, default: EmploymentStatus.FULL_TIME })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  status?: EmploymentStatus;

  @ApiPropertyOptional({ example: 'Senior backend architect' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  profileSummary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateEmployeeDto extends CreateEmployeeDto {}

export class EmployeeQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by name, email, or employee number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({ enum: EmploymentStatus })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  status?: EmploymentStatus;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class UpdateAvatarDto {
  @ApiPropertyOptional({
    description: 'Profile picture image URL or Base64 data URI (send null or empty string to remove)',
    example: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
