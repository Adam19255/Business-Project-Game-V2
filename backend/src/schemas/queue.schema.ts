import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class Queue {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: true })
  isOpen: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Customer' }], default: [] })
  customerIds: Types.ObjectId[];
}

export const QueueSchema = SchemaFactory.createForClass(Queue);
