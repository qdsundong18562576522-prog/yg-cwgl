import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bankAccount.findMany({ orderBy: { id: 'asc' } });
  }

  async create(data: { name: string; accountNo: string; bankName: string; type?: any; balance?: number; currency?: string; remark?: string }) {
    return this.prisma.bankAccount.create({ data });
  }

  async update(id: number, data: any) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('账户不存在');
    return this.prisma.bankAccount.update({ where: { id }, data });
  }

  async remove(id: number) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('账户不存在');
    const txCount = await this.prisma.transaction.count({ where: { accountId: id } });
    if (txCount > 0) throw new NotFoundException('该账户有关联流水，无法删除');
    return this.prisma.bankAccount.delete({ where: { id } });
  }
}
