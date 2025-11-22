import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material } from 'src/schemas/material.schema';
import { CreateMaterialDto } from './dto/createMaterial.dto';
import { updateMaterialDto } from './dto/updateMaterial.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel('Material') private materialModel: Model<Material>,
  ) {}

  createMaterial(createMaterialDto: CreateMaterialDto) {
    const newMaterial = new this.materialModel(createMaterialDto);
    return newMaterial.save();
  }

  getAllMaterials() {
    return this.materialModel.find().exec();
  }

  getMaterialById(id: string) {
    return this.materialModel.findById(id).exec();
  }

  getMaterialsForBusiness(businessId: string) {
    return this.materialModel.find({ businessId }).exec();
  }

  updateMaterial(id: string, updateMaterialDto: updateMaterialDto) {
    return this.materialModel
      .findByIdAndUpdate(id, updateMaterialDto, { new: true })
      .exec();
  }

  deleteMaterial(id: string) {
    return this.materialModel.findByIdAndDelete(id).exec();
  }
}
