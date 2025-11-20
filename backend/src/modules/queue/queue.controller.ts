import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/createQueue.dto';
import { updateQueueDto } from './dto/updateQueue.dto';
import mongoose from 'mongoose';

@Controller('queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Post()
  createQueue(@Body() createQueueDto: CreateQueueDto) {
    return this.queueService.createQueue(createQueueDto);
  }

  @Get()
  async getAllQueues() {
    return this.queueService.getAllQueues();
  }

  @Get(':id')
  async getQueueById(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Queue ID', 400);
    }
    const queue = await this.queueService.getQueueById(id);
    if (!queue) {
      throw new HttpException('Queue not found', 404);
    }
    return queue;
  }

  @Patch(':id')
  async updateQueue(
    @Param('id') id: string,
    @Body() updateQueueDto: updateQueueDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Queue ID', 400);
    }
    const queue = await this.queueService.getQueueById(id);
    if (!queue) {
      throw new HttpException('Queue not found', 404);
    }
    return this.queueService.updateQueue(id, updateQueueDto);
  }

  @Delete(':id')
  async deleteQueue(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Queue ID', 400);
    }
    const queue = await this.queueService.getQueueById(id);
    if (!queue) {
      throw new HttpException('Queue not found', 404);
    }
    return this.queueService.deleteQueue(id);
  }
}
