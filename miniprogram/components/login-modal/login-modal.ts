// components/login-modal/login-modal.ts
import { request } from '../../utils/request';

Component({
  data: { visible: false, nickname: '', avatarUrl: '' },
  lifetimes: {
    attached() {
      this.tick();
      (this as any)._t = setInterval(() => this.tick(), 500);
    },
    detached() {
      clearInterval((this as any)._t);
    },
  },
  methods: {
    tick() {
      const app = getApp<{ globalData: { needLogin: boolean } }>();
      this.setData({ visible: app?.globalData?.needLogin ?? false });
    },
    onNickname(e: any) {
      this.setData({ nickname: e.detail.value });
    },
    onAvatar(e: any) {
      this.setData({ avatarUrl: e.detail.avatarUrl });
    },
    async submit() {
      await request({
        url: '/auth/profile',
        method: 'POST',
        data: { nickname: this.data.nickname, avatarUrl: this.data.avatarUrl },
      });
      const app = getApp<{ globalData: any }>();
      if (app?.globalData) {
        app.globalData.needLogin = false;
        app.globalData.user = app.globalData.user || {};
        app.globalData.user.nickname = this.data.nickname || '微信用户';
      }
      this.setData({ visible: false });
    },
    skip() {
      const app = getApp<{ globalData: { needLogin: boolean } }>();
      if (app?.globalData) app.globalData.needLogin = false;
      this.setData({ visible: false });
    },
  },
});
