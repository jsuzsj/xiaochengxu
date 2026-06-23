import { useEffect, useState } from 'react';
import { Avatar, Drawer, Input, Table } from 'antd';
import { listUsers } from '../../api';

export default function UserList() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    listUsers({ page, size: 10, search: search || undefined })
      .then((r) => {
        setData(r.items);
        setTotal(r.total);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const columns = [
    {
      title: '头像',
      render: (_: unknown, r: any) => <Avatar src={r.avatar_url}>{(r.nickname || '?')[0]}</Avatar>,
    },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '手机号', dataIndex: 'phone', render: (v: string | null) => v || '-' },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: '最近登录',
      dataIndex: 'last_login_at',
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
  ];

  return (
    <div>
      <Input.Search
        placeholder="搜索昵称"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onSearch={load}
        style={{ width: 240, marginBottom: 16 }}
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: setPage }}
        onRow={(r) => ({ onClick: () => setCurrent(r) })}
      />
      <Drawer open={!!current} onClose={() => setCurrent(null)} title="读者详情" width={400}>
        {current && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(current, null, 2)}</pre>}
      </Drawer>
    </div>
  );
}
