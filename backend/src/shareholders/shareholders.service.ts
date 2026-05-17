import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShareholdersService {
  constructor(private prisma: PrismaService) {}

  async findAllShareholders() {
    return this.prisma.shareholder.findMany({ orderBy: { id: 'asc' } });
  }

  async createShareholder(data: any) {
    return this.prisma.shareholder.create({ data });
  }

  async updateShareholder(id: number, data: any) {
    const shareholder = await this.prisma.shareholder.findUnique({ where: { id } });
    if (!shareholder) throw new NotFoundException('股东不存在');
    return this.prisma.shareholder.update({ where: { id }, data });
  }

  async removeShareholder(id: number) {
    const tx = await this.prisma.shareholderTransaction.count({ where: { shareholderId: id } });
    if (tx > 0) throw new NotFoundException('该股东有关联流水，无法删除');
    return this.prisma.shareholder.delete({ where: { id } });
  }

  async getSummary() {
    const shareholders = await this.prisma.shareholder.findMany({ where: { isActive: true } });
    const txs = await this.prisma.shareholderTransaction.findMany();

    const totalInvestment = txs.filter(t => t.type === 'INVESTMENT').reduce((s, t) => s + Number(t.amount), 0);
    const totalLoan = txs.filter(t => t.type === 'LOAN').reduce((s, t) => s + Number(t.amount), 0);
    const totalLoanRepaid = txs.filter(t => t.type === 'LOAN_REPAYMENT').reduce((s, t) => s + Number(t.amount), 0);
    const totalDividend = txs.filter(t => t.type === 'DIVIDEND').reduce((s, t) => s + Number(t.amount), 0);
    const totalWithdraw = txs.filter(t => t.type === 'WITHDRAW').reduce((s, t) => s + Number(t.amount), 0);

    return {
      shareholderCount: shareholders.length,
      totalInvestment,
      totalLoan,
      outstandingLoan: totalLoan - totalLoanRepaid,
      totalDividend,
      totalWithdraw,
      netFundIn: totalInvestment + totalLoanRepaid - totalLoan - totalDividend - totalWithdraw,
    };
  }

  async findAllTransactions(shareholderId?: number) {
    const where = shareholderId ? { shareholderId } : {};
    return this.prisma.shareholderTransaction.findMany({
      where,
      include: { shareholder: { select: { id: true, name: true } } },
      orderBy: { transDate: 'desc' },
      take: 100,
    });
  }

  async createTransaction(data: { shareholderId: number; type: string; amount: number; direction: string; transDate: string; description?: string; remark?: string }) {
    const { transDate, ...rest } = data;
    return this.prisma.shareholderTransaction.create({
      data: { ...rest, transDate: new Date(transDate) } as any,
      include: { shareholder: { select: { id: true, name: true } } },
    });
  }

  async removeTransaction(id: number) {
    return this.prisma.shareholderTransaction.delete({ where: { id } });
  }
}
