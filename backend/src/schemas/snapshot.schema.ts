import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class Snapshot {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;

  @Prop({ type: Object })
  state: any;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SnapshotSchema = SchemaFactory.createForClass(Snapshot);
