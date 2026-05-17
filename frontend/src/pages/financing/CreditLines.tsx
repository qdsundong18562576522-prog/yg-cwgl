import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Space, message, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';

export default function CreditLinesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['credit-lines'],
    queryFn: () => api.get('/financing/credit-lines').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values, startDate: values.startDate?.toISOString(), expiryDate: values.expiryDate?.toISOString() };
      return editing ? api.patch(`/financing/credit-lines/${editing.id}`, payload) : api.post('/financing/credit-lines', payload);
    },
    onSuccess: () => { message.success('保存成功'); setOpen(false); setEditing(null); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['credit-lines'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/financing/credit-lines/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['credit-lines'] }); },
  });

  const columns = [
    { title: '银行', dataIndex: 'bankName', key: 'bankName' },
    { title: '授信总额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '已用额度', dataIndex: 'usedAmount', key: 'usedAmount', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '可用额度', dataIndex: 'availableAmount', key: 'availableAmount', render: (v: string) => <strong>{parseFloat(v).toLocaleString()} 元</strong> },
    { title: '利率', dataIndex: 'interestRate', key: 'interestRate', render: (v: string) => v ? `${v}%` : '-' },
    { title: '有效期至', dataIndex: 'expiryDate', key: 'expiryDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue({ ...record, startDate: dayjs(record.startDate), expiryDate: dayjs(record.expiryDate) }); setOpen(true); }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="授信额度管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增授信</Button>}>
        <Table dataSource={data || []} columns={columns} rowKey="id" loading={isLoading} pagination={false} />
      </Card>
      <Modal title={editing ? '编辑授信' : '新增授信'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="bankName" label="银行名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="totalAmount" label="授信总额" rules={[{ required: true }]}><InputNumber style={{ width: 200 }} min={0} /></Form.Item>
            <Form.Item name="interestRate" label="利率(%)"><InputNumber style={{ width: 150 }} min={0} step={0.1} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="usedAmount" label="已用额度"><InputNumber style={{ width: 200 }} min={0} /></Form.Item>
            <Form.Item name="availableAmount" label="可用额度"><InputNumber style={{ width: 200 }} min={0} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="startDate" label="开始日期"><DatePicker /></Form.Item>
            <Form.Item name="expiryDate" label="到期日期" rules={[{ required: true }]}><DatePicker /></Form.Item>
          </Space>
          <Form.Item name="description" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
