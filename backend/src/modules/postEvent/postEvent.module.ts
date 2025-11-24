import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostEventSchema } from 'src/schemas/postEvent.schema';
import { PostEventController } from './postEvent.controller';
import { PostEventService } from './postEvent.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'PostEvent', schema: PostEventSchema }]),
  ],
  controllers: [PostEventController],
  providers: [PostEventService],
})
export class PostEventModule {}
