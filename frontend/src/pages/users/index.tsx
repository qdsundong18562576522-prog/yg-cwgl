import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Popconfirm, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: '管理员', color: 'red' },
  finance: { label: '财务', color: 'blue' },
  leader: { label: '领导', color: 'green' },
  viewer: { label: '只读', color: 'default' },
};

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => editing
      ? api.patch(`/users/${editing.id}`, values)
      : api.post('/users', values),
    onSuccess: () => { message.success('保存成功'); setOpen(false); setEditing(null); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '删除失败'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => { message.success('操作成功'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
  });

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'displayName', key: 'displayName' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (v: string) => <Tag color={roleLabels[v]?.color}>{roleLabels[v]?.label || v}</Tag> },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '状态', dataIndex: 'isActive', key: 'isActive',
      render: (v: boolean, record: any) => (
        <Switch checked={v} onChange={(checked) => toggleActive.mutate({ id: record.id, isActive: checked })} size="small" />
      ),
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue(record); setOpen(true); }}>编辑</Button>
          {record.username !== 'admin' && (
            <Popconfirm title="确认删除此用户？" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="用户管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增用户</Button>}>
        <Table dataSource={data || []} columns={columns} rowKey="id" loading={isLoading} pagination={false} />
      </Card>
      <Modal title={editing ? '编辑用户' : '新增用户'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          {!editing && <Form.Item name="password" label="密码" rules={[{ required: true }]}><Input.Password /></Form.Item>}
          <Form.Item name="displayName" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}><Select options={[
            { value: 'admin', label: '管理员' }, { value: 'finance', label: '财务' }, { value: 'leader', label: '领导' }, { value: 'viewer', label: '只读' },
          ]} /></Form.Item>
          <Form.Item name="department" label="部门"><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
