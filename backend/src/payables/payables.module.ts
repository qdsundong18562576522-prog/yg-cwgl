import { Module } from '@nestjs/common';
import { PayablesService } from './payables.service';
import { PayablesController } from './payables.controller';

@Module({
  controllers: [PayablesController],
  providers: [PayablesService],
})
export class PayablesModule {}
