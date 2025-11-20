import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from 'src/schemas/order.schema';

export class updateOrderDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsString()
  status?: OrderStatus;

  @IsOptional()
  @IsNumber()
  orderDuration?: number;

  @IsOptional()
  @IsNumber()
  attempts?: number;
}
