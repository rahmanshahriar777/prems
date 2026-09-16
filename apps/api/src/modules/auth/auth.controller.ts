import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@ems/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, ip, userAgent);
    return {
      success: true,
      message: 'Logged in successfully',
      data: result,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.authService.register(dto, ip);
    return {
      success: true,
      message: 'Account registered successfully',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const tokens = await this.authService.refreshToken(dto.refreshToken, ip);
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke active session' })
  async logout(@Body() dto: Partial<RefreshTokenDto>, @CurrentUser() user?: JwtPayload) {
    if (user?.sub || dto?.refreshToken) {
      await this.authService.logout(dto?.refreshToken, user?.sub);
    }
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile and roles' })
  async getMe(@CurrentUser('sub') userId: string) {
    const user = await this.authService.getMe(userId);
    return {
      success: true,
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, dto);
    return {
      success: true,
      message: 'Password changed successfully. Please log in again.',
    };
  }
}
