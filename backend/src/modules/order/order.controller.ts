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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { updateOrderDto } from './dto/updateOrder.dto';
import mongoose from 'mongoose';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Order ID', 400);
    }
    const order = await this.orderService.getOrderById(id);
    if (!order) {
      throw new HttpException('Order not found', 404);
    }
    return order;
  }

  @Patch(':id')
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: updateOrderDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Order ID', 400);
    }
    const order = await this.orderService.getOrderById(id);
    if (!order) {
      throw new HttpException('Order not found', 404);
    }
    return this.orderService.updateOrder(id, updateOrderDto);
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Order ID', 400);
    }
    const order = await this.orderService.getOrderById(id);
    if (!order) {
      throw new HttpException('Order not found', 404);
    }
    return this.orderService.deleteOrder(id);
  }
}
