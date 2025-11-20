import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class updateQueueDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}
