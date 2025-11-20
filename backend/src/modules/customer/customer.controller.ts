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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/createCustomer.dto';
import { updateCustomerDto } from './dto/updateCustomer.dto';
import mongoose from 'mongoose';

@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Get()
  async getAllCustomers() {
    return this.customerService.getAllCustomers();
  }

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Customer ID', 400);
    }
    const customer = await this.customerService.getCustomerById(id);
    if (!customer) {
      throw new HttpException('Customer not found', 404);
    }
    return customer;
  }

  @Patch(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: updateCustomerDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Customer ID', 400);
    }
    const customer = await this.customerService.getCustomerById(id);
    if (!customer) {
      throw new HttpException('Customer not found', 404);
    }
    return this.customerService.updateCustomer(id, updateCustomerDto);
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Customer ID', 400);
    }
    const customer = await this.customerService.getCustomerById(id);
    if (!customer) {
      throw new HttpException('Customer not found', 404);
    }
    return this.customerService.deleteCustomer(id);
  }
}
