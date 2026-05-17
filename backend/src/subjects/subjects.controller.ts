import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubjectsService } from './subjects.service';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private service: SubjectsService) {}

  @Get()
  async findAll(@Query('type') type?: string) {
    return { code: 0, data: await this.service.findAll(type) };
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
}
