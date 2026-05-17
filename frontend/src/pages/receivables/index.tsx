import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, message, Card, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';

export default function ReceivablesPage() {
  const [open, setOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [writeOffForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['receivables'],
    queryFn: () => api.get('/receivables', { params: { pageSize: 100 } }).then(r => r.data.data),
  });

  const { data: agingData } = useQuery({
    queryKey: ['receivables-aging'],
    queryFn: () => api.get('/receivables/aging-analysis').then(r => r.data.data),
  });

  const { data: counterparties } = useQuery({ queryKey: ['counterparties-list'], queryFn: () => api.get('/counterparties').then(r => r.data.data) });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values, dueDate: values.dueDate?.toISOString() };
      return editing ? api.patch(`/receivables/${editing.id}`, payload) : api.post('/receivables', payload);
    },
    onSuccess: () => { message.success('保存成功'); setOpen(false); setEditing(null); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['receivables'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/receivables/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['receivables'] }); },
  });

  const writeOffMutation = useMutation({
    mutationFn: (values: any) => api.post(`/receivables/${selectedId}/write-off`, { ...values, writeDate: values.writeDate?.toISOString() }),
    onSuccess: () => { message.success('核销成功'); setWriteOffOpen(false); writeOffForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['receivables'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '核销失败'),
  });

  const columns = [
    { title: '客户', dataIndex: ['counterparty', 'name'], key: 'cp' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '已收', dataIndex: 'receivedAmount', key: 'receivedAmount', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '未收', key: 'balance', render: (_: any, r: any) => `${(parseFloat(r.amount) - parseFloat(r.receivedAmount)).toLocaleString()} 元` },
    { title: '到期日', dataIndex: 'dueDate', key: 'dueDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '项目', dataIndex: 'projectName', key: 'projectName' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => ({ PENDING: '待收款', PARTIAL: '部分收款', SETTLED: '已结清' })[v] || v },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.status !== 'SETTLED' && <Button type="link" icon={<DollarOutlined />} onClick={() => { setSelectedId(record.id); writeOffForm.resetFields(); setWriteOffOpen(true); }}>核销</Button>}
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue({ ...record, dueDate: dayjs(record.dueDate) }); setOpen(true); }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="应收账款" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增应收</Button>}>
        {agingData && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {agingData.map((b: any) => (
              <Col span={6} key={b.label}>
                <Card size="small" title={b.label}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: b.label === '90天以上' ? '#cf1322' : '#666' }}>
                    {b.total.toLocaleString()} 元
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>{b.items.length} 笔</div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <Table dataSource={data?.items || []} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 20 }} />
      </Card>
      <Modal title={editing ? '编辑应收' : '新增应收'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="counterpartyId" label="客户" rules={[{ required: true }]}><Select options={counterparties?.filter((c: any) => c.type !== 'SUPPLIER').map((c: any) => ({ value: c.id, label: c.name }))} /></Form.Item>
          <Row gutter={16}><Col span={12}><Form.Item name="amount" label="金额" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
            <Col span={12}><Form.Item name="dueDate" label="到期日" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col></Row>
          <Form.Item name="projectName" label="关联项目"><Input /></Form.Item>
          <Form.Item name="description" label="说明"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
      <Modal title="收款核销" open={writeOffOpen} onCancel={() => setWriteOffOpen(false)} onOk={() => writeOffForm.submit()}>
        <Form form={writeOffForm} layout="vertical" onFinish={writeOffMutation.mutate}>
          <Form.Item name="amount" label="核销金额" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="writeDate" label="收款日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="description" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
