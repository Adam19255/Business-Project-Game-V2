import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum DeliveryStatus {
  IN_DELIVERY = 'IN_DELIVERY',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Schema()
export class Delivery {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ enum: DeliveryStatus, default: DeliveryStatus.IN_DELIVERY })
  status: DeliveryStatus;

  @Prop({ default: Date.now })
  startedAt: Date;

  @Prop()
  etaSec: number;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
