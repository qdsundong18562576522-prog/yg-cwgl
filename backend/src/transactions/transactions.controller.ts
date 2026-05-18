import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private service: TransactionsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return { code: 0, data: await this.service.findAll(query) };
  }

  @Post()
  async create(@Body() body: any) {
    return { code: 0, data: await this.service.create(body) };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.update(id, body) };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const role = req.user?.role;
    return { code: 0, data: await this.service.remove(id, role) };
  }

  @Post('batch-import')
  async batchImport(@Body() body: { records: any[] }) {
    return { code: 0, data: await this.service.batchImport(body.records) };
  }
}
