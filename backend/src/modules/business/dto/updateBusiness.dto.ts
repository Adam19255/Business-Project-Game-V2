import { IsNumber, IsOptional } from 'class-validator';

export class updateBusinessDto {
  @IsOptional()
  @IsNumber()
  productionSlotsCount?: number;

  @IsOptional()
  @IsNumber()
  deliveryTime?: number;
}
