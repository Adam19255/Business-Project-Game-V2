import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialSchema } from 'src/schemas/material.schema';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Material', schema: MaterialSchema }]),
  ],
  providers: [MaterialService],
  controllers: [MaterialController],
})
export class MaterialModule {}
