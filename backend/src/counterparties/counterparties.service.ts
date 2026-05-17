import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CounterpartiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string) {
    const where = type ? { type: type as any } : {};
    return this.prisma.counterparty.findMany({ where, orderBy: { id: 'asc' } });
  }

  async create(data: { name: string; type: any; contact?: string; phone?: string; address?: string; remark?: string }) {
    return this.prisma.counterparty.create({ data: { ...data, type: data.type || 'CUSTOMER' } });
  }

  async update(id: number, data: any) {
    const cp = await this.prisma.counterparty.findUnique({ where: { id } });
    if (!cp) throw new NotFoundException('往来单位不存在');
    return this.prisma.counterparty.update({ where: { id }, data });
  }

  async remove(id: number) {
    const cp = await this.prisma.counterparty.findUnique({ where: { id } });
    if (!cp) throw new NotFoundException('往来单位不存在');
    return this.prisma.counterparty.delete({ where: { id } });
  }
}
