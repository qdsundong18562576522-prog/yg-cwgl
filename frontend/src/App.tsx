import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/login';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/dashboard';
import SubjectsPage from './pages/subjects';
import AccountsPage from './pages/accounts';
import CounterpartiesPage from './pages/counterparties';
import TransactionsPage from './pages/transactions';
import BankStatementsPage from './pages/bank';
import ReconciliationPage from './pages/reconciliation';
import ReceivablesPage from './pages/receivables';
import PayablesPage from './pages/payables';
import FundDashboardPage from './pages/fund/Dashboard';
import FundDailyReportPage from './pages/fund/DailyReport';
import FundProjectSummaryPage from './pages/fund/ProjectSummary';
import ReportsPage from './pages/reports';
import UsersPage from './pages/users';
import FinancingDashboardPage from './pages/financing/Dashboard';
import CreditLinesPage from './pages/financing/CreditLines';
import LoansPage from './pages/financing/Loans';
import FinancingPlansPage from './pages/financing/Plans';
import ShareholdersPage from './pages/shareholders';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return isAuth() ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="counterparties" element={<CounterpartiesPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="bank-statements" element={<BankStatementsPage />} />
        <Route path="reconciliation" element={<ReconciliationPage />} />
        <Route path="receivables" element={<ReceivablesPage />} />
        <Route path="payables" element={<PayablesPage />} />
        <Route path="fund/dashboard" element={<FundDashboardPage />} />
        <Route path="fund/daily-report" element={<FundDailyReportPage />} />
        <Route path="fund/project-summary" element={<FundProjectSummaryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="financing/dashboard" element={<FinancingDashboardPage />} />
        <Route path="financing/credit-lines" element={<CreditLinesPage />} />
        <Route path="financing/loans" element={<LoansPage />} />
        <Route path="financing/plans" element={<FinancingPlansPage />} />
        <Route path="shareholders" element={<ShareholdersPage />} />
      </Route>
    </Routes>
  );
}
