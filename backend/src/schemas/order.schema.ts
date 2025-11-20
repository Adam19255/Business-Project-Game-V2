import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Schema({ timestamps: false })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], required: true })
  productIds: Types.ObjectId[];

  @Prop({
    required: true,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Prop({ required: true, default: 0 })
  orderDuration: number;

  @Prop({ required: true, default: 0 })
  attempts: number;

  @Prop({ required: true })
  createdAt: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
