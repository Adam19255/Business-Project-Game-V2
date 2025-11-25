import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

export type PostEventDocument = mongoose.HydratedDocument<PostEvent>;

@Schema()
export class PostEvent {
  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  success: boolean;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  extraData: any;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  cost: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  productIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PostEventSchema = SchemaFactory.createForClass(PostEvent);
