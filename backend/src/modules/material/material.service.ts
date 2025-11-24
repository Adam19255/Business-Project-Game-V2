import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material } from '../../schemas/material.schema';
import { CreateMaterialDto } from './dto/createMaterial.dto';
import { updateMaterialDto } from './dto/updateMaterial.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel('Material') private materialModel: Model<Material>,
  ) {}

  async createMaterial(createMaterialDto: CreateMaterialDto) {
    const newMaterial = new this.materialModel(createMaterialDto);
    return newMaterial.save();
  }

  async getAllMaterials() {
    return this.materialModel.find().exec();
  }

  async getMaterialById(id: string) {
    return this.materialModel.findById(id).exec();
  }

  async getMaterialsForBusiness(businessId: string) {
    return this.materialModel.find({ businessId }).exec();
  }

  async updateMaterial(id: string, updateMaterialDto: updateMaterialDto) {
    return this.materialModel
      .findByIdAndUpdate(id, updateMaterialDto, { new: true })
      .exec();
  }

  async deleteMaterial(id: string) {
    return this.materialModel.findByIdAndDelete(id).exec();
  }
}
