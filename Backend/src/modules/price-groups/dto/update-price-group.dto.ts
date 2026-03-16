import { PartialType } from '@nestjs/mapped-types';
import { CreatePriceGroupDto } from './create-price-group.dto';

export class UpdatePriceGroupDto extends PartialType(CreatePriceGroupDto) {}
