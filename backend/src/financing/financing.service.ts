import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancingService {
  constructor(private prisma: PrismaService) {}

  // ===== 授信额度 =====
  async findAllCreditLines() {
    return this.prisma.creditLine.findMany({ orderBy: { id: 'asc' } });
  }

  async createCreditLine(data: any) {
    return this.prisma.creditLine.create({ data });
  }

  async updateCreditLine(id: number, data: any) {
    const item = await this.prisma.creditLine.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('授信额度不存在');
    return this.prisma.creditLine.update({ where: { id }, data });
  }

  async removeCreditLine(id: number) {
    return this.prisma.creditLine.delete({ where: { id } });
  }

  // ===== 贷款合同 =====
  async findAllLoanContracts(params: { page?: number; pageSize?: number; status?: string }) {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 20;
    const where: any = {};
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.loanContract.findMany({
        where,
        include: { creditLine: { select: { bankName: true } } },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.loanContract.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async createLoanContract(data: any) {
    const code = await this.generateContractNo();
    return this.prisma.loanContract.create({ data: { ...data, contractNo: code } });
  }

  async getLoanContract(id: number) {
    const item = await this.prisma.loanContract.findUnique({
      where: { id },
      include: {
        creditLine: true,
        repaymentPlans: { orderBy: { installmentNo: 'asc' } },
        repaymentRecords: { orderBy: { payDate: 'desc' } },
        financingCosts: { orderBy: { occurDate: 'desc' } },
      },
    });
    if (!item) throw new NotFoundException('贷款合同不存在');
    return item;
  }

  async updateLoanContract(id: number, data: any) {
    const item = await this.prisma.loanContract.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('贷款合同不存在');
    return this.prisma.loanContract.update({ where: { id }, data });
  }

  async removeLoanContract(id: number) {
    await this.prisma.repaymentPlan.deleteMany({ where: { loanContractId: id } });
    await this.prisma.repaymentRecord.deleteMany({ where: { loanContractId: id } });
    await this.prisma.financingCost.deleteMany({ where: { loanContractId: id } });
    return this.prisma.loanContract.delete({ where: { id } });
  }

  // ===== 还款计划 =====
  async generateRepaymentPlans(loanContractId: number) {
    const loan = await this.prisma.loanContract.findUnique({ where: { id: loanContractId } });
    if (!loan) throw new NotFoundException('贷款合同不存在');

    // Delete existing plans
    await this.prisma.repaymentPlan.deleteMany({ where: { loanContractId } });

    const principal = Number(loan.amount);
    const rate = Number(loan.interestRate) / 100 / 12;
    const months = loan.termMonths;
    const plans: { loanContractId: number; installmentNo: number; dueDate: Date; totalAmount: number; principal: number; interest: number }[] = [];

    if (loan.repaymentMethod === 'ONE_TIME') {
      const totalInterest = principal * Number(loan.interestRate) / 100 * months / 12;
      plans.push({
        loanContractId,
        installmentNo: 1,
        dueDate: loan.endDate,
        totalAmount: principal + totalInterest,
        principal,
        interest: totalInterest,
      });
    } else if (loan.repaymentMethod === 'EQUAL_INSTALLMENT') {
      const monthlyPayment = principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
      let remaining = principal;
      for (let i = 1; i <= months; i++) {
        const interestAmt = remaining * rate;
        const principalAmt = monthlyPayment - interestAmt;
        remaining -= principalAmt;
        const dueDate = new Date(loan.startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        plans.push({
          loanContractId,
          installmentNo: i,
          dueDate,
          totalAmount: Math.round(monthlyPayment * 100) / 100,
          principal: Math.round(principalAmt * 100) / 100,
          interest: Math.round(interestAmt * 100) / 100,
        });
      }
    } else {
      // EQUAL_PRINCIPAL
      const monthlyPrincipal = principal / months;
      let remaining = principal;
      for (let i = 1; i <= months; i++) {
        const interestAmt = remaining * rate;
        const totalAmt = monthlyPrincipal + interestAmt;
        remaining -= monthlyPrincipal;
        const dueDate = new Date(loan.startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        plans.push({
          loanContractId,
          installmentNo: i,
          dueDate,
          totalAmount: Math.round(totalAmt * 100) / 100,
          principal: Math.round(monthlyPrincipal * 100) / 100,
          interest: Math.round(interestAmt * 100) / 100,
        });
      }
    }

    await this.prisma.repaymentPlan.createMany({ data: plans });
    return this.prisma.repaymentPlan.findMany({
      where: { loanContractId },
      orderBy: { installmentNo: 'asc' },
    });
  }

  // ===== 还款记录 =====
  async createRepayment(data: { repaymentPlanId: number; loanContractId: number; amount: number; principal: number; interest: number; penalty?: number; payDate: string; paymentAccount?: string; remark?: string }) {
    const record = await this.prisma.repaymentRecord.create({ data: { ...data, payDate: new Date(data.payDate) } });

    // Update repayment plan status
    const plan = await this.prisma.repaymentPlan.findUnique({ where: { id: data.repaymentPlanId } });
    if (plan) {
      const totalPaid = Number(plan.principal) + Number(plan.interest);
      const newStatus = Number(data.amount) >= totalPaid ? 'PAID' : 'PARTIAL';
      await this.prisma.repaymentPlan.update({
        where: { id: data.repaymentPlanId },
        data: { status: newStatus as any, paidDate: new Date(data.payDate) },
      });
    }

    // Check if all plans are paid
    const unpaidCount = await this.prisma.repaymentPlan.count({
      where: { loanContractId: data.loanContractId, status: { not: 'PAID' } },
    });
    if (unpaidCount === 0) {
      await this.prisma.loanContract.update({
        where: { id: data.loanContractId },
        data: { status: 'CLOSED' },
      });
    }

    return record;
  }

  // ===== 融资成本 =====
  async getCostSummary(loanContractId?: number) {
    const where = loanContractId ? { loanContractId } : {};
    const costs = await this.prisma.financingCost.findMany({ where, include: { loanContract: { select: { contractNo: true, bankName: true } } }, orderBy: { occurDate: 'desc' } });
    const total = costs.reduce((s, c) => s + Number(c.amount), 0);
    return { items: costs, total, count: costs.length };
  }

  // ===== 融资计划 =====
  async findAllPlans() {
    return this.prisma.financingPlan.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createPlan(data: any) {
    const timeline = JSON.stringify([{
      status: data.status || 'INITIAL_CONTACT',
      date: new Date().toISOString(),
      description: '创建融资计划',
    }]);
    return this.prisma.financingPlan.create({ data: { ...data, timeline } });
  }

  async updatePlan(id: number, data: any) {
    const plan = await this.prisma.financingPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('融资计划不存在');

    // If status changed, append to timeline
    if (data.status && data.status !== plan.status) {
      const existingTimeline = plan.timeline ? JSON.parse(plan.timeline) : [];
      existingTimeline.push({
        status: data.status,
        date: new Date().toISOString(),
        description: data._statusDesc || '',
      });
      data.timeline = JSON.stringify(existingTimeline);
    }
    if (data.status === 'APPROVED') data.completedDate = new Date();
    if (data.status === 'REJECTED') data.completedDate = new Date();

    delete data._statusDesc;
    return this.prisma.financingPlan.update({ where: { id }, data });
  }

  async removePlan(id: number) {
    return this.prisma.financingPlan.delete({ where: { id } });
  }

  // ===== 仪表盘 =====
  async getDashboard() {
    const activeLoans = await this.prisma.loanContract.count({ where: { status: { in: ['ACTIVE', 'REPAYING'] } } });
    const totalLoanAmount = await this.prisma.loanContract.aggregate({ where: { status: { not: 'DRAFT' } }, _sum: { amount: true } });
    const totalCreditLine = await this.prisma.creditLine.aggregate({ _sum: { totalAmount: true, usedAmount: true } });
    const upcomingRepayments = await this.prisma.repaymentPlan.findMany({
      where: { status: 'PENDING', dueDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) } },
      include: { loanContract: { select: { contractNo: true, bankName: true } } },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });
    const upcomingTotal = upcomingRepayments.reduce((s, r) => s + Number(r.totalAmount), 0);
    const overduePlans = await this.prisma.repaymentPlan.count({ where: { status: 'PENDING', dueDate: { lt: new Date() } } });

    return {
      activeLoans,
      totalLoanAmount: totalLoanAmount._sum.amount || 0,
      totalCreditLine: totalCreditLine._sum.totalAmount || 0,
      usedCreditLine: totalCreditLine._sum.usedAmount || 0,
      upcomingRepayments,
      upcomingTotal,
      overduePlans,
    };
  }

  private async generateContractNo(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `DK-${dateStr}-`;
    const last = await this.prisma.loanContract.findFirst({
      where: { contractNo: { startsWith: prefix } },
      orderBy: { contractNo: 'desc' },
      select: { contractNo: true },
    });
    const seq = last ? parseInt(last.contractNo.split('-').pop() || '0', 10) + 1 : 1;
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }
}
