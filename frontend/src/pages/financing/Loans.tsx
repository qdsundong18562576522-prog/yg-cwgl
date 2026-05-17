import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, message, Card, Popconfirm, Tag, Tabs, Descriptions, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, FundOutlined, DollarOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import dayjs from 'dayjs';

const statusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'default' },
  ACTIVE: { label: '放款中', color: 'blue' },
  REPAYING: { label: '还款中', color: 'processing' },
  CLOSED: { label: '已结清', color: 'green' },
  OVERDUE: { label: '逾期', color: 'red' },
};

const repayMethodMap: Record<string, string> = {
  EQUAL_PRINCIPAL: '等额本金',
  EQUAL_INSTALLMENT: '等额本息',
  ONE_TIME: '到期一次还本付息',
};

export default function LoansPage() {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [repayForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => api.get('/financing/loans', { params: { pageSize: 100 } }).then(r => r.data.data),
  });

  const { data: creditLines } = useQuery({ queryKey: ['credit-lines-list'], queryFn: () => api.get('/financing/credit-lines').then(r => r.data.data) });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values, startDate: values.startDate?.toISOString(), endDate: values.endDate?.toISOString() };
      return editing ? api.patch(`/financing/loans/${editing.id}`, payload) : api.post('/financing/loans', payload);
    },
    onSuccess: () => { message.success('保存成功'); setOpen(false); setEditing(null); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['loans'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/financing/loans/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['loans'] }); },
  });

  const generatePlansMutation = useMutation({
    mutationFn: (id: number) => api.post(`/financing/loans/${id}/generate-plans`),
    onSuccess: (res) => { message.success(`已生成 ${res.data.data.length} 期还款计划`); queryClient.invalidateQueries({ queryKey: ['loan-detail'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '生成失败'),
  });

  const repayMutation = useMutation({
    mutationFn: (values: any) => api.post('/financing/repayments', { ...values, loanContractId: selectedLoan?.id, payDate: values.payDate?.toISOString() }),
    onSuccess: () => { message.success('还款记录已保存'); setRepayOpen(false); repayForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['loan-detail'] }); },
  });

  const viewDetail = async (id: number) => {
    const res = await api.get(`/financing/loans/${id}`);
    setSelectedLoan(res.data.data);
    setDetailOpen(true);
  };

  const columns = [
    { title: '合同号', dataIndex: 'contractNo', key: 'contractNo' },
    { title: '银行', dataIndex: 'bankName', key: 'bankName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '利率', dataIndex: 'interestRate', key: 'interestRate', render: (v: string) => `${v}%` },
    { title: '期限', dataIndex: 'termMonths', key: 'termMonths', render: (v: number) => `${v}个月` },
    { title: '还款方式', dataIndex: 'repaymentMethod', key: 'repaymentMethod', render: (v: string) => repayMethodMap[v] || v },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.label || v}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => viewDetail(record.id)}>详情</Button>
          <Button type="link" icon={<FundOutlined />} onClick={() => generatePlansMutation.mutate(record.id)}>生成还款计划</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue({ ...record, startDate: dayjs(record.startDate), endDate: dayjs(record.endDate) }); setOpen(true); }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const planColumns = [
    { title: '期数', dataIndex: 'installmentNo', key: 'no' },
    { title: '到期日', dataIndex: 'dueDate', key: 'dueDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '总额', dataIndex: 'totalAmount', key: 'total', render: (v: string) => parseFloat(v).toLocaleString() },
    { title: '本金', dataIndex: 'principal', key: 'principal', render: (v: string) => parseFloat(v).toLocaleString() },
    { title: '利息', dataIndex: 'interest', key: 'interest', render: (v: string) => parseFloat(v).toLocaleString() },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'PAID' ? 'green' : v === 'OVERDUE' ? 'red' : 'orange'}>{v === 'PAID' ? '已还' : v === 'OVERDUE' ? '逾期' : '待还'}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => record.status !== 'PAID' ? (
        <Button type="link" icon={<DollarOutlined />} onClick={() => { setSelectedPlanId(record.id); repayForm.setFieldsValue({ amount: record.totalAmount, principal: record.principal, interest: record.interest }); setRepayOpen(true); }}>还款</Button>
      ) : null,
    },
  ];

  return (
    <div>
      <Card title="贷款合同管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增贷款</Button>}>
        <Table dataSource={data?.items || []} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title={editing ? '编辑贷款' : '新增贷款'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} width={700}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate} initialValues={{ type: 'LOAN', repaymentMethod: 'EQUAL_INSTALLMENT', termMonths: 12, status: 'ACTIVE' }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="bankName" label="银行" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="creditLineId" label="关联授信"><Select allowClear options={creditLines?.map((c: any) => ({ value: c.id, label: `${c.bankName} (${parseFloat(c.totalAmount).toLocaleString()}元)` }))} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="amount" label="金额" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="interestRate" label="年利率(%)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={0.1} /></Form.Item></Col>
            <Col span={8}><Form.Item name="termMonths" label="期限(月)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="repaymentMethod" label="还款方式"><Select options={[
              { value: 'EQUAL_PRINCIPAL', label: '等额本金' },
              { value: 'EQUAL_INSTALLMENT', label: '等额本息' },
              { value: 'ONE_TIME', label: '到期一次还本付息' },
            ]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="状态"><Select options={[
              { value: 'DRAFT', label: '草稿' }, { value: 'ACTIVE', label: '放款中' }, { value: 'REPAYING', label: '还款中' }, { value: 'CLOSED', label: '已结清' },
            ]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="endDate" label="结束日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="purpose" label="贷款用途"><Input.TextArea /></Form.Item>
          <Form.Item name="collateral" label="抵押物"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title="贷款详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={900}>
        {selectedLoan && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="合同号">{selectedLoan.contractNo}</Descriptions.Item>
              <Descriptions.Item label="银行">{selectedLoan.bankName}</Descriptions.Item>
              <Descriptions.Item label="金额">{parseFloat(selectedLoan.amount).toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="年利率">{selectedLoan.interestRate}%</Descriptions.Item>
              <Descriptions.Item label="期限">{selectedLoan.termMonths} 个月</Descriptions.Item>
              <Descriptions.Item label="还款方式">{repayMethodMap[selectedLoan.repaymentMethod] || selectedLoan.repaymentMethod}</Descriptions.Item>
              <Descriptions.Item label="开始日期">{dayjs(selectedLoan.startDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{dayjs(selectedLoan.endDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[selectedLoan.status]?.color}>{statusMap[selectedLoan.status]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="用途">{selectedLoan.purpose || '-'}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button icon={<FundOutlined />} onClick={() => generatePlansMutation.mutate(selectedLoan.id)}>生成还款计划</Button>
            </div>
            <Table title={() => '还款计划'} dataSource={selectedLoan.repaymentPlans || []} columns={planColumns} rowKey="id" size="small" style={{ marginTop: 16 }} pagination={false} />
            <Table title={() => '还款记录'} dataSource={selectedLoan.repaymentRecords || []} columns={[
              { title: '日期', dataIndex: 'payDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
              { title: '金额', dataIndex: 'amount', render: (v: string) => parseFloat(v).toLocaleString() },
              { title: '本金', dataIndex: 'principal', render: (v: string) => parseFloat(v).toLocaleString() },
              { title: '利息', dataIndex: 'interest', render: (v: string) => parseFloat(v).toLocaleString() },
              { title: '账号', dataIndex: 'paymentAccount' },
            ]} rowKey="id" size="small" pagination={false} />
          </>
        )}
      </Modal>

      <Modal title="录入还款" open={repayOpen} onCancel={() => setRepayOpen(false)} onOk={() => repayForm.submit()}>
        <Form form={repayForm} layout="vertical" onFinish={repayMutation.mutate}>
          <Form.Item name="repaymentPlanId" label="还款计划" initialValue={selectedPlanId} hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="amount" label="还款总额" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="payDate" label="还款日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="principal" label="本金"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="interest" label="利息"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Form.Item name="paymentAccount" label="付款账号"><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
