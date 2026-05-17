import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; pageSize?: number; counterpartyId?: number; status?: string; projectId?: number }) {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 20;
    const { counterpartyId, status, projectId } = params;
    const where: any = {};
    if (counterpartyId) where.counterpartyId = Number(counterpartyId);
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const [items, total] = await Promise.all([
      this.prisma.payable.findMany({
        where,
        include: { counterparty: { select: { id: true, name: true } }, writes: true },
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.payable.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async create(data: any) {
    return this.prisma.payable.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.payable.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.payable.delete({ where: { id } });
  }

  async writeOff(id: number, amount: number, writeDate: string, description?: string) {
    const payable = await this.prisma.payable.findUnique({ where: { id } });
    if (!payable) throw new Error('应付记录不存在');
    const newPaid = Number(payable.paidAmount) + Number(amount);
    const newStatus = newPaid >= Number(payable.amount) ? 'SETTLED' : 'PARTIAL';
    await this.prisma.write.create({
      data: { type: 'PAYMENT', payableId: id, amount, writeDate: new Date(writeDate), description },
    });
    return this.prisma.payable.update({
      where: { id },
      data: { paidAmount: newPaid, status: newStatus },
    });
  }

  async getAgingAnalysis() {
    const payables = await this.prisma.payable.findMany({
      where: { status: { not: 'SETTLED' } },
      include: { counterparty: { select: { name: true } } },
    });
    const now = new Date();
    const buckets = [
      { label: '0-30天', min: 0, max: 30, items: [] as any[], total: 0 },
      { label: '31-60天', min: 31, max: 60, items: [] as any[], total: 0 },
      { label: '61-90天', min: 61, max: 90, items: [] as any[], total: 0 },
      { label: '90天以上', min: 91, max: Infinity, items: [] as any[], total: 0 },
    ];
    for (const p of payables) {
      const days = Math.floor((now.getTime() - new Date(p.dueDate).getTime()) / 86400000);
      const bucket = buckets.find(b => days >= b.min && days <= b.max);
      if (bucket) {
        bucket.items.push(p);
        bucket.total += Number(p.amount) - Number(p.paidAmount);
      }
    }
    return buckets;
  }
}
