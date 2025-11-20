import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum CustomerState {
  WAITING = 'WAITING',
  ORDERING = 'ORDERING',
  ORDER_FAILED = 'ORDER_FAILED',
  ORDER_SUCCEEDED = 'ORDER_SUCCEEDED',
  LEFT = 'LEFT',
  REORDERING = 'REORDERING',
  CANCELING = 'CANCELING',
}

@Schema()
export class Customers {
  @Prop({ required: true })
  arrivalTime: Date;

  @Prop({ required: true })
  money: number;

  @Prop({ required: true })
  orderAttemps: number;

  @Prop({
    required: true,
    enum: Object.values(CustomerState),
    default: CustomerState.WAITING,
  })
  state: CustomerState;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  currentOrderId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Queue', required: true })
  queueId: Types.ObjectId;
}

export const CustomersSchema = SchemaFactory.createForClass(Customers);
