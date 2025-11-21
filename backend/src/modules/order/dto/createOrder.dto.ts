import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  queueId: string;

  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  productIds: string[];
}
