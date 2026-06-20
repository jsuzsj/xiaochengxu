import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ReaderGuard } from './reader.guard';

interface AuthedRequest {
  user: { id: string; role: string; openid?: string };
}

@Controller('api/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: { code: string }) {
    return this.auth.loginByCode(body.code);
  }

  @UseGuards(ReaderGuard)
  @Post('profile')
  profile(@Req() req: AuthedRequest, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.id, dto);
  }
}
