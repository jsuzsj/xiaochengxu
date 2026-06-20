import axios from 'axios';
import { message } from 'antd';

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE });

http.interceptors.request.use((c) => {
  const t = localStorage.getItem('admin_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

http.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem('admin_token');
      location.href = '/login';
    } else {
      message.error(e.response?.data?.message || '请求失败');
    }
    return Promise.reject(e);
  },
);

export default http;

// auth
export const adminLogin = (data: { username: string; password: string }) =>
  http.post('/admin/auth/login', data).then((r) => r.data);

// stats
export const getStats = () => http.get('/admin/stats').then((r) => r.data);

// categories
export const listCategories = () => http.get('/admin/categories').then((r) => r.data);
export const createCategory = (data: { name: string; sort?: number }) =>
  http.post('/admin/categories', data).then((r) => r.data);
export const updateCategory = (id: string, data: { name?: string; sort?: number }) =>
  http.put(`/admin/categories/${id}`, data).then((r) => r.data);
export const deleteCategory = (id: string) => http.delete(`/admin/categories/${id}`).then((r) => r.data);

// tags
export const listTags = () => http.get('/admin/tags').then((r) => r.data);
export const createTag = (data: { name: string }) => http.post('/admin/tags', data).then((r) => r.data);
export const updateTag = (id: string, data: { name?: string }) =>
  http.put(`/admin/tags/${id}`, data).then((r) => r.data);
export const deleteTag = (id: string) => http.delete(`/admin/tags/${id}`).then((r) => r.data);

// articles
export const listArticles = (params: Record<string, unknown>) =>
  http.get('/admin/articles', { params }).then((r) => r.data);
export const getArticle = (id: string) => http.get(`/admin/articles/${id}`).then((r) => r.data);
export const createArticle = (data: Record<string, unknown>) =>
  http.post('/admin/articles', data).then((r) => r.data);
export const updateArticle = (id: string, data: Record<string, unknown>) =>
  http.put(`/admin/articles/${id}`, data).then((r) => r.data);
export const setArticleStatus = (id: string, status: number) =>
  http.patch(`/admin/articles/${id}/status`, { status }).then((r) => r.data);
export const deleteArticle = (id: string) => http.delete(`/admin/articles/${id}`).then((r) => r.data);

// upload
export const uploadImage = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return http.post('/admin/upload', fd).then((r) => r.data as { url: string });
};

// users
export const listUsers = (params: Record<string, unknown>) =>
  http.get('/admin/users', { params }).then((r) => r.data);
