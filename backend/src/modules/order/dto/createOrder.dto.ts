import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  productIds: string[];

  @IsOptional()
  createdAt?: number; // will be set by service if missing
}
