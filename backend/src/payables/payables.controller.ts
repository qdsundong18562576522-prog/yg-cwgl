import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PayablesService } from './payables.service';

@Controller('payables')
@UseGuards(JwtAuthGuard)
export class PayablesController {
  constructor(private service: PayablesService) {}

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
  async remove(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.remove(id) };
  }

  @Post(':id/write-off')
  async writeOff(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.writeOff(id, body.amount, body.writeDate, body.description) };
  }

  @Get('aging-analysis')
  async getAgingAnalysis() {
    return { code: 0, data: await this.service.getAgingAnalysis() };
  }
}
