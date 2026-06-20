// pages/index/index.ts
import { request } from '../../utils/request';

Page({
  data: {
    articles: [] as any[],
    categories: [] as any[],
    tags: [] as any[],
    activeCategory: '',
    activeTag: '',
    page: 1,
    size: 10,
    hasMore: true,
    loading: false,
  },

  onLoad() {
    this.loadFilters();
    this.loadArticles(true);
  },

  async loadFilters() {
    const [categories, tags] = await Promise.all([
      request({ url: '/categories' }),
      request({ url: '/tags' }),
    ]);
    this.setData({ categories: categories || [], tags: tags || [] });
  },

  async loadArticles(reset: boolean) {
    if (this.data.loading) return;
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    const res = await request<{ items: any[]; total: number }>({
      url: '/articles',
      data: {
        category: this.data.activeCategory || undefined,
        tag: this.data.activeTag || undefined,
        page,
        size: this.data.size,
      },
    });
    const items = res?.items || [];
    const merged = reset ? items : this.data.articles.concat(items);
    this.setData({
      articles: merged,
      page,
      hasMore: merged.length < (res?.total || 0),
      loading: false,
    });
  },

  selectCategory(e: any) {
    const id = e.currentTarget.dataset.id || '';
    this.setData({ activeCategory: id });
    this.loadArticles(true);
  },

  selectTag(e: any) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeTag: this.data.activeTag === id ? '' : id });
    this.loadArticles(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadArticles(false);
    }
  },

  toDetail(e: any) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` });
  },
});
