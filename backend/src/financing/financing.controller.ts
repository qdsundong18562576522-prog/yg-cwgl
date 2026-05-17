import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinancingService } from './financing.service';

@Controller('financing')
@UseGuards(JwtAuthGuard)
export class FinancingController {
  constructor(private service: FinancingService) {}

  // 授信额度
  @Get('credit-lines')
  async findAllCreditLines() {
    return { code: 0, data: await this.service.findAllCreditLines() };
  }

  @Post('credit-lines')
  async createCreditLine(@Body() body: any) {
    return { code: 0, data: await this.service.createCreditLine(body) };
  }

  @Patch('credit-lines/:id')
  async updateCreditLine(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateCreditLine(id, body) };
  }

  @Delete('credit-lines/:id')
  async removeCreditLine(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.removeCreditLine(id) };
  }

  // 贷款合同
  @Get('loans')
  async findAllLoans(@Query() query: any) {
    return { code: 0, data: await this.service.findAllLoanContracts(query) };
  }

  @Get('loans/:id')
  async getLoan(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.getLoanContract(id) };
  }

  @Post('loans')
  async createLoan(@Body() body: any) {
    return { code: 0, data: await this.service.createLoanContract(body) };
  }

  @Patch('loans/:id')
  async updateLoan(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateLoanContract(id, body) };
  }

  @Delete('loans/:id')
  async removeLoan(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.removeLoanContract(id) };
  }

  // 还款计划
  @Post('loans/:id/generate-plans')
  async generatePlans(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.generateRepaymentPlans(id) };
  }

  // 还款记录
  @Post('repayments')
  async createRepayment(@Body() body: any) {
    return { code: 0, data: await this.service.createRepayment(body) };
  }

  // 融资成本
  @Get('costs')
  async getCosts(@Query('loanContractId') loanContractId?: string) {
    return { code: 0, data: await this.service.getCostSummary(loanContractId ? +loanContractId : undefined) };
  }

  // 融资计划
  @Get('plans')
  async findAllPlans() {
    return { code: 0, data: await this.service.findAllPlans() };
  }

  @Post('plans')
  async createPlan(@Body() body: any) {
    return { code: 0, data: await this.service.createPlan(body) };
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updatePlan(id, body) };
  }

  @Delete('plans/:id')
  async removePlan(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.removePlan(id) };
  }

  // 仪表盘
  @Get('dashboard')
  async getDashboard() {
    return { code: 0, data: await this.service.getDashboard() };
  }
}
