import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
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

  @IsOptional()
  extraData?: unknown;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}
