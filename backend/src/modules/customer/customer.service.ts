import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customers } from 'src/schemas/customer.schema';
import { CreateCustomerDto } from './dto/createCustomer.dto';
import { updateCustomerDto } from './dto/updateCustomer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel('Customer') private customerModel: Model<Customers>,
  ) {}

  createCustomer(createCustomerDto: CreateCustomerDto) {
    const payload = {
      ...createCustomerDto,
      arrivalTime: new Date(createCustomerDto.arrivalTime),
    } as any;
    const newCustomer = new this.customerModel(payload);
    return newCustomer.save();
  }

  getAllCustomers() {
    return this.customerModel.find().exec();
  }

  getCustomerById(id: string) {
    return this.customerModel.findById(id).exec();
  }

  updateCustomer(id: string, updateCustomerDto: updateCustomerDto) {
    return this.customerModel
      .findByIdAndUpdate(id, updateCustomerDto, { new: true })
      .exec();
  }

  deleteCustomer(id: string) {
    return this.customerModel.findByIdAndDelete(id).exec();
  }
}
