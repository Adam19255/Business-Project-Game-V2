import { IsNumber, IsOptional, IsString } from 'class-validator';

export class updateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number;
}
