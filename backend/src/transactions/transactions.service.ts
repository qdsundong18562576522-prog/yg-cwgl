import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; pageSize?: number; accountId?: number; type?: string; direction?: string; startDate?: string; endDate?: string; counterpartyId?: number; projectId?: number; reconciliationStatus?: string }) {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 20;
    const { accountId, type, direction, startDate, endDate, counterpartyId, projectId, reconciliationStatus } = params;
    const where: any = {};
    if (accountId) where.accountId = Number(accountId);
    if (type) where.type = type;
    if (direction) where.direction = direction;
    if (counterpartyId) where.counterpartyId = counterpartyId;
    if (projectId) where.projectId = projectId;
    if (reconciliationStatus) where.reconciliationStatus = reconciliationStatus;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { counterparty: { select: { id: true, name: true } }, account: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async create(data: any) {
    return this.prisma.transaction.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.transaction.update({ where: { id }, data });
  }

  async remove(id: number) {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (tx?.reconciliationStatus === 'RECONCILED') {
      throw new Error('已对账的流水不能删除');
    }
    return this.prisma.transaction.delete({ where: { id } });
  }

  async batchImport(dataList: any[]) {
    const results: any[] = [];
    for (const data of dataList) {
      results.push(await this.prisma.transaction.create({ data }));
    }
    return results;
  }
}
