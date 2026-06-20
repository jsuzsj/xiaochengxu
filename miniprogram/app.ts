// app.ts
import { silentLogin, getToken } from './utils/request';

App({
  globalData: { user: null as any, needLogin: false },
  async onLaunch() {
    const g = (this as any).globalData;
    if (!getToken()) await silentLogin();
    if (!g.user?.nickname) g.needLogin = true;
  },
});
