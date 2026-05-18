import { Card, Row, Col, Select, Button, Statistic, Descriptions, DatePicker } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';
import { useState } from 'react';
import { exportExcel } from '../../utils/export';

export default function ReportsPage() {
  const [accountId, setAccountId] = useState<number | null>(null);
  const [period, setPeriod] = useState(dayjs().format('YYYY-MM'));

  const { data: accounts } = useQuery({ queryKey: ['accounts-list'], queryFn: () => api.get('/accounts').then(r => r.data.data) });

  const { data: reconReport } = useQuery({
    queryKey: ['report-reconciliation', accountId, period],
    queryFn: () => api.get('/reports/reconciliation', { params: { accountId, period } }).then(r => r.data.data),
    enabled: !!accountId,
  });

  const { data: arApReport } = useQuery({
    queryKey: ['report-arap'],
    queryFn: () => api.get('/reports/ar-ap').then(r => r.data.data),
  });

  const exportRecon = () => {
    if (!reconReport) return;
    exportExcel({
      title: `对账报告 - ${reconReport.accountName} - ${period}`,
      filename: `对账报告_${period}`,
      columns: [
        { header: '项目', key: 'item', width: 20 },
        { header: '值', key: 'value', width: 30 },
      ],
      data: [
        { item: '账户', value: reconReport.accountName },
        { item: '账号', value: reconReport.accountNo },
        { item: '银行余额', value: reconReport.bankBalance?.toLocaleString() },
        { item: '账面余额', value: reconReport.bookBalance?.toLocaleString() },
        { item: '差异', value: reconReport.difference?.toLocaleString() },
        { item: '状态', value: reconReport.status === 'CONFIRMED' ? '已确认' : '待确认' },
        { item: '银行流水总数', value: reconReport.totalBankItems },
        { item: '已匹配', value: reconReport.matchedBankItems },
        { item: '未匹配银行流水', value: `${reconReport.unmatchedBankItems} 笔 / ${reconReport.unmatchedBankTotal?.toLocaleString()} 元` },
        { item: '未匹配内部流水', value: `${reconReport.unmatchedBookItems} 笔 / ${reconReport.unmatchedBookTotal?.toLocaleString()} 元` },
      ],
    });
  };

  const exportArAp = () => {
    if (!arApReport) return;
    exportExcel({
      title: '应收应付汇总',
      filename: `应收应付汇总_${dayjs().format('YYYYMMDD')}`,
      columns: [
        { header: '项目', key: 'item', width: 20 },
        { header: '金额', key: 'value', width: 30 },
      ],
      data: [
        { item: '应收总额', value: arApReport.totalReceivable?.toLocaleString() },
        { item: '已收金额', value: arApReport.totalReceived?.toLocaleString() },
        { item: '应收余额', value: arApReport.receivableBalance?.toLocaleString() },
        { item: '应收笔数', value: arApReport.receivableCount },
        { item: '应付总额', value: arApReport.totalPayable?.toLocaleString() },
        { item: '已付金额', value: arApReport.totalPaid?.toLocaleString() },
        { item: '应付余额', value: arApReport.payableBalance?.toLocaleString() },
        { item: '应付笔数', value: arApReport.payableCount },
      ],
    });
  };

  return (
    <div>
      <Card title="对账报告" extra={<Button icon={<DownloadOutlined />} onClick={exportRecon} disabled={!reconReport}>导出 Excel</Button>}>
        <Row gutter={16} align="middle">
          <Col span={6}><Select placeholder="选择账户" style={{ width: '100%' }} onChange={(v) => setAccountId(v)} options={accounts?.map((a: any) => ({ value: a.id, label: a.name }))} /></Col>
          <Col span={4}><DatePicker picker="month" value={dayjs(period)} onChange={(d) => setPeriod(d?.format('YYYY-MM') || dayjs().format('YYYY-MM'))} /></Col>
        </Row>
        {reconReport && (
          <Descriptions bordered column={2} style={{ marginTop: 16 }} size="small">
            <Descriptions.Item label="账户">{reconReport.accountName}</Descriptions.Item>
            <Descriptions.Item label="账号">{reconReport.accountNo}</Descriptions.Item>
            <Descriptions.Item label="银行余额">{reconReport.bankBalance?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="账面余额">{reconReport.bookBalance?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="差异"><span style={{ color: Math.abs(reconReport.difference) > 0.01 ? '#cf1322' : '#3f8600' }}>{reconReport.difference?.toLocaleString()}</span></Descriptions.Item>
            <Descriptions.Item label="状态">{reconReport.status === 'CONFIRMED' ? '已确认' : '待确认'}</Descriptions.Item>
            <Descriptions.Item label="银行流水总数">{reconReport.totalBankItems}</Descriptions.Item>
            <Descriptions.Item label="已匹配">{reconReport.matchedBankItems}</Descriptions.Item>
            <Descriptions.Item label="未匹配银行流水">{reconReport.unmatchedBankItems} 笔 / {reconReport.unmatchedBankTotal?.toLocaleString()} 元</Descriptions.Item>
            <Descriptions.Item label="未匹配内部流水">{reconReport.unmatchedBookItems} 笔 / {reconReport.unmatchedBookTotal?.toLocaleString()} 元</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="应收应付汇总" style={{ marginTop: 16 }} extra={<Button icon={<DownloadOutlined />} onClick={exportArAp} disabled={!arApReport}>导出 Excel</Button>}>
        {arApReport && (
          <Row gutter={16}>
            <Col span={6}><Statistic title="应收总额" value={arApReport.totalReceivable} precision={2} /></Col>
            <Col span={6}><Statistic title="已收金额" value={arApReport.totalReceived} precision={2} styles={{ content: { color: '#3f8600' } }} /></Col>
            <Col span={6}><Statistic title="应收余额" value={arApReport.receivableBalance} precision={2} styles={{ content: { color: arApReport.receivableBalance > 0 ? '#cf1322' : '#3f8600' } }} /></Col>
            <Col span={6}><Statistic title="笔数" value={arApReport.receivableCount} suffix="笔" /></Col>
            <Col span={6}><Statistic title="应付总额" value={arApReport.totalPayable} precision={2} /></Col>
            <Col span={6}><Statistic title="已付金额" value={arApReport.totalPaid} precision={2} styles={{ content: { color: '#3f8600' } }} /></Col>
            <Col span={6}><Statistic title="应付余额" value={arApReport.payableBalance} precision={2} styles={{ content: { color: arApReport.payableBalance > 0 ? '#cf1322' : '#3f8600' } }} /></Col>
            <Col span={6}><Statistic title="笔数" value={arApReport.payableCount} suffix="笔" /></Col>
          </Row>
        )}
      </Card>
    </div>
  );
}
