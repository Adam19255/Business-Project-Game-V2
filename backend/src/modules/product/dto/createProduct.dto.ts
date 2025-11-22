import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  materials: string[]; // array of material IDs (required, at least one)
}
