import { Button, Card, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm<{ username: string; password: string }>();

  const onFinish = async (values: { username: string; password: string }) => {
    const res = await adminLogin(values);
    localStorage.setItem('admin_token', res.token);
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="管理员登录" style={{ width: 360 }}>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
