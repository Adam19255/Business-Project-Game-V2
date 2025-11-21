import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQueueDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}
