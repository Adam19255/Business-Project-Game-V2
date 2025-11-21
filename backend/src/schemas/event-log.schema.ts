import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class EventLog {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Object })
  payload: any;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);
