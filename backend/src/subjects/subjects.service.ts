import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string) {
    const where = type ? { type: type as any } : {};
    return this.prisma.chartOfAccount.findMany({
      where,
      include: { children: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: { code: string; name: string; type: any; level: number; parentId?: number; sortOrder?: number }) {
    return this.prisma.chartOfAccount.create({ data });
  }

  async update(id: number, data: { name?: string; isActive?: boolean; sortOrder?: number }) {
    const account = await this.prisma.chartOfAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('科目不存在');
    return this.prisma.chartOfAccount.update({ where: { id }, data });
  }

  async remove(id: number) {
    const account = await this.prisma.chartOfAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('科目不存在');
    const children = await this.prisma.chartOfAccount.count({ where: { parentId: id } });
    if (children > 0) throw new NotFoundException('请先删除子科目');
    return this.prisma.chartOfAccount.delete({ where: { id } });
  }
}
