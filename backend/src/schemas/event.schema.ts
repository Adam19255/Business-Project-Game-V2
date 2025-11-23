import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

export interface OrderInfo {
  customerId?: string;
  productId?: string;
  quantity?: number;
  productName?: string;
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  type: string;

  @Prop({ type: Object })
  order?: OrderInfo;

  @Prop()
  reason?: string;

  @Prop({ type: Object })
  data?: any;

  @Prop()
  businessId?: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
