import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getReconciliationReport(accountId: number, period: string) {
    const reconciliation = await this.prisma.reconciliation.findFirst({
      where: { accountId, period },
      include: { adjustments: true, account: true },
    });

    const bankItems = await this.prisma.bankStatementItem.findMany({
      where: { accountId },
      include: { matchedTransaction: true },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: { accountId },
    });

    const unmatchedBank = bankItems.filter(i => i.matchStatus === 'UNMATCHED');
    const unmatchedBook = transactions.filter(t => t.reconciliationStatus === 'UNRECONCILED');

    return {
      reportTitle: `银行对账报告 - ${period}`,
      accountName: reconciliation?.account?.name,
      accountNo: reconciliation?.account?.accountNo,
      period,
      bankBalance: reconciliation?.bankBalance || 0,
      bookBalance: reconciliation?.bookBalance || 0,
      difference: reconciliation?.difference || 0,
      status: reconciliation?.status || 'PENDING',
      totalBankItems: bankItems.length,
      matchedBankItems: bankItems.filter(i => i.matchStatus !== 'UNMATCHED').length,
      unmatchedBankItems: unmatchedBank.length,
      unmatchedBankTotal: unmatchedBank.reduce((s, i) => s + Number(i.amount), 0),
      totalBookItems: transactions.length,
      matchedBookItems: transactions.filter(t => t.reconciliationStatus === 'RECONCILED').length,
      unmatchedBookItems: unmatchedBook.length,
      unmatchedBookTotal: unmatchedBook.reduce((s, t) => s + (t.direction === 'IN' ? Number(t.amount) : -Number(t.amount)), 0),
      adjustments: reconciliation?.adjustments || [],
      createdAt: reconciliation?.createdAt,
    };
  }

  async getArApReport(counterpartyId?: number) {
    const where = counterpartyId ? { counterpartyId } : {};
    const [receivables, payables] = await Promise.all([
      this.prisma.receivable.findMany({ where, include: { counterparty: { select: { name: true } } } }),
      this.prisma.payable.findMany({ where, include: { counterparty: { select: { name: true } } } }),
    ]);

    const totalReceivable = receivables.reduce((s, r) => s + Number(r.amount), 0);
    const totalReceived = receivables.reduce((s, r) => s + Number(r.receivedAmount), 0);
    const totalPayable = payables.reduce((s, p) => s + Number(p.amount), 0);
    const totalPaid = payables.reduce((s, p) => s + Number(p.paidAmount), 0);

    return {
      receivableCount: receivables.length,
      totalReceivable,
      totalReceived,
      receivableBalance: totalReceivable - totalReceived,
      payableCount: payables.length,
      totalPayable,
      totalPaid,
      payableBalance: totalPayable - totalPaid,
    };
  }
}
