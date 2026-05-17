import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OperationLogsService } from './operation-logs.service';

@Controller('operation-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'finance')
export class OperationLogsController {
  constructor(private service: OperationLogsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return { code: 0, data: await this.service.findAll(+query.page || 1, +query.pageSize || 20, query.entity) };
  }
}
