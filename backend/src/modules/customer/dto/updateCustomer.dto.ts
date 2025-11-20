import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { CustomerState } from 'src/schemas/customer.schema';

export class updateCustomerDto {
  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsNumber()
  money?: number;

  @IsOptional()
  @IsNumber()
  orderAttemps?: number;

  @IsOptional()
  @IsString()
  state?: CustomerState;

  @IsOptional()
  @IsString()
  currentOrderId?: string | null;

  @IsOptional()
  @IsString()
  queueId?: string;
}
