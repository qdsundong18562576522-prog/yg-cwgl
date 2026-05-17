import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, displayName: true, role: true, department: true, phone: true, isActive: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  }

  async create(data: { username: string; password: string; displayName: string; role: any; department?: string; phone?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (existing) throw new BadRequestException('用户名已存在');
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { ...data, passwordHash },
      select: { id: true, username: true, displayName: true, role: true, department: true, phone: true, isActive: true, createdAt: true },
    });
  }

  async update(id: number, data: { displayName?: string; role?: any; department?: string; phone?: string; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, displayName: true, role: true, department: true, phone: true, isActive: true, createdAt: true },
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    if (user.username === 'admin') throw new BadRequestException('admin 账号不可删除');
    return this.prisma.user.delete({ where: { id } });
  }
}
