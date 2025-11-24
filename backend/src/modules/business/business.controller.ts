import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/createBusiness.dto';
import mongoose from 'mongoose';
import { updateBusinessDto } from './dto/updateBusiness.dto';

@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Post()
  async createBusiness(
    @Body() createBusinessDto: CreateBusinessDto,
  ): Promise<unknown> {
    const business = await this.businessService.getBusinessByName(
      createBusinessDto.name,
    );
    if (business) {
      throw new HttpException('Business name already exists', 400);
    }
    // sanitize numeric fields in case client sends strings
    const payload: CreateBusinessDto = {
      name: createBusinessDto.name,
      productionSlotsCount: Number(createBusinessDto.productionSlotsCount),
      deliveryTime: Number(createBusinessDto.deliveryTime),
      queueCount: Number(
        (createBusinessDto as CreateBusinessDto).queueCount ?? 0,
      ),
    };

    return this.businessService.createBusiness(payload);
  }

  @Get()
  async getAllBusinesses(): Promise<unknown> {
    return this.businessService.getAllBusinesses();
  }

  @Get(':id')
  async getBusinessById(@Param('id') id: string): Promise<unknown> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Business ID', 400);
    }
    const business = await this.businessService.getBusinessById(id);
    if (!business) {
      throw new HttpException('Business not found', 404);
    }
    return business;
  }

  @Patch(':id')
  async updateBusiness(
    @Param('id') id: string,
    @Body() updateBusinessDto: updateBusinessDto,
  ): Promise<unknown> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Business ID', 400);
    }
    const business = await this.businessService.getBusinessById(id);
    if (!business) {
      throw new HttpException('Business not found', 404);
    }
    if (updateBusinessDto.name) {
      const existingBusiness = await this.businessService.getBusinessByName(
        updateBusinessDto.name,
      );
      if (existingBusiness && existingBusiness._id.toString() !== id) {
        throw new HttpException('Business name already exists', 400);
      }
    }
    // sanitize numeric fields if provided
    const payload: Partial<updateBusinessDto> = {};
    if ((updateBusinessDto as Partial<updateBusinessDto>).name !== undefined)
      payload.name = (updateBusinessDto as updateBusinessDto).name as string;
    if (
      (updateBusinessDto as Partial<updateBusinessDto>).productionSlotsCount !==
      undefined
    )
      payload.productionSlotsCount = Number(
        (updateBusinessDto as updateBusinessDto).productionSlotsCount,
      ) as number;
    if (
      (updateBusinessDto as Partial<updateBusinessDto>).deliveryTime !==
      undefined
    )
      payload.deliveryTime = Number(
        (updateBusinessDto as updateBusinessDto).deliveryTime,
      ) as number;
    if (
      (updateBusinessDto as Partial<updateBusinessDto>).queueCount !== undefined
    )
      payload.queueCount = Number(
        (updateBusinessDto as updateBusinessDto).queueCount,
      ) as number;

    return this.businessService.updateBusiness(id, payload);
  }

  @Delete(':id')
  async deleteBusiness(@Param('id') id: string): Promise<unknown> {
    mongoose.Types.ObjectId.isValid(id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Business ID', 400);
    }
    const business = await this.businessService.getBusinessById(id);
    if (!business) {
      throw new HttpException('Business not found', 404);
    }
    return this.businessService.deleteBusiness(id);
  }
}
