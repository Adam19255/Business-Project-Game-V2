import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class updateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsArray()
  materials?: string[];
}
