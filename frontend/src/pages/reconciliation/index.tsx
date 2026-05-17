import { useState } from 'react';
import { Card, Row, Col, Select, Button, Table, Statistic, message, Divider, Space, DatePicker, Descriptions } from 'antd';
import { SwapOutlined, CheckCircleOutlined, LinkOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';
import { exportExcel } from '../../utils/export';

export default function ReconciliationPage() {
  const [accountId, setAccountId] = useState<number | null>(null);
  const [period, setPeriod] = useState(dayjs().format('YYYY-MM'));
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({ queryKey: ['accounts-list'], queryFn: () => api.get('/accounts').then(r => r.data.data) });

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['reconciliation-summary', accountId, period],
    queryFn: () => api.get('/reconciliation/summary', { params: { accountId, period } }).then(r => r.data.data),
    enabled: !!accountId,
  });

  const { data: balanceAdj, refetch: refetchAdj } = useQuery({
    queryKey: ['balance-adjustment', accountId, period],
    queryFn: () => api.get('/reconciliation/balance-adjustment', { params: { accountId, period } }).then(r => r.data.data),
    enabled: !!accountId,
  });

  const autoMatchMutation = useMutation({
    mutationFn: () => api.post('/reconciliation/auto-match', { accountId }),
    onSuccess: (res) => { message.success(`自动匹配完成：${res.data.data.matchedCount} 条`); refetchSummary(); refetchAdj(); },
    onError: (err: any) => message.error(err.response?.data?.message || '匹配失败'),
  });

  const manualMatchMutation = useMutation({
    mutationFn: (data: { statementItemId: number; transactionId: number }) => api.post('/reconciliation/manual-match', data),
    onSuccess: () => { message.success('手工匹配成功'); refetchSummary(); refetchAdj(); },
  });

  const unmatchMutation = useMutation({
    mutationFn: (statementItemId: number) => api.post('/reconciliation/unmatch', { statementItemId }),
    onSuccess: () => { message.success('已取消匹配'); refetchSummary(); refetchAdj(); },
  });

  const saveReconMutation = useMutation({
    mutationFn: () => api.post('/reconciliation/save', {
      accountId, period, bankBalance: summary?.bankBalance || 0, bookBalance: summary?.bookBalance || 0,
    }),
    onSuccess: () => message.success('对账记录已保存'),
  });

  const unmatchedBankColumns = [
    { title: '日期', dataIndex: 'transactionDate', render: (v: string) => dayjs(v).format('MM-DD') },
    { title: '金额', dataIndex: 'amount', render: (v: string) => parseFloat(v).toLocaleString() },
    { title: '摘要', dataIndex: 'description', ellipsis: true },
    { title: '对方', dataIndex: 'counterpartyName' },
    {
      title: '操作', render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => {
          const txId = prompt('输入匹配的内部流水ID:');
          if (txId) manualMatchMutation.mutate({ statementItemId: record.id, transactionId: +txId });
        }}>匹配</Button>
      ),
    },
  ];

  const unmatchedBookColumns = [
    { title: '日期', dataIndex: 'date', render: (v: string) => dayjs(v).format('MM-DD') },
    { title: '金额', dataIndex: 'amount', render: (v: string) => parseFloat(v).toLocaleString() },
    { title: '类型', dataIndex: 'type', render: (v: string) => ({ INCOME: '收入', EXPENSE: '支出', TRANSFER: '转账' })[v] },
    { title: '摘要', dataIndex: 'description', ellipsis: true },
    { title: 'ID', dataIndex: 'id', width: 60 },
  ];

  return (
    <div>
      <Card title="对账管理">
        <Row gutter={16} align="middle">
          <Col span={6}><Select placeholder="选择账户" style={{ width: '100%' }} onChange={(v) => setAccountId(v)} options={accounts?.map((a: any) => ({ value: a.id, label: a.name }))} /></Col>
          <Col span={4}><DatePicker picker="month" value={dayjs(period)} onChange={(d) => setPeriod(d?.format('YYYY-MM') || dayjs().format('YYYY-MM'))} /></Col>
          <Col><Button type="primary" icon={<SwapOutlined />} onClick={() => autoMatchMutation.mutate()} loading={autoMatchMutation.isPending}>自动对账</Button></Col>
          <Col><Button onClick={() => saveReconMutation.mutate()}>保存对账结果</Button></Col>
        </Row>
      </Card>

      {summary && (
        <Card title="对账概览" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={6}><Statistic title="银行余额" value={summary.bankBalance} precision={2} /></Col>
            <Col span={6}><Statistic title="账面余额" value={summary.bookBalance} precision={2} /></Col>
            <Col span={6}><Statistic title="差异" value={summary.difference} precision={2} styles={{ content: { color: Math.abs(summary.difference) > 0.01 ? '#cf1322' : '#3f8600' } }} /></Col>
            <Col span={6}><Statistic title="已匹配" value={summary.matchedCount} suffix={`/ ${summary.matchedCount + summary.unmatchedBankCount}`} /></Col>
          </Row>
        </Card>
      )}

      {balanceAdj && (
        <Card title="余额调节表" style={{ marginTop: 16 }}
          extra={
            <Button size="small" icon={<DownloadOutlined />} onClick={() => {
              exportExcel({
                title: `余额调节表_${balanceAdj.accountName}_${period}`,
                filename: `余额调节表_${period}`,
                columns: [
                  { header: '项目', key: 'item', width: 28 },
                  { header: '金额', key: 'value', width: 28 },
                ],
                data: [
                  { item: '银行对账单余额', value: balanceAdj.bankBalance?.toLocaleString() },
                  { item: '加：企业已收银行未收', value: balanceAdj.bankIncomeNotRecorded?.reduce((s: number, t: any) => s + parseFloat(t.amount), 0).toLocaleString() },
                  { item: '减：企业已付银行未付', value: balanceAdj.bankExpenseNotRecorded?.reduce((s: number, t: any) => s + parseFloat(t.amount), 0).toLocaleString() },
                  { item: '调节后银行余额', value: balanceAdj.adjustedBankBalance?.toLocaleString() },
                  { item: '', value: '' },
                  { item: '企业账面余额', value: balanceAdj.bookBalance?.toLocaleString() },
                  { item: '加：银行已收企业未收', value: balanceAdj.bookIncomeNotRecorded?.reduce((s: number, i: any) => s + parseFloat(i.amount), 0).toLocaleString() },
                  { item: '减：银行已付企业未付', value: balanceAdj.bookExpenseNotRecorded?.reduce((s: number, i: any) => s + Math.abs(parseFloat(i.amount)), 0).toLocaleString() },
                  { item: '调节后账面余额', value: balanceAdj.adjustedBookBalance?.toLocaleString() },
                ],
              });
            }}>导出</Button>
          }>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="银行对账单余额">{balanceAdj.bankBalance?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="企业账面余额">{balanceAdj.bookBalance?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="加：企业已收银行未收">
              {balanceAdj.bankIncomeNotRecorded?.reduce((s: number, t: any) => s + parseFloat(t.amount), 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="加：银行已收企业未收">
              {balanceAdj.bookIncomeNotRecorded?.reduce((s: number, i: any) => s + parseFloat(i.amount), 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="减：企业已付银行未付">
              {balanceAdj.bankExpenseNotRecorded?.reduce((s: number, t: any) => s + parseFloat(t.amount), 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="减：银行已付企业未付">
              {balanceAdj.bookExpenseNotRecorded?.reduce((s: number, i: any) => s + Math.abs(parseFloat(i.amount)), 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="调节后银行余额" labelStyle={{ fontWeight: 'bold' }}>
              <span style={{ color: balanceAdj.isBalanced ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>{balanceAdj.adjustedBankBalance?.toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="调节后账面余额" labelStyle={{ fontWeight: 'bold' }}>
              <span style={{ color: balanceAdj.isBalanced ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>{balanceAdj.adjustedBookBalance?.toLocaleString()}</span>
            </Descriptions.Item>
          </Descriptions>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            {balanceAdj.isBalanced
              ? <span style={{ color: '#3f8600', fontSize: 16 }}><CheckCircleOutlined /> 余额平衡 ✓</span>
              : <span style={{ color: '#cf1322', fontSize: 16 }}>余额不平衡，差异：{(balanceAdj.adjustedBankBalance - balanceAdj.adjustedBookBalance).toFixed(2)}</span>
            }
          </div>
        </Card>
      )}

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="银行未匹配项（银行有、企业无）" size="small">
            <Table dataSource={summary?.unmatchedBankItems || []} columns={unmatchedBankColumns} rowKey="id" size="small" pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="企业未匹配项（企业有、银行无）" size="small">
            <Table dataSource={summary?.unmatchedTransactions || []} columns={unmatchedBookColumns} rowKey="id" size="small" pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
