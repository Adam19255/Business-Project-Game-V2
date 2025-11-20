import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class Business {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ required: true })
  productionSlotsCount: number;

  @Prop({ required: true })
  deliveryTime: number;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] })
  products: mongoose.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Queue' }] })
  queues: mongoose.Types.ObjectId[];
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
