import { useEffect, useState } from 'react';
import { Button, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { deleteArticle, listArticles, setArticleStatus } from '../../api';

export default function ArticleList() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    listArticles({ page, size: 10, status, search: search || undefined })
      .then((r) => {
        setData(r.items);
        setTotal(r.total);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const columns = [
    { title: '标题', dataIndex: 'title' },
    { title: '分类', render: (_: unknown, r: any) => r.category?.name || '-' },
    {
      title: '标签',
      render: (_: unknown, r: any) => (r.tags || []).map((t: any) => <Tag key={t.id}>{t.name}</Tag>),
    },
    {
      title: '状态',
      render: (_: unknown, r: any) =>
        r.status === 1 ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>,
    },
    { title: '浏览', dataIndex: 'view_count' },
    {
      title: '操作',
      render: (_: unknown, r: any) => (
        <Space>
          <a onClick={() => navigate(`/articles/edit/${r.id}`)}>编辑</a>
          {r.status === 1 ? (
            <a onClick={() => setArticleStatus(r.id, 0).then(load)}>撤回</a>
          ) : (
            <a onClick={() => setArticleStatus(r.id, 1).then(load)}>发布</a>
          )}
          <Popconfirm title="确认删除？" onConfirm={() => deleteArticle(r.id).then(load)}>
            <a style={{ color: '#e64340' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 120 }}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: 0, label: '草稿' },
            { value: 1, label: '已发布' },
          ]}
        />
        <Input.Search
          placeholder="搜索标题"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={load}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={() => navigate('/articles/edit')}>
          新建文章
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: setPage }}
      />
    </div>
  );
}
