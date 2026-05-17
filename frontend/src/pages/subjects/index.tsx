import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export default function SubjectsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => editing
      ? api.patch(`/subjects/${editing.id}`, values)
      : api.post('/subjects', values),
    onSuccess: () => {
      message.success(editing ? '更新成功' : '创建成功');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/subjects/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['subjects'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '删除失败'),
  });

  const columns = [
    { title: '科目编码', dataIndex: 'code', key: 'code' },
    { title: '科目名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => ({ ASSET: '资产', LIABILITY: '负债', EQUITY: '权益', INCOME: '收入', EXPENSE: '费用' })[v] || v },
    { title: '层级', dataIndex: 'level', key: 'level' },
    { title: '状态', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => v ? '启用' : '停用' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue(record); setOpen(true); }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="会计科目" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增科目</Button>}>
        <Table dataSource={data || []} columns={columns} rowKey="id" loading={isLoading} pagination={false} />
      </Card>
      <Modal title={editing ? '编辑科目' : '新增科目'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate} initialValues={{ level: 1, isActive: true }}>
          <Form.Item name="code" label="科目编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="科目名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}><Select options={[
            { value: 'ASSET', label: '资产' }, { value: 'LIABILITY', label: '负债' }, { value: 'EQUITY', label: '权益' }, { value: 'INCOME', label: '收入' }, { value: 'EXPENSE', label: '费用' },
          ]} /></Form.Item>
          <Form.Item name="level" label="层级"><Input type="number" /></Form.Item>
          <Form.Item name="sortOrder" label="排序"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
