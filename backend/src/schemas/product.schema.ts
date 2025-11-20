import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class Product {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }] })
  materials: mongoose.Types.ObjectId[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
