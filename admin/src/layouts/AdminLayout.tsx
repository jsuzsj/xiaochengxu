import { Layout, Menu, Button } from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  FileTextOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;

const items = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/articles', icon: <FileTextOutlined />, label: '文章' },
  { key: '/categories', icon: <AppstoreOutlined />, label: '分类' },
  { key: '/tags', icon: <TagsOutlined />, label: '标签' },
  { key: '/users', icon: <TeamOutlined />, label: '读者' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const selected =
    items.find((i) => location.pathname.startsWith(i.key))?.key || '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div
          style={{
            height: 56,
            color: '#fff',
            textAlign: 'center',
            lineHeight: '56px',
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          文章后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Button
            onClick={() => {
              localStorage.removeItem('admin_token');
              navigate('/login');
            }}
          >
            退出
          </Button>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
