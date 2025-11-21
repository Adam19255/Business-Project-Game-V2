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
  async createBusiness(@Body() createBusinessDto: CreateBusinessDto) {
    const business = await this.businessService.getBusinessByName(
      createBusinessDto.name,
    );
    if (business) {
      throw new HttpException('Business name already exists', 400);
    }
    return this.businessService.createBusiness(createBusinessDto);
  }

  @Get()
  async getAllBusinesses() {
    return this.businessService.getAllBusinesses();
  }

  @Get(':id')
  async getBusinessById(@Param('id') id: string) {
    mongoose.Types.ObjectId.isValid(id);
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
  ) {
    mongoose.Types.ObjectId.isValid(id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Business ID', 400);
    }
    const business = await this.businessService.getBusinessById(id);
    if (!business) {
      throw new HttpException('Business not found', 404);
    }
    return this.businessService.updateBusiness(id, updateBusinessDto);
  }

  @Delete(':id')
  async deleteBusiness(@Param('id') id: string) {
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
