import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(private svc: AdminAuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto) {
    return this.svc.login(dto);
  }
}
