import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { WxService } from './wx.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private wx: WxService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async loginByCode(code: string) {
    const { openid, unionid } = await this.wx.code2Session(code);
    let user = await this.userRepo.findOne({ where: { openid } });
    if (!user) {
      user = this.userRepo.create({ openid, unionid });
      await this.userRepo.save(user);
    }
    await this.userRepo.update(user.id, { last_login_at: new Date() });
    const token = this.jwt.sign(
      { sub: user.id, role: 'reader', openid },
      {
        expiresIn: (this.config.get<string>('JWT_READER_EXPIRES') || '7d') as unknown as never,
      },
    );
    return {
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const patch: Partial<User> = {};
    if (dto.nickname !== undefined) patch.nickname = dto.nickname;
    if (dto.avatarUrl !== undefined) patch.avatar_url = dto.avatarUrl;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (Object.keys(patch).length > 0) {
      await this.userRepo.update(userId, patch);
    }
    return this.userRepo.findOne({ where: { id: userId } });
  }
}
