import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../entities/admin.entity';
import { User } from '../entities/user.entity';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { ReaderGuard } from './reader.guard';
import { WxService } from './wx.service';

@Global()
@Module({
  imports: [
    HttpModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dev-secret',
      }),
    }),
    TypeOrmModule.forFeature([User, Admin]),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, AdminAuthService, WxService, JwtStrategy, ReaderGuard, AdminGuard],
  exports: [ReaderGuard, AdminGuard],
})
export class AuthModule {}
