import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperationLogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { userId: number; action: string; entity?: string; entityId?: number; detail?: string; ip?: string }) {
    return this.prisma.operationLog.create({ data });
  }

  async findAll(page = 1, pageSize = 20, entity?: string) {
    const where = entity ? { entity } : {};
    const [items, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        include: { user: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.operationLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}
