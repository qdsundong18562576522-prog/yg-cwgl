import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, message, Card, Popconfirm, Tag, Timeline, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';

const { TextArea } = Input;

const statusMap: Record<string, { label: string; color: string }> = {
  INITIAL_CONTACT: { label: '初步接洽', color: 'blue' },
  DOCUMENTS: { label: '资料准备', color: 'processing' },
  UNDER_REVIEW: { label: '银行审批中', color: 'orange' },
  APPROVED: { label: '已通过', color: 'green' },
  REJECTED: { label: '已拒绝', color: 'red' },
  CANCELLED: { label: '已取消', color: 'default' },
};

const statusOptions = [
  { value: 'INITIAL_CONTACT', label: '初步接洽' },
  { value: 'DOCUMENTS', label: '资料准备' },
  { value: 'UNDER_REVIEW', label: '银行审批中' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'CANCELLED', label: '已取消' },
];

export default function FinancingPlansPage() {
  const [open, setOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['financing-plans'],
    queryFn: () => api.get('/financing/plans').then(r => r.data.data),
    refetchInterval: 10000,
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        expectedDate: values.expectedDate?.toISOString(),
        _statusDesc: values._statusDesc,
      };
      return editing
        ? api.patch(`/financing/plans/${editing.id}`, payload)
        : api.post('/financing/plans', payload);
    },
    onSuccess: () => {
      message.success('保存成功');
      setOpen(false); setEditing(null); form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['financing-plans'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/financing/plans/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['financing-plans'] }); },
  });

  const showTimeline = (record: any) => {
    setSelectedPlan(record);
    setTimelineOpen(true);
  };

  const columns = [
    { title: '银行', dataIndex: 'bankName', key: 'bankName', width: 140 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (v: string) => ({ LOAN: '贷款', CREDIT_LINE: '授信', BILL: '票据', OTHER: '其他' })[v] || v },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 140, render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    {
      title: '进度', dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.label || v}</Tag>,
    },
    { title: '负责人', dataIndex: 'contactPerson', key: 'contactPerson', width: 100 },
    { title: '预计完成', dataIndex: 'expectedDate', key: 'expectedDate', width: 110, render: (v: string) => v ? dayjs(v).format('MM-DD') : '-' },
    {
      title: '失败原因', dataIndex: 'failReason', key: 'failReason', ellipsis: true,
      render: (v: string, record: any) => record.status === 'REJECTED' ? <span style={{ color: '#cf1322' }}>{v || '未说明'}</span> : '-',
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTimeline(record)}>进度</Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              form.setFieldsValue({ ...record, expectedDate: record.expectedDate ? dayjs(record.expectedDate) : null });
              setOpen(true);
            }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="融资计划" extra={
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
          新增计划
        </Button>
      }>
        <Table dataSource={data || []} columns={columns} rowKey="id" loading={isLoading}
          pagination={false} size="middle" />
      </Card>

      <Modal title={editing ? '编辑融资计划' : '新增融资计划'}
        open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} width={650}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}
          initialValues={{ type: 'LOAN', status: 'INITIAL_CONTACT' }}>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="bankName" label="银行名称" rules={[{ required: true }]}>
              <Input style={{ width: 250 }} placeholder="如：工商银行" />
            </Form.Item>
            <Form.Item name="type" label="融资类型">
              <Select style={{ width: 130 }} options={[
                { value: 'LOAN', label: '贷款' }, { value: 'CREDIT_LINE', label: '授信' },
                { value: 'BILL', label: '票据' }, { value: 'OTHER', label: '其他' },
              ]} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="amount" label="申请金额" rules={[{ required: true }]}>
              <InputNumber style={{ width: 250 }} min={0} />
            </Form.Item>
            <Form.Item name="status" label="当前进度">
              <Select style={{ width: 200 }} options={statusOptions} />
            </Form.Item>
          </Space>
          {/* Show status description only when creating or changing status */}
          {(!editing || form.getFieldValue('status') !== editing?.status) && (
            <Form.Item name="_statusDesc" label="进度说明">
              <Input placeholder="如：已提交营业执照、财务报表等材料" />
            </Form.Item>
          )}
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="contactPerson" label="负责人"><Input style={{ width: 200 }} /></Form.Item>
            <Form.Item name="contactPhone" label="联系电话"><Input style={{ width: 200 }} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="expectedDate" label="预计完成时间"><DatePicker style={{ width: 200 }} /></Form.Item>
            <Form.Item name="interestRate" label="利率(%)"><InputNumber style={{ width: 150 }} min={0} step={0.1} /></Form.Item>
            <Form.Item name="termMonths" label="期限(月)"><InputNumber style={{ width: 130 }} min={1} /></Form.Item>
          </Space>
          <Form.Item name="failReason" label="失败原因（如被拒请填写）">
            <TextArea rows={2} placeholder="银行未通过的原因..." />
          </Form.Item>
          <Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={
        <span><HistoryOutlined /> {selectedPlan?.bankName} - 进度时间线</span>
      } open={timelineOpen} onCancel={() => setTimelineOpen(false)} footer={null}>
        {selectedPlan?.timeline && (() => {
          try {
            const events = JSON.parse(selectedPlan.timeline);
            return (
              <Timeline
                items={events.map((e: any, i: number) => ({
                  color: e.status === 'APPROVED' ? 'green' : e.status === 'REJECTED' ? 'red' : 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{statusMap[e.status]?.label || e.status}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>{dayjs(e.date).format('YYYY-MM-DD HH:mm')}</div>
                      {e.description && <div style={{ color: '#333', marginTop: 4 }}>{e.description}</div>}
                    </div>
                  ),
                }))}
              />
            );
          } catch { return <div style={{ color: '#999' }}>暂无进度记录</div>; }
        })()}
      </Modal>
    </div>
  );
}
