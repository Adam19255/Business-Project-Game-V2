import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

export type MaterialDocument = mongoose.HydratedDocument<Material>;

@Schema()
export class Material {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  timeRequired: number;

  @Prop({ required: true })
  stock: number;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
