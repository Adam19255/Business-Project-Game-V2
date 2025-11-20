import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsDateString()
  arrivalTime: string;

  @IsNotEmpty()
  @IsNumber()
  money: number;

  @IsNotEmpty()
  @IsNumber()
  orderAttemps: number;

  @IsNotEmpty()
  @IsString()
  queueId: string;
}
