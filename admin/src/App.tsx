import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ArticleList from './pages/articles/List';
import ArticleEdit from './pages/articles/Edit';
import CategoryList from './pages/categories/List';
import TagList from './pages/tags/List';
import UserList from './pages/users/List';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="articles" element={<ArticleList />} />
            <Route path="articles/edit" element={<ArticleEdit />} />
            <Route path="articles/edit/:id" element={<ArticleEdit />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="tags" element={<TagList />} />
            <Route path="users" element={<UserList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
