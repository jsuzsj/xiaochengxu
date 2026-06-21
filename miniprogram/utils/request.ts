// miniprogram/utils/request.ts
// 开发期 BASE 指向本地后端；上线改为已备案 HTTPS 域名，并在小程序后台配置 request 合法域名
const BASE = 'http://localhost:9800/api';

let token = wx.getStorageSync('token') || '';

export const setToken = (t: string) => {
  token = t;
  wx.setStorageSync('token', t);
};

export const getToken = () => token;

export interface ReqOpts {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
}

export function request<T = any>(opts: ReqOpts): Promise<T> {
  return new Promise((resolve) => {
    const doReq = (retry: boolean) =>
      wx.request({
        url: BASE + opts.url,
        method: opts.method || 'GET',
        data: opts.data,
        header: token ? { Authorization: 'Bearer ' + token } : {},
        success: async (res) => {
          if (res.statusCode === 401 && retry) {
            await silentLogin();
            return doReq(false);
          }
          if (res.statusCode >= 400) {
            wx.showToast({ title: (res.data as any)?.message || '请求失败', icon: 'none' });
          }
          resolve(res.data as T);
        },
        fail: () => {
          wx.showToast({ title: '网络错误', icon: 'none' });
          resolve(null as any);
        },
      });
    doReq(true);
  });
}

export async function silentLogin(): Promise<void> {
  try {
    const { code } = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>(
      (resolve, reject) => wx.login({ success: resolve, fail: reject }),
    );
    const res = await request<{ token: string; user: any }>({
      url: '/auth/login',
      method: 'POST',
      data: { code },
    });
    if (res?.token) {
      setToken(res.token);
      const app = getApp<{ globalData: any }>();
      if (app?.globalData) app.globalData.user = res.user;
    }
  } catch (e) {
    // 静默登录失败忽略，后续 401 会重试
  }
}
