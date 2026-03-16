import { Module } from '@nestjs/common';
import { OrderTemplatesController } from './order-templates.controller';
import { OrderTemplatesService } from './order-templates.service';

@Module({
  controllers: [OrderTemplatesController],
  providers: [OrderTemplatesService],
  exports: [OrderTemplatesService],
})
export class OrderTemplatesModule {}
