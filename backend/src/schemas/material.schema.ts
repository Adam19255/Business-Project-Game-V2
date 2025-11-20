import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Material {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  timeRequired: number;

  @Prop({ required: true })
  stock: number;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
