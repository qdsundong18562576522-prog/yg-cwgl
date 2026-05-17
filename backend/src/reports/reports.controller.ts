import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('reconciliation')
  async getReconciliationReport(@Query() query: { accountId: string; period: string }) {
    return { code: 0, data: await this.service.getReconciliationReport(+query.accountId, query.period) };
  }

  @Get('ar-ap')
  async getArApReport(@Query('counterpartyId') counterpartyId?: string) {
    return { code: 0, data: await this.service.getArApReport(counterpartyId ? +counterpartyId : undefined) };
  }
}
