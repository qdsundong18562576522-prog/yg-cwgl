import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FundService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const accounts = await this.prisma.bankAccount.findMany({ where: { isActive: true } });
    const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthTransactions = await this.prisma.transaction.findMany({
      where: { date: { gte: startOfMonth } },
    });

    const monthIncome = monthTransactions.filter(t => t.direction === 'IN').reduce((s, t) => s + Number(t.amount), 0);
    const monthExpense = monthTransactions.filter(t => t.direction === 'OUT').reduce((s, t) => s + Number(t.amount), 0);

    return {
      totalBalance,
      monthIncome,
      monthExpense,
      netCashflow: monthIncome - monthExpense,
      accountCount: accounts.length,
      accounts: accounts.map(a => ({ id: a.id, name: a.name, accountNo: a.accountNo, bankName: a.bankName, type: a.type, balance: a.balance })),
    };
  }

  async getDailyReport(date?: string) {
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const accounts = await this.prisma.bankAccount.findMany({ where: { isActive: true } });
    const transactions = await this.prisma.transaction.findMany({
      where: { date: { gte: startOfDay, lt: endOfDay } },
    });

    const accountReports = accounts.map(a => {
      const accountTx = transactions.filter(t => t.accountId === a.id);
      const income = accountTx.filter(t => t.direction === 'IN').reduce((s, t) => s + Number(t.amount), 0);
      const expense = accountTx.filter(t => t.direction === 'OUT').reduce((s, t) => s + Number(t.amount), 0);
      return {
        accountId: a.id,
        accountName: a.name,
        accountNo: a.accountNo,
        openingBalance: Number(a.balance) - income + expense,
        income,
        expense,
        closingBalance: Number(a.balance),
      };
    });

    const totalIncome = accountReports.reduce((s, r) => s + r.income, 0);
    const totalExpense = accountReports.reduce((s, r) => s + r.expense, 0);
    const totalClosing = accountReports.reduce((s, r) => s + r.closingBalance, 0);

    return {
      date: queryDate.toISOString().split('T')[0],
      accounts: accountReports,
      totalIncome,
      totalExpense,
      totalClosing,
    };
  }

  async getProjectFundSummary() {
    const transactions = await this.prisma.transaction.findMany({
      where: { projectId: { not: null } },
      include: { account: { select: { name: true } } },
    });

    const projectMap = new Map<number, { projectId: number; projectName: string; income: number; expense: number }>();
    for (const tx of transactions) {
      if (!tx.projectId) continue;
      if (!projectMap.has(tx.projectId)) {
        projectMap.set(tx.projectId, { projectId: tx.projectId, projectName: tx.projectName || `项目 #${tx.projectId}`, income: 0, expense: 0 });
      }
      const p = projectMap.get(tx.projectId)!;
      if (tx.direction === 'IN') p.income += Number(tx.amount);
      else p.expense += Number(tx.amount);
    }

    return {
      projects: Array.from(projectMap.values()),
      totalIncome: Array.from(projectMap.values()).reduce((s, p) => s + p.income, 0),
      totalExpense: Array.from(projectMap.values()).reduce((s, p) => s + p.expense, 0),
    };
  }
}
