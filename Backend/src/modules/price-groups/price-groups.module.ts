import { Module } from '@nestjs/common';
import { PriceGroupsController } from './price-groups.controller';
import { PriceGroupsService } from './price-groups.service';

@Module({
  controllers: [PriceGroupsController],
  providers: [PriceGroupsService],
  exports: [PriceGroupsService],
})
export class PriceGroupsModule {}
