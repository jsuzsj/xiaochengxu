import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface Code2SessionResult {
  openid: string;
  unionid: string | null;
}

@Injectable()
export class WxService {
  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async code2Session(code: string): Promise<Code2SessionResult> {
    const mock = this.config.get<boolean>('wx.mock');
    if (mock) {
      return { openid: 'mock_' + code, unionid: null };
    }
    const appId = this.config.get<string>('wx.appId');
    const secret = this.config.get<string>('wx.secret');
    const { data } = await firstValueFrom(
      this.http.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: appId,
          secret,
          js_code: code,
          grant_type: 'authorization_code',
        },
      }),
    );
    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }
    return { openid: data.openid as string, unionid: (data.unionid ?? null) as string | null };
  }
}
