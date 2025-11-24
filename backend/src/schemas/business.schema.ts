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

  @Prop({
    type: [
      {
        id: String,
        isActive: Boolean,
        number: Number,
        customersId: [String],
      },
    ],
    default: [],
  })
  queues: {
    id: string;
    isActive: boolean;
    number: number;
    customersId: string[];
  }[];
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
