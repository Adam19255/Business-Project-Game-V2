import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

export type BusinessDocument = mongoose.HydratedDocument<Business>;

@Schema()
export class Business {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ required: true })
  productionSlotsCount: number;

  @Prop({ required: true })
  deliveryTime: number;

  @Prop({ required: true })
  queueCount: number;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
