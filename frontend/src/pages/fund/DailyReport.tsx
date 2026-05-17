import { useState } from 'react';
import { Card, DatePicker, Table, Statistic, Row, Col, Button, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';

export default function FundDailyReportPage() {
  const [date, setDate] = useState(dayjs());

  const { data, isLoading } = useQuery({
    queryKey: ['fund-daily-report', date.format('YYYY-MM-DD')],
    queryFn: () => api.get('/fund/daily-report', { params: { date: date.format('YYYY-MM-DD') } }).then(r => r.data.data),
  });

  const columns = [
    { title: '账户', dataIndex: 'accountName', key: 'accountName' },
    { title: '期初余额', dataIndex: 'openingBalance', key: 'openingBalance', render: (v: number) => v.toLocaleString() },
    { title: '收入', dataIndex: 'income', key: 'income', render: (v: number) => <span style={{ color: '#3f8600' }}>{v.toLocaleString()}</span> },
    { title: '支出', dataIndex: 'expense', key: 'expense', render: (v: number) => <span style={{ color: '#cf1322' }}>{v.toLocaleString()}</span> },
    { title: '期末余额', dataIndex: 'closingBalance', key: 'closingBalance', render: (v: number) => <strong>{v.toLocaleString()}</strong> },
  ];

  return (
    <div>
      <Card title="资金日报">
        <div style={{ marginBottom: 16 }}>
          <DatePicker value={date} onChange={(d) => d && setDate(d)} allowClear={false} />
        </div>
        {data && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}><Statistic title="总收入" value={data.totalIncome} prefix="+" /></Col>
              <Col span={6}><Statistic title="总支出" value={data.totalExpense} prefix="-" /></Col>
              <Col span={6}><Statistic title="期末总余额" value={data.totalClosing} /></Col>
            </Row>
            <Table dataSource={data.accounts || []} columns={columns} rowKey="accountId" loading={isLoading} pagination={false} />
          </>
        )}
      </Card>
    </div>
  );
}
