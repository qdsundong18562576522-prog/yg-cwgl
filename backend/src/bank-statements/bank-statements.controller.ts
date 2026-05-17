import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BankStatementsService } from './bank-statements.service';

@Controller('bank-statements')
@UseGuards(JwtAuthGuard)
export class BankStatementsController {
  constructor(private service: BankStatementsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return { code: 0, data: await this.service.findAll(query) };
  }

  @Post('import')
  async importItems(@Body() body: { accountId: number; items: any[] }) {
    return { code: 0, data: await this.service.importItems(body.accountId, body.items) };
  }

  @Delete(':id')
  async removeItem(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.removeItem(id) };
  }

  @Get('import-batches')
  async getImportBatches(@Query('accountId') accountId?: string) {
    return { code: 0, data: await this.service.getImportBatches(accountId ? +accountId : undefined) };
  }
}
