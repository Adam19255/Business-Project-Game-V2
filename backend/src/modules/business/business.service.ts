import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business } from '../../schemas/business.schema';
import { CreateBusinessDto } from './dto/createBusiness.dto';
import { updateBusinessDto } from './dto/updateBusiness.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel('Business') private businessModel: Model<Business>,
  ) {}

  createBusiness(createBusinessDto: CreateBusinessDto) {
    const newBusiness = new this.businessModel(createBusinessDto);
    return newBusiness.save();
  }

  getBusinessByName(name: string) {
    return this.businessModel.findOne({ name }).exec();
  }

  getAllBusinesses() {
    return this.businessModel.find().exec();
  }

  getBusinessById(id: string) {
    return this.businessModel.findById(id).exec();
  }

  updateBusiness(id: string, updateBusinessDto: updateBusinessDto) {
    return this.businessModel
      .findByIdAndUpdate(id, updateBusinessDto, { new: true })
      .exec();
  }

  deleteBusiness(id: string) {
    return this.businessModel.findByIdAndDelete(id).exec();
  }
}
