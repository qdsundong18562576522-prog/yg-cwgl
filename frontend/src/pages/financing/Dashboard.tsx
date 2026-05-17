import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd';
import { BankOutlined, DollarOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function FinancingDashboardPage() {
  const { data } = useQuery({
    queryKey: ['financing-dashboard'],
    queryFn: () => api.get('/financing/dashboard').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const repayColumns = [
    { title: '合同号', dataIndex: ['loanContract', 'contractNo'], key: 'no' },
    { title: '银行', dataIndex: ['loanContract', 'bankName'], key: 'bank' },
    { title: '到期日', dataIndex: 'dueDate', key: 'dueDate', render: (v: string) => dayjs(v).format('MM-DD') },
    { title: '金额', dataIndex: 'totalAmount', key: 'amount', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'PAID' ? 'green' : 'orange'}>{v === 'PAID' ? '已还' : '待还'}</Tag> },
  ];

  return (
    <div>
      <Title level={4}>融资管理看板</Title>
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="进行中贷款" value={data?.activeLoans || 0} prefix={<BankOutlined />} suffix="笔" /></Card></Col>
        <Col span={6}><Card><Statistic title="贷款总额" value={data?.totalLoanAmount || 0} prefix={<DollarOutlined />} precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="授信总额" value={data?.totalCreditLine || 0} prefix={<BankOutlined />} precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="逾期笔数" value={data?.overduePlans || 0} prefix={<WarningOutlined />} styles={{ content: { color: (data?.overduePlans || 0) > 0 ? '#cf1322' : '#3f8600' } }} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={`近期待还款（${data?.upcomingRepayments?.length || 0} 笔，合计 ${(data?.upcomingTotal || 0).toLocaleString()} 元）`} size="small">
            <Table dataSource={data?.upcomingRepayments || []} columns={repayColumns} rowKey="id" size="small" pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
