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
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/createMaterial.dto';
import { updateMaterialDto } from './dto/updateMaterial.dto';
import mongoose from 'mongoose';

@Controller('material')
export class MaterialController {
  constructor(private materialService: MaterialService) {}

  @Post()
  async createMaterial(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialService.createMaterial(createMaterialDto);
  }

  @Get()
  async getAllMaterials() {
    return this.materialService.getAllMaterials();
  }

  @Get(':id')
  async getMaterialById(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Material ID', 400);
    }
    const material = await this.materialService.getMaterialById(id);
    if (!material) {
      throw new HttpException('Material not found', 404);
    }
    return material;
  }

  @Get('/business/:businessId')
  async getMaterialsForBusiness(@Param('businessId') businessId: string) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new HttpException('Invalid Business ID', 400);
    }
    const materials =
      await this.materialService.getMaterialsForBusiness(businessId);
    return materials;
  }

  @Patch(':id')
  async updateMaterial(
    @Param('id') id: string,
    @Body() updateMaterialDto: updateMaterialDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Material ID', 400);
    }
    const material = await this.materialService.getMaterialById(id);
    if (!material) {
      throw new HttpException('Material not found', 404);
    }
    return this.materialService.updateMaterial(id, updateMaterialDto);
  }

  @Delete(':id')
  async deleteMaterial(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Material ID', 400);
    }
    const material = await this.materialService.getMaterialById(id);
    if (!material) {
      throw new HttpException('Material not found', 404);
    }
    return this.materialService.deleteMaterial(id);
  }
}
