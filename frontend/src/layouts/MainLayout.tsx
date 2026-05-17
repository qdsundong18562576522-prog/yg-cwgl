import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  BookOutlined,
  TeamOutlined,
  DollarOutlined,
  SwapOutlined,
  ReconciliationOutlined,
  FundOutlined,
  FileTextOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  AuditOutlined,
  ProfileOutlined,
  CreditCardOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台' },
  {
    key: 'basic-data', icon: <BookOutlined />, label: '基础数据',
    children: [
      { key: '/subjects', icon: <ProfileOutlined />, label: '会计科目' },
      { key: '/accounts', icon: <BankOutlined />, label: '银行账户' },
      { key: '/counterparties', icon: <TeamOutlined />, label: '往来单位' },
    ],
  },
  {
    key: 'reconciliation', icon: <SwapOutlined />, label: '内部对账',
    children: [
      { key: '/transactions', icon: <DollarOutlined />, label: '内部流水' },
      { key: '/bank-statements', icon: <BankOutlined />, label: '银行流水' },
      { key: '/reconciliation', icon: <ReconciliationOutlined />, label: '对账管理' },
      { key: '/receivables', icon: <AuditOutlined />, label: '应收账款' },
      { key: '/payables', icon: <AuditOutlined />, label: '应付账款' },
    ],
  },
  {
    key: 'fund', icon: <FundOutlined />, label: '资金管理',
    children: [
      { key: '/fund/dashboard', icon: <DashboardOutlined />, label: '资金看板' },
      { key: '/fund/daily-report', icon: <FileTextOutlined />, label: '资金日报' },
      { key: '/fund/project-summary', icon: <FundOutlined />, label: '项目资金' },
    ],
  },
  {
    key: 'financing', icon: <CreditCardOutlined />, label: '融资管理',
    children: [
      { key: '/financing/dashboard', icon: <DashboardOutlined />, label: '融资看板' },
      { key: '/financing/plans', icon: <FileTextOutlined />, label: '融资计划' },
      { key: '/financing/credit-lines', icon: <BankOutlined />, label: '授信额度' },
      { key: '/financing/loans', icon: <DollarOutlined />, label: '贷款合同' },
    ],
  },
  { key: '/reports', icon: <AuditOutlined />, label: '报表中心' },
  { key: '/shareholders', icon: <SafetyOutlined />, label: '股东资金' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const adminItems = user?.role === 'admin'
    ? [{ key: '/users', icon: <SettingOutlined />, label: '用户管理' }]
    : [];

  const items = [...menuItems, ...adminItems];

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/subjects') || path.startsWith('/accounts') || path.startsWith('/counterparties')) return ['basic-data'];
    if (path.startsWith('/transactions') || path.startsWith('/bank') || path.startsWith('/reconciliation') || path.startsWith('/receivables') || path.startsWith('/payables')) return ['reconciliation'];
    if (path.startsWith('/fund')) return ['fund'];
    if (path.startsWith('/financing')) return ['financing'];
    return [];
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: `${user?.displayName} (${user?.role})` },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') logout();
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 16 : 20, fontWeight: 'bold' }}>
          {collapsed ? 'YG' : '扬光财务'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getOpenKeys()}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Dropdown menu={userMenu}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span>{user?.displayName}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
