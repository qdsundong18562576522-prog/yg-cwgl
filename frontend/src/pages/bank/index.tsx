import { useState } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, Space, message, Card, Upload, Row, Col, Popconfirm, Radio, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

export default function BankStatementsPage() {
  const [params, setParams] = useState<any>({ page: 1, pageSize: 20 });
  const [importOpen, setImportOpen] = useState(false);
  const [importAccountId, setImportAccountId] = useState<number | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bank-statements', params],
    queryFn: () => api.get('/bank-statements', { params }).then(r => r.data.data),
  });

  const { data: accounts } = useQuery({ queryKey: ['accounts-list'], queryFn: () => api.get('/accounts').then(r => r.data.data) });

  const importMutation = useMutation({
    mutationFn: (body: { accountId: number; items: any[] }) => api.post('/bank-statements/import', body),
    onSuccess: () => { message.success('导入成功'); setImportOpen(false); setImportData([]); queryClient.invalidateQueries({ queryKey: ['bank-statements'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '导入失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/bank-statements/${id}`),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['bank-statements'] }); },
    onError: (err: any) => message.error(err.response?.data?.message || '删除失败'),
  });

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      setImportData(json.map((r: any) => ({
        transactionDate: r['交易日期'] || r['日期'] || r['date'],
        amount: r['金额'] || r['amount'],
        description: r['摘要'] || r['description'] || r['用途'] || '',
        counterpartyName: r['对方'] || r['对方户名'] || r['counterparty'] || '',
        referenceNo: r['交易号'] || r['参考号'] || r['refNo'] || '',
      })));
      message.success(`已解析 ${json.length} 条记录`);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const columns = [
    { title: '交易日期', dataIndex: 'transactionDate', key: 'transactionDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: string) => `${parseFloat(v).toLocaleString()} 元` },
    { title: '摘要', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '对方', dataIndex: 'counterpartyName', key: 'counterpartyName' },
    { title: '参考号', dataIndex: 'referenceNo', key: 'referenceNo' },
    { title: '匹配状态', dataIndex: 'matchStatus', key: 'matchStatus', render: (v: string) => ({ UNMATCHED: '未匹配', MANUALLY_MATCHED: '手工匹配', AUTO_MATCHED: '自动匹配' })[v] || v },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card title="银行流水" extra={<Button type="primary" icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>导入流水</Button>}>
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col span={5}><Select placeholder="账户" allowClear style={{ width: '100%' }} onChange={(v) => setParams((prev: any) => ({ ...prev, accountId: v }))} options={accounts?.map((a: any) => ({ value: a.id, label: a.name }))} /></Col>
          <Col span={5}><Select placeholder="匹配状态" allowClear style={{ width: '100%' }} onChange={(v) => setParams((prev: any) => ({ ...prev, matchStatus: v }))} options={[{ value: 'UNMATCHED', label: '未匹配' }, { value: 'AUTO_MATCHED', label: '自动匹配' }, { value: 'MANUALLY_MATCHED', label: '手工匹配' }]} /></Col>
          <Col><Button onClick={() => setParams({ page: 1, pageSize: 20 })}>重置</Button></Col>
        </Row>
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col><DatePicker placeholder="开始日期" onChange={(d) => setParams((prev: any) => ({ ...prev, startDate: d?.format('YYYY-MM-DD') }))} /></Col>
          <Col><DatePicker placeholder="结束日期" onChange={(d) => setParams((prev: any) => ({ ...prev, endDate: d?.format('YYYY-MM-DD') }))} /></Col>
          <Col>
            <Radio.Group size="small" optionType="button" buttonStyle="solid"
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'today') { const t = dayjs(); setParams((prev: any) => ({ ...prev, startDate: t.format('YYYY-MM-DD'), endDate: t.format('YYYY-MM-DD') })); }
                else if (v === 'week') { setParams((prev: any) => ({ ...prev, startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), endDate: dayjs().format('YYYY-MM-DD') })); }
                else if (v === 'month') { setParams((prev: any) => ({ ...prev, startDate: dayjs().startOf('month').format('YYYY-MM-DD'), endDate: dayjs().format('YYYY-MM-DD') })); }
                else if (v === 'clear') { setParams((prev: any) => { const { startDate, endDate, ...rest } = prev; return rest; }); }
              }}
              options={[
                { label: '今天', value: 'today' },
                { label: '近7天', value: 'week' },
                { label: '本月', value: 'month' },
                { label: '清除', value: 'clear' },
              ]} />
          </Col>
        </Row>
        <Table dataSource={data?.items || []} columns={columns} rowKey="id" loading={isLoading}
          pagination={{ current: params.page, pageSize: params.pageSize, total: data?.total, onChange: (page, pageSize) => setParams((prev: any) => ({ ...prev, page, pageSize })) }} />
      </Card>
      <Modal title="导入银行流水" open={importOpen} onCancel={() => { setImportOpen(false); setImportData([]); }} onOk={() => importAccountId && importMutation.mutate({ accountId: importAccountId, items: importData })} confirmLoading={importMutation.isPending} width={600}>
        <Form layout="vertical">
          <Form.Item label="选择账户" required>
            <Select placeholder="请选择账户" onChange={(v) => setImportAccountId(v)} options={accounts?.map((a: any) => ({ value: a.id, label: a.name }))} />
          </Form.Item>
          <Form.Item label="上传 Excel 文件">
            <Upload beforeUpload={handleFileUpload} accept=".xlsx,.xls,.csv" maxCount={1} showUploadList={true}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          {importData.length > 0 && (
            <Table dataSource={importData.slice(0, 5)} columns={[
              { title: '日期', dataIndex: 'transactionDate', render: (v: string) => v?.substring(0, 10) },
              { title: '金额', dataIndex: 'amount' },
              { title: '摘要', dataIndex: 'description', ellipsis: true },
            ]} rowKey="transactionDate" pagination={false} size="small" />
          )}
          {importData.length > 0 && <div style={{ marginTop: 8, color: '#666' }}>共 {importData.length} 条记录</div>}
        </Form>
      </Modal>
    </div>
  );
}
