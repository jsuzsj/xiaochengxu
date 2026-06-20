import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table } from 'antd';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../../api';

export default function CategoryList() {
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm<{ name: string; sort?: number }>();

  const load = () => listCategories().then(setData);
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
    if (editing) await updateCategory(editing.id, v);
    else await createCategory(v);
    setOpen(false);
    load();
  };

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '排序', dataIndex: 'sort' },
    {
      title: '操作',
      render: (_: unknown, r: any) => (
        <Space>
          <a onClick={() => onEdit(r)}>编辑</a>
          <Popconfirm title="确认删除？" onConfirm={() => deleteCategory(r.id).then(load)}>
            <a style={{ color: '#e64340' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={onAdd}>
        新建分类
      </Button>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      <Modal
        title={editing ? '编辑分类' : '新建分类'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
