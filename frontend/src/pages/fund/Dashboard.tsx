import { Card, Row, Col, Statistic, Table, Typography } from 'antd';
import { BankOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

const { Title } = Typography;

export default function FundDashboardPage() {
  const { data } = useQuery({
    queryKey: ['fund-dashboard'],
    queryFn: () => api.get('/fund/dashboard').then(r => r.data.data),
    refetchInterval: 60000,
  });

  const accountColumns = [
    { title: '账户名称', dataIndex: 'name', key: 'name' },
    { title: '账号', dataIndex: 'accountNo', key: 'accountNo' },
    { title: '开户行', dataIndex: 'bankName', key: 'bankName' },
    { title: '余额', dataIndex: 'balance', key: 'balance', render: (v: string) => <strong>{parseFloat(v).toLocaleString()} 元</strong> },
  ];

  return (
    <div>
      <Title level={4}>资金看板</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总余额" value={data?.totalBalance || 0} prefix={<BankOutlined />} precision={2} suffix="元" /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月收入" value={data?.monthIncome || 0} prefix={<ArrowUpOutlined />} styles={{ content: { color: '#3f8600' } }} precision={2} suffix="元" /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月支出" value={data?.monthExpense || 0} prefix={<ArrowDownOutlined />} styles={{ content: { color: '#cf1322' } }} precision={2} suffix="元" /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="净现金流" value={data?.netCashflow || 0} precision={2} suffix="元" styles={{ content: { color: (data?.netCashflow || 0) >= 0 ? '#3f8600' : '#cf1322' } }} /></Card>
        </Col>
      </Row>
      <Card title="各账户余额" style={{ marginTop: 16 }}>
        <Table dataSource={data?.accounts || []} columns={accountColumns} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
