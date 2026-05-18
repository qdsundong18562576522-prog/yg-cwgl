import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, message, Card, Popconfirm, Row, Col, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';

export default function TransactionsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [params, setParams] = useState<any>({ page: 1, pageSize: 20 });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.get('/transactions', { params }).then(r => r.data.data),
  });

  const { data: accounts } = useQuery({ queryKey: ['accounts-list'], queryFn: () => api.get('/accounts').then(r => r.data.data) });
  const { data: counterparties } = useQuery({ queryKey: ['counterparties-list'], queryFn: () => api.get('/counterparties').then(r => r.data.data) });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values, date: values.date?.toISOString() };
      return editing ? api.patch(`/transactions/${editing.id}`, payload) : api.post('/transactions', payload);
    },
    onSuccess: () => { message.success('保存成功'); setOpen(false); setEditing(null); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['transactions'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/transactions/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['transactions'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '删除失败'),
  });

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date', sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(), render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => ({ INCOME: '收入', EXPENSE: '支出', TRANSFER: '转账' })[v] || v },
    { title: '方向', dataIndex: 'direction', key: 'direction', render: (v: string) => ({ IN: '流入', OUT: '流出' })[v] || v },
    { title: '金额', dataIndex: 'amount', key: 'amount', sorter: (a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount), render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '账户', dataIndex: ['account', 'name'], key: 'accountName' },
    { title: '往来单位', dataIndex: ['counterparty', 'name'], key: 'cpName' },
    { title: '摘要', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '对账状态', dataIndex: 'reconciliationStatus', key: 'reconciliationStatus', render: (v: string) => ({ UNRECONCILED: '未对账', PARTIALLY_MATCHED: '部分匹配', RECONCILED: '已对账' })[v] || v },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue({ ...record, date: dayjs(record.date) }); setOpen(true); }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="内部流水" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增流水</Button>}>
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col span={5}><Select placeholder="账户" allowClear style={{ width: '100%' }} onChange={(v) => setParams((prev: any) => ({ ...prev, accountId: v }))} options={accounts?.map((a: any) => ({ value: a.id, label: a.name }))} /></Col>
          <Col span={4}><Select placeholder="类型" allowClear style={{ width: '100%' }} onChange={(v) => setParams((prev: any) => ({ ...prev, type: v }))} options={[{ value: 'INCOME', label: '收入' }, { value: 'EXPENSE', label: '支出' }, { value: 'TRANSFER', label: '转账' }]} /></Col>
          <Col span={4}><Select placeholder="方向" allowClear style={{ width: '100%' }} onChange={(v) => setParams((prev: any) => ({ ...prev, direction: v }))} options={[{ value: 'IN', label: '流入' }, { value: 'OUT', label: '流出' }]} /></Col>
          <Col span={4}><Select placeholder="往来单位" allowClear style={{ width: '100%' }} onChange={(v) => setParams((prev: any) => ({ ...prev, counterpartyId: v }))} options={counterparties?.map((c: any) => ({ value: c.id, label: c.name }))} /></Col>
          <Col span={4}><Select placeholder="对账状态" allowClear style={{ width: '100%' }} onChange={(v) => setParams((prev: any) => ({ ...prev, reconciliationStatus: v }))} options={[{ value: 'UNRECONCILED', label: '未对账' }, { value: 'RECONCILED', label: '已对账' }]} /></Col>
          <Col span={3}><Button onClick={() => setParams({ page: 1, pageSize: 20 })}>重置</Button></Col>
        </Row>
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col><DatePicker placeholder="开始日期" onChange={(d) => setParams((prev: any) => ({ ...prev, startDate: d?.format('YYYY-MM-DD') }))} /></Col>
          <Col><DatePicker placeholder="结束日期" onChange={(d) => setParams((prev: any) => ({ ...prev, endDate: d?.format('YYYY-MM-DD') }))} /></Col>
          <Col>
            <Radio.Group size="small" optionType="button" buttonStyle="solid"
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'today') { const t = dayjs(); setParams((prev: any) => ({ ...prev, startDate: t.format('YYYY-MM-DD'), endDate: t.format('YYYY-MM-DD') })); }
                else if (v === 'week') { setParams((prev: any) => ({ ...prev, startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), endDate: dayjs().format('YYYY-MM-DD') })); }
                else if (v === 'month') { setParams((prev: any) => ({ ...prev, startDate: dayjs().startOf('month').format('YYYY-MM-DD'), endDate: dayjs().format('YYYY-MM-DD') })); }
                else if (v === 'clear') { setParams((prev: any) => { const { startDate, endDate, ...rest } = prev; return rest; }); }
              }}
              options={[
                { label: '今天', value: 'today' },
                { label: '近7天', value: 'week' },
                { label: '本月', value: 'month' },
                { label: '清除', value: 'clear' },
              ]} />
          </Col>
        </Row>
        <Table dataSource={data?.items || []} columns={columns} rowKey="id" loading={isLoading}
          pagination={{ current: params.page, pageSize: params.pageSize, total: data?.total, onChange: (page, pageSize) => setParams((prev: any) => ({ ...prev, page, pageSize })) }} />
      </Card>
      <Modal title={editing ? '编辑流水' : '新增流水'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="type" label="类型" rules={[{ required: true }]}><Select options={[{ value: 'INCOME', label: '收入' }, { value: 'EXPENSE', label: '支出' }, { value: 'TRANSFER', label: '转账' }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="direction" label="方向" rules={[{ required: true }]}><Select options={[{ value: 'IN', label: '流入' }, { value: 'OUT', label: '流出' }]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="amount" label="金额" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
            <Col span={12}><Form.Item name="date" label="日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="accountId" label="账户" rules={[{ required: true }]}><Select options={accounts?.map((a: any) => ({ value: a.id, label: a.name }))} /></Form.Item>
          <Form.Item name="counterpartyId" label="往来单位"><Select allowClear options={counterparties?.map((c: any) => ({ value: c.id, label: c.name }))} /></Form.Item>
          <Form.Item name="description" label="摘要"><Input.TextArea /></Form.Item>
          <Form.Item name="projectName" label="关联项目"><Input placeholder="输入项目名称（手动）" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
