import { Card, Row, Col, Statistic, Typography } from 'antd';
import { BankOutlined, ArrowUpOutlined, ArrowDownOutlined, FundOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Pie } from '@ant-design/charts';
import api from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: fundData } = useQuery({
    queryKey: ['fund-dashboard'],
    queryFn: () => api.get('/fund/dashboard').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const pieData = (fundData?.accounts || []).map((a: any) => ({
    type: a.name,
    value: parseFloat(a.balance),
  }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>欢迎回来，{user?.displayName}</Title>
        <p style={{ color: '#666' }}>今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总账户余额" value={fundData?.totalBalance || 0} prefix={<BankOutlined />} suffix="元" precision={2} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月收入" value={fundData?.monthIncome || 0} prefix={<ArrowUpOutlined />} styles={{ content: { color: '#3f8600' } }} precision={2} suffix="元" /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月支出" value={fundData?.monthExpense || 0} prefix={<ArrowDownOutlined />} styles={{ content: { color: '#cf1322' } }} precision={2} suffix="元" /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="账户数量" value={fundData?.accountCount || 0} prefix={<FundOutlined />} suffix="个" /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="各账户余额分布">
            {pieData.length > 0 ? (
              <Pie
                data={pieData}
                angleField="value"
                colorField="type"
                radius={0.8}
                label={{ text: ({ type, value }: any) => `${type}\n${value.toLocaleString()}元`, style: { fontSize: 12 } }}
                legend={{ color: { title: false, position: 'bottom' } }}
              />
            ) : <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无数据</div>}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="快捷操作">
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}><a href="/transactions">录入内部流水</a></Col>
              <Col span={12}><a href="/bank-statements">导入银行流水</a></Col>
              <Col span={12}><a href="/reconciliation">执行对账</a></Col>
              <Col span={12}><a href="/reports">查看报表</a></Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
