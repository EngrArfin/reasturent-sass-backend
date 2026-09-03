import { PartialType } from '@nestjs/swagger';
import { CreateRestaurantTableDto } from './create-table.dto';

export class UpdateRestaurantTableDto extends PartialType(CreateRestaurantTableDto) {}
