import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export default function CounterpartiesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['counterparties', typeFilter],
    queryFn: () => api.get('/counterparties', { params: typeFilter ? { type: typeFilter } : {} }).then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => editing
      ? api.patch(`/counterparties/${editing.id}`, values)
      : api.post('/counterparties', values),
    onSuccess: () => {
      message.success(editing ? '更新成功' : '创建成功');
      setOpen(false); setEditing(null); form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/counterparties/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['counterparties'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '删除失败'),
  });

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => ({ CUSTOMER: '客户', SUPPLIER: '供应商', BOTH: '两者' })[v] || v },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '地址', dataIndex: 'address', key: 'address' },
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

  const tabItems = [
    { key: '', label: '全部' },
    { key: 'CUSTOMER', label: '客户' },
    { key: 'SUPPLIER', label: '供应商' },
    { key: 'BOTH', label: '两者' },
  ];

  return (
    <div>
      <Card title="往来单位" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增单位</Button>}>
        <Tabs items={tabItems} onChange={(k) => setTypeFilter(k)} style={{ marginBottom: 16 }} />
        <Table dataSource={data || []} columns={columns} rowKey="id" loading={isLoading} pagination={false} />
      </Card>
      <Modal title={editing ? '编辑单位' : '新增单位'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate} initialValues={{ type: 'CUSTOMER' }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型"><Select options={[
            { value: 'CUSTOMER', label: '客户' }, { value: 'SUPPLIER', label: '供应商' }, { value: 'BOTH', label: '两者' },
          ]} /></Form.Item>
          <Form.Item name="contact" label="联系人"><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
