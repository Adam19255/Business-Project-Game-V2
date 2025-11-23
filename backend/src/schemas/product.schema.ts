import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

export type ProductDocument = mongoose.HydratedDocument<Product>;

@Schema()
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Material' }] })
  materials: Types.ObjectId[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
