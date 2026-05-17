import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BankStatementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; pageSize?: number; accountId?: number; startDate?: string; endDate?: string; matchStatus?: string }) {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 20;
    const { accountId, startDate, endDate, matchStatus } = params;
    const where: any = {};
    if (accountId) where.accountId = Number(accountId);
    if (matchStatus) where.matchStatus = matchStatus;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }
    const [items, total] = await Promise.all([
      this.prisma.bankStatementItem.findMany({
        where,
        include: { account: { select: { id: true, name: true } }, matchedTransaction: true },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bankStatementItem.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async importItems(accountId: number, items: any[]) {
    const batch = await this.prisma.importBatch.create({
      data: {
        accountId,
        fileName: items[0]?.fileName || 'manual-import',
        fileType: 'xlsx',
        totalItems: items.length,
        status: 'IMPORTED',
      },
    });
    const created: any[] = [];
    for (const item of items) {
      const stmt = await this.prisma.bankStatementItem.create({
        data: {
          accountId,
          transactionDate: new Date(item.transactionDate),
          amount: item.amount,
          description: item.description || '',
          counterpartyName: item.counterpartyName || '',
          referenceNo: item.referenceNo || '',
          importBatchId: batch.id,
        },
      });
      created.push(stmt);
    }
    return { batch, items: created };
  }

  async removeItem(id: number) {
    return this.prisma.bankStatementItem.delete({ where: { id } });
  }

  async getImportBatches(accountId?: number) {
    const where = accountId ? { accountId } : {};
    return this.prisma.importBatch.findMany({
      where,
      orderBy: { importDate: 'desc' },
      take: 50,
    });
  }
}
