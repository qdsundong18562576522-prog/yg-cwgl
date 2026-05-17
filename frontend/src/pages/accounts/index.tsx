import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export default function AccountsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => editing
      ? api.patch(`/accounts/${editing.id}`, values)
      : api.post('/accounts', values),
    onSuccess: () => {
      message.success(editing ? '更新成功' : '创建成功');
      setOpen(false); setEditing(null); form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/accounts/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['accounts'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '删除失败'),
  });

  const columns = [
    { title: '账户名称', dataIndex: 'name', key: 'name' },
    { title: '账号', dataIndex: 'accountNo', key: 'accountNo' },
    { title: '开户行', dataIndex: 'bankName', key: 'bankName' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => ({ CHECKING: '基本户', GENERAL: '一般户', SPECIAL: '专户', CASH: '现金' })[v] || v },
    { title: '余额', dataIndex: 'balance', key: 'balance', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
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
      <Card title="银行账户" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增账户</Button>}>
        <Table dataSource={data || []} columns={columns} rowKey="id" loading={isLoading} pagination={false} />
      </Card>
      <Modal title={editing ? '编辑账户' : '新增账户'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate} initialValues={{ type: 'CHECKING', currency: 'CNY', isActive: true }}>
          <Form.Item name="name" label="账户名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="accountNo" label="账号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="bankName" label="开户行" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型"><Select options={[
            { value: 'CHECKING', label: '基本户' }, { value: 'GENERAL', label: '一般户' }, { value: 'SPECIAL', label: '专户' }, { value: 'CASH', label: '现金' },
          ]} /></Form.Item>
          <Form.Item name="balance" label="余额"><Input type="number" /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
