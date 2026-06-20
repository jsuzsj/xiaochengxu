import { useEffect, useRef, useState } from 'react';
import { Button, Card, Form, Input, message, Radio, Select, Space, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import {
  createArticle,
  getArticle,
  listCategories,
  listTags,
  updateArticle,
  uploadImage,
} from '../../api';

export default function ArticleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [html, setHtml] = useState('');
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    listCategories().then(setCategories);
    listTags().then(setTags);
    if (id) {
      getArticle(id).then((a) => {
        form.setFieldsValue({
          title: a.title,
          summary: a.summary,
          cover_url: a.cover_url,
          category_id: a.category?.id,
          tag_ids: (a.tags || []).map((t: any) => t.id),
          status: a.status,
        });
        setHtml(a.content);
      });
    } else {
      form.setFieldsValue({ status: 0 });
    }
    return () => {
      if (editor) {
        editor.destroy();
        setEditor(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (editor && html && !initRef.current) {
      editor.setHtml(html);
      initRef.current = true;
    }
  }, [editor, html]);

  const editorConfig = {
    placeholder: '请输入正文',
    MENU_CONF: {
      uploadImage: {
        async customUpload(file: File, insertFn: (url: string) => void) {
          const res = await uploadImage(file);
          insertFn(res.url);
        },
      },
    },
  };

  const submit = async (status: number) => {
    const v = await form.validateFields();
    const payload = { ...v, content: html, status };
    if (id) await updateArticle(id, payload);
    else await createArticle(payload);
    message.success('已保存');
    navigate('/articles');
  };

  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="summary" label="摘要">
          <Input.TextArea maxLength={200} rows={2} />
        </Form.Item>
        <Space style={{ display: 'flex' }} size="large">
          <Form.Item
            name="category_id"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select
              style={{ width: 200 }}
              options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="tag_ids" label="标签">
            <Select
              mode="multiple"
              style={{ width: 320 }}
              options={tags.map((t: any) => ({ value: t.id, label: t.name }))}
            />
          </Form.Item>
        </Space>
        <Form.Item label="正文" required>
          <div style={{ border: '1px solid #ddd' }}>
            <Toolbar
              editor={editor}
              defaultConfig={{}}
              mode="default"
              style={{ borderBottom: '1px solid #ddd' }}
            />
            <Editor
              defaultConfig={editorConfig}
              value={html}
              onCreated={setEditor}
              onChange={(e: IDomEditor) => setHtml(e.getHtml())}
              mode="default"
              style={{ minHeight: 300 }}
            />
          </div>
        </Form.Item>
        <Form.Item label="封面图">
          <Space align="start">
            <Upload
              listType="picture-card"
              showUploadList={false}
              customRequest={async (opts) => {
                const res = await uploadImage(opts.file as File);
                form.setFieldValue('cover_url', res.url);
                message.success('封面上传成功');
              }}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 4 }}>上传</div>
              </div>
            </Upload>
            <Form.Item name="cover_url" noStyle>
              <Input placeholder="或粘贴图片 URL" style={{ width: 320 }} />
            </Form.Item>
          </Space>
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Radio.Group
            options={[
              { value: 0, label: '草稿' },
              { value: 1, label: '已发布' },
            ]}
          />
        </Form.Item>
        <Space>
          <Button onClick={() => submit(0)}>存为草稿</Button>
          <Button type="primary" onClick={() => submit(1)}>
            发布
          </Button>
        </Space>
      </Form>
    </Card>
  );
}
