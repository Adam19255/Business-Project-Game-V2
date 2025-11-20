import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueSchema } from 'src/schemas/queue.schema';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Queue', schema: QueueSchema }]),
  ],
  providers: [QueueService],
  controllers: [QueueController],
})
export class QueueModule {}
