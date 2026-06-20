import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.adminRepo.findOne({ where: { username: dto.username } });
    if (!admin) throw new UnauthorizedException('用户名或密码错误');
    const ok = await bcrypt.compare(dto.password, admin.password_hash);
    if (!ok) throw new UnauthorizedException('用户名或密码错误');
    const token = this.jwt.sign(
      { sub: admin.id, role: 'admin' },
      { expiresIn: (this.config.get<string>('JWT_ADMIN_EXPIRES') || '1d') as unknown as never },
    );
    return { token, admin: { id: admin.id, username: admin.username } };
  }
}
