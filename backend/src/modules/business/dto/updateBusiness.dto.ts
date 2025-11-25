import { IsNumber, IsOptional, IsString } from 'class-validator';

export class updateBusinessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  productionSlotsCount?: number;

  @IsOptional()
  @IsNumber()
  queueCount?: number;

  @IsOptional()
  @IsNumber()
  deliveryTime?: number;

  @IsOptional()
  @IsNumber()
  revenue?: number;
}
