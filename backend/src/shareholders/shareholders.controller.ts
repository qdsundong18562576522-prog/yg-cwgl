import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShareholdersService } from './shareholders.service';

@Controller('shareholders')
@UseGuards(JwtAuthGuard)
export class ShareholdersController {
  constructor(private service: ShareholdersService) {}

  @Get()
  async findAll() {
    return { code: 0, data: await this.service.findAllShareholders() };
  }

  @Get('summary')
  async getSummary() {
    return { code: 0, data: await this.service.getSummary() };
  }

  @Post()
  async create(@Body() body: any) {
    return { code: 0, data: await this.service.createShareholder(body) };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateShareholder(id, body) };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.removeShareholder(id) };
  }

  @Get('transactions')
  async findAllTransactions(@Query('shareholderId') shareholderId?: string) {
    return { code: 0, data: await this.service.findAllTransactions(shareholderId ? +shareholderId : undefined) };
  }

  @Post('transactions')
  async createTransaction(@Body() body: any) {
    return { code: 0, data: await this.service.createTransaction(body) };
  }

  @Delete('transactions/:id')
  async removeTransaction(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.removeTransaction(id) };
  }
}
