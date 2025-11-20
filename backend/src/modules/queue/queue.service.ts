import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Queue } from 'src/schemas/queue.schema';
import { CreateQueueDto } from './dto/createQueue.dto';
import { updateQueueDto } from './dto/updateQueue.dto';

@Injectable()
export class QueueService {
  constructor(@InjectModel('Queue') private queueModel: Model<Queue>) {}

  createQueue(createQueueDto: CreateQueueDto) {
    const newQueue = new this.queueModel(createQueueDto);
    return newQueue.save();
  }

  getAllQueues() {
    return this.queueModel.find().exec();
  }

  getQueueById(id: string) {
    return this.queueModel.findById(id).exec();
  }

  updateQueue(id: string, updateQueueDto: updateQueueDto) {
    return this.queueModel
      .findByIdAndUpdate(id, updateQueueDto, { new: true })
      .exec();
  }

  deleteQueue(id: string) {
    return this.queueModel.findByIdAndDelete(id).exec();
  }
}
