import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReconciliationService } from './reconciliation.service';

@Controller('reconciliation')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(private service: ReconciliationService) {}

  @Post('auto-match')
  async autoMatch(@Body() body: { accountId: number }) {
    return { code: 0, data: await this.service.autoMatch(body.accountId) };
  }

  @Post('manual-match')
  async manualMatch(@Body() body: { statementItemId: number; transactionId: number }) {
    return { code: 0, data: await this.service.manualMatch(body.statementItemId, body.transactionId) };
  }

  @Post('unmatch')
  async unmatch(@Body() body: { statementItemId: number }) {
    return { code: 0, data: await this.service.unmatch(body.statementItemId) };
  }

  @Get('summary')
  async getReconciliation(@Query() query: { accountId: string; period: string }) {
    return { code: 0, data: await this.service.getReconciliation(+query.accountId, query.period) };
  }

  @Post('save')
  async saveReconciliation(@Body() body: any) {
    return { code: 0, data: await this.service.saveReconciliation(body) };
  }

  @Get('balance-adjustment')
  async getBalanceAdjustment(@Query() query: { accountId: string; period: string }) {
    return { code: 0, data: await this.service.getBalanceAdjustment(+query.accountId, query.period) };
  }
}
