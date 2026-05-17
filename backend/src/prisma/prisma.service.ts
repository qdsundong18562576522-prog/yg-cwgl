import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

function getUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try { require('dotenv').config(); } catch {}
  return process.env.DATABASE_URL || 'postgresql://postgres:ccb342f4ec414611b5fe85ae5523550d@localhost:5432/yg_cwgl?schema=public';
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = getUrl();
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    super({ adapter } as any);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
