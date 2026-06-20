// pages/detail/detail.ts
import { request } from '../../utils/request';

Page({
  data: { article: null as any },

  async onLoad(options: any) {
    const article = await request({ url: `/articles/${options.id}` });
    this.setData({ article });
  },
});
