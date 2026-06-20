// pages/mine/mine.ts
Page({
  data: { user: null as any },

  onShow() {
    const app = getApp<{ globalData: any }>();
    this.setData({ user: app?.globalData?.user || null });
  },

  logout() {
    wx.removeStorageSync('token');
    const app = getApp<{ globalData: any }>();
    if (app?.globalData) {
      app.globalData.user = null;
      app.globalData.needLogin = true;
    }
    this.setData({ user: null });
    wx.showToast({ title: '已退出', icon: 'success' });
  },
});
