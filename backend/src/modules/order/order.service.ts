import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from 'src/schemas/order.schema';
import { CreateOrderDto } from './dto/createOrder.dto';
import { updateOrderDto } from './dto/updateOrder.dto';

@Injectable()
export class OrderService {
  constructor(@InjectModel('Order') private orderModel: Model<Order>) {}

  createOrder(createOrderDto: CreateOrderDto) {
    const payload = {
      ...createOrderDto,
      createdAt: createOrderDto.createdAt ?? Date.now(),
    };
    const newOrder = new this.orderModel(payload);
    return newOrder.save();
  }

  getAllOrders() {
    return this.orderModel.find().exec();
  }

  getOrderById(id: string) {
    return this.orderModel.findById(id).exec();
  }

  updateOrder(id: string, updateOrderDto: updateOrderDto) {
    return this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();
  }

  deleteOrder(id: string) {
    return this.orderModel.findByIdAndDelete(id).exec();
  }
}
