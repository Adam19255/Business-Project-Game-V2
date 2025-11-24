import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBusinessDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  productionSlotsCount: number;

  @IsNotEmpty()
  @IsNumber()
  deliveryTime: number;

  @IsNotEmpty()
  @IsNumber()
  queueCount: number;
}
