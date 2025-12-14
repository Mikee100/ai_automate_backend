import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * SECURITY: Login endpoint with input validation
   * Uses LoginDto for automatic validation
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }

  /**
   * SECURITY: Get current user profile
   * Requires valid JWT token
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    // User is attached to request by JwtStrategy
    return req.user;
  }
}
