import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Space, Table } from 'antd';
import { createTag, deleteTag, listTags, updateTag } from '../../api';

export default function TagList() {
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm<{ name: string }>();

  const load = () => listTags().then(setData);
  useEffect(() => {
    load();
  }, []);

  const onEdit = (r: any) => {
    setEditing(r);
    form.setFieldsValue(r);
    setOpen(true);
  };
  const onAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };
  const onSubmit = async () => {
    const v = await form.validateFields();
    if (editing) await updateTag(editing.id, v);
    else await createTag(v);
    setOpen(false);
    load();
  };

  const columns = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '操作',
      render: (_: unknown, r: any) => (
        <Space>
          <a onClick={() => onEdit(r)}>编辑</a>
          <Popconfirm title="确认删除？" onConfirm={() => deleteTag(r.id).then(load)}>
            <a style={{ color: '#e64340' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={onAdd}>
        新建标签
      </Button>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      <Modal
        title={editing ? '编辑标签' : '新建标签'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input maxLength={20} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
