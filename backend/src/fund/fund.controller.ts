import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FundService } from './fund.service';

@Controller('fund')
@UseGuards(JwtAuthGuard)
export class FundController {
  constructor(private service: FundService) {}

  @Get('dashboard')
  async getDashboard() {
    return { code: 0, data: await this.service.getDashboard() };
  }

  @Get('daily-report')
  async getDailyReport(@Query('date') date?: string) {
    return { code: 0, data: await this.service.getDailyReport(date) };
  }

  @Get('project-summary')
  async getProjectFundSummary() {
    return { code: 0, data: await this.service.getProjectFundSummary() };
  }
}
