import { Card, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

export default function FundProjectSummaryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['fund-project-summary'],
    queryFn: () => api.get('/fund/project-summary').then(r => r.data.data),
  });

  const columns = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '资金流入', dataIndex: 'income', key: 'income', render: (v: number) => <span style={{ color: '#3f8600' }}>{v.toLocaleString()} 元</span> },
    { title: '资金流出', dataIndex: 'expense', key: 'expense', render: (v: number) => <span style={{ color: '#cf1322' }}>{v.toLocaleString()} 元</span> },
    { title: '净流量', key: 'net', render: (_: any, r: any) => {
      const net = r.income - r.expense;
      return <span style={{ color: net >= 0 ? '#3f8600' : '#cf1322' }}>{net.toLocaleString()} 元</span>;
    }},
  ];

  return (
    <div>
      <Card title="项目资金归集">
        <Table dataSource={data?.projects || []} columns={columns} rowKey="projectId" loading={isLoading} pagination={false} />
      </Card>
    </div>
  );
}
