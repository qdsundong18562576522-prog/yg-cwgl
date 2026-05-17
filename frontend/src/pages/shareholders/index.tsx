import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, message, Card, Popconfirm, Row, Col, Statistic, Tabs, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';

const txTypeMap: Record<string, { label: string; color: string }> = {
  INVESTMENT: { label: '股东投资', color: 'green' },
  LOAN: { label: '股东借款', color: 'orange' },
  LOAN_REPAYMENT: { label: '借款归还', color: 'blue' },
  DIVIDEND: { label: '分红', color: 'red' },
  WITHDRAW: { label: '撤资', color: 'default' },
};

export default function ShareholdersPage() {
  const [open, setOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedShareholder, setSelectedShareholder] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [txForm] = Form.useForm();
  const [tabKey, setTabKey] = useState('shareholders');
  const queryClient = useQueryClient();

  const { data: shareholders, isLoading } = useQuery({
    queryKey: ['shareholders'],
    queryFn: () => api.get('/shareholders').then(r => r.data.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['shareholders-summary'],
    queryFn: () => api.get('/shareholders/summary').then(r => r.data.data),
  });

  const { data: transactions } = useQuery({
    queryKey: ['shareholder-transactions', selectedShareholder],
    queryFn: () => api.get('/shareholders/transactions', { params: selectedShareholder ? { shareholderId: selectedShareholder } : {} }).then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values, joinDate: values.joinDate?.toISOString() };
      return editing ? api.patch(`/shareholders/${editing.id}`, payload) : api.post('/shareholders', payload);
    },
    onSuccess: () => {
      message.success('保存成功');
      setOpen(false); setEditing(null); form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
      queryClient.invalidateQueries({ queryKey: ['shareholders-summary'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/shareholders/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['shareholders'] }); },
  });

  const txMutation = useMutation({
    mutationFn: (values: any) => api.post('/shareholders/transactions', { ...values, transDate: values.transDate?.toISOString() }),
    onSuccess: () => {
      message.success('流水已保存');
      setTxOpen(false); txForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['shareholder-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['shareholders-summary'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteTxMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/shareholders/transactions/${id}`),
    onSuccess: () => { message.success('流水已删除'); queryClient.invalidateQueries({ queryKey: ['shareholder-transactions'] }); },
  });

  const shColumns = [
    { title: '股东姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '持股金额', dataIndex: 'shares', key: 'shares', render: (v: string) => v ? `${parseFloat(v).toLocaleString()} 元` : '-' },
    { title: '持股比例', dataIndex: 'shareRatio', key: 'shareRatio', render: (v: string) => v ? `${v}%` : '-' },
    { title: '加入日期', dataIndex: 'joinDate', key: 'joinDate', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '状态', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => v ? '活跃' : ' inactive' },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<DollarOutlined />}
            onClick={() => { setSelectedShareholder(record.id); txForm.setFieldsValue({ shareholderId: record.id }); setTxOpen(true); }}>流水</Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(record); form.setFieldsValue({ ...record, joinDate: record.joinDate ? dayjs(record.joinDate) : null }); setOpen(true); }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const txColumns = [
    { title: '日期', dataIndex: 'transDate', key: 'transDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '股东', dataIndex: ['shareholder', 'name'], key: 'shareholder' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={txTypeMap[v]?.color}>{txTypeMap[v]?.label || v}</Tag> },
    { title: '方向', dataIndex: 'direction', key: 'direction', render: (v: string) => v === 'IN' ? '入金' : '出金' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm title="确认删除该流水？" onConfirm={() => deleteTxMutation.mutate(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    { key: 'shareholders', label: '股东信息' },
    { key: 'transactions', label: '资金流水' },
  ];

  return (
    <div>
      {summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={4}><Card size="small"><Statistic title="股东人数" value={summary.shareholderCount} suffix="人" /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="总投资额" value={summary.totalInvestment} precision={2} styles={{ content: { color: '#3f8600' } }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="借款余额" value={summary.outstandingLoan} precision={2} styles={{ content: { color: summary.outstandingLoan > 0 ? '#cf1322' : '#3f8600' } }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="累计分红" value={summary.totalDividend} precision={2} styles={{ content: { color: '#cf1322' } }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="资金净流入" value={summary.netFundIn} precision={2} styles={{ content: { color: summary.netFundIn >= 0 ? '#3f8600' : '#cf1322' } }} /></Card></Col>
        </Row>
      )}

      <Card extra={
        tabKey === 'shareholders' ? (
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增股东</Button>
        ) : (
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { txForm.resetFields(); setTxOpen(true); }}>新增流水</Button>
        )
      }>
        <Tabs items={tabItems} onChange={(k) => setTabKey(k)} />
        {tabKey === 'shareholders' ? (
          <Table dataSource={shareholders || []} columns={shColumns} rowKey="id" loading={isLoading} pagination={false} />
        ) : (
          <Table dataSource={transactions || []} columns={txColumns} rowKey="id" pagination={false} />
        )}
      </Card>

      <Modal title={editing ? '编辑股东' : '新增股东'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="name" label="股东姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="phone" label="电话"><Input /></Form.Item>
            <Form.Item name="idCard" label="身份证号"><Input /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="shares" label="持股金额"><InputNumber style={{ width: 200 }} min={0} /></Form.Item>
            <Form.Item name="shareRatio" label="持股比例(%)"><InputNumber style={{ width: 150 }} min={0} step={0.1} /></Form.Item>
          </Space>
          <Form.Item name="joinDate" label="加入日期"><DatePicker /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>

      <Modal title="新增资金流水" open={txOpen} onCancel={() => setTxOpen(false)} onOk={() => txForm.submit()} width={550}>
        <Form form={txForm} layout="vertical" onFinish={txMutation.mutate} initialValues={{ direction: 'IN' }}>
          <Form.Item name="shareholderId" label="股东" rules={[{ required: true }]}>
            <Select options={shareholders?.map((s: any) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select style={{ width: 200 }} options={[
                { value: 'INVESTMENT', label: '股东投资' },
                { value: 'LOAN', label: '股东借款' },
                { value: 'LOAN_REPAYMENT', label: '借款归还' },
                { value: 'DIVIDEND', label: '分红' },
                { value: 'WITHDRAW', label: '撤资' },
              ]} />
            </Form.Item>
            <Form.Item name="direction" label="方向">
              <Select style={{ width: 120 }} options={[{ value: 'IN', label: '入金' }, { value: 'OUT', label: '出金' }]} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="amount" label="金额" rules={[{ required: true }]}><InputNumber style={{ width: 200 }} min={0} /></Form.Item>
            <Form.Item name="transDate" label="日期" rules={[{ required: true }]}><DatePicker /></Form.Item>
          </Space>
          <Form.Item name="description" label="说明"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
