import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMaterialDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  timeRequired: number;

  @IsNotEmpty()
  @IsNumber()
  stock: number;
}
