import { Module } from '@nestjs/common';
import { ShareholdersService } from './shareholders.service';
import { ShareholdersController } from './shareholders.controller';

@Module({
  controllers: [ShareholdersController],
  providers: [ShareholdersService],
})
export class ShareholdersModule {}
