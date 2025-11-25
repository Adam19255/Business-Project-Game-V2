import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';
export class CreatePostEventDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsBoolean()
  success: boolean;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsString()
  productName: string;

  @IsNotEmpty()
  @IsNumber()
  cost: number;

  @IsOptional()
  extraData?: unknown;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}
