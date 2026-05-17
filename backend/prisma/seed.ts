import "dotenv/config";
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminHash,
      displayName: '超级管理员',
      role: 'admin',
      department: '管理部',
      isActive: true,
    },
  });
  console.log(`  ✅ Admin user: admin / admin123`);

  const financeHash = await bcrypt.hash('finance123', 10);
  await prisma.user.upsert({
    where: { username: 'finance' },
    update: {},
    create: {
      username: 'finance',
      passwordHash: financeHash,
      displayName: '财务专员',
      role: 'finance',
      department: '财务部',
      isActive: true,
    },
  });
  console.log(`  ✅ Finance user: finance / finance123`);

  const leaderHash = await bcrypt.hash('leader123', 10);
  await prisma.user.upsert({
    where: { username: 'leader' },
    update: {},
    create: {
      username: 'leader',
      passwordHash: leaderHash,
      displayName: '领导',
      role: 'leader',
      department: '管理部',
      isActive: true,
    },
  });
  console.log(`  ✅ Leader user: leader / leader123`);

  await prisma.bankAccount.upsert({
    where: { accountNo: '6222021234567890' },
    update: {},
    create: {
      name: '公司基本户',
      accountNo: '6222021234567890',
      bankName: '中国工商银行',
      type: 'CHECKING',
      balance: 500000,
      currency: 'CNY',
    },
  });
  console.log(`  ✅ Bank account created`);

  const accounts = [
    { code: '1001', name: '库存现金', type: 'ASSET' as const, level: 1 },
    { code: '1002', name: '银行存款', type: 'ASSET' as const, level: 1 },
    { code: '1122', name: '应收账款', type: 'ASSET' as const, level: 1 },
    { code: '2202', name: '应付账款', type: 'LIABILITY' as const, level: 1 },
    { code: '6001', name: '主营业务收入', type: 'INCOME' as const, level: 1 },
    { code: '6401', name: '主营业务成本', type: 'EXPENSE' as const, level: 1 },
  ];
  for (const acc of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: acc,
    });
  }
  console.log(`  ✅ Chart of accounts created`);

  await prisma.counterparty.upsert({
    where: { id: 1 },
    update: {},
    create: { name: '深圳科技有限公司', type: 'CUSTOMER', contact: '张经理', phone: '13800138001' },
  });
  await prisma.counterparty.upsert({
    where: { id: 2 },
    update: {},
    create: { name: '北京供应商有限公司', type: 'SUPPLIER', contact: '李经理', phone: '13900139001' },
  });
  console.log(`  ✅ Counterparties created`);

  console.log(`\n🎉 Seed completed!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
