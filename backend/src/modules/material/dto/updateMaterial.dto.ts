import { IsNumber, IsOptional, IsString } from 'class-validator';

export class updateMaterialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  timeRequired?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;
}
