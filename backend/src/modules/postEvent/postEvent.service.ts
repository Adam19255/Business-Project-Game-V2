import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostEvent } from 'src/schemas/postEvent.schema';
import { CreatePostEventDto } from './dto/createPostEvent.dto';

@Injectable()
export class PostEventService {
  constructor(
    @InjectModel('PostEvent') private postEventModel: Model<PostEvent>,
  ) {}

  async createPostEvent(createPostEventDto: CreatePostEventDto) {
    const newPostEvent = new this.postEventModel(createPostEventDto);
    return newPostEvent.save();
  }

  async getPostEventsByBusiness(businessId: string) {
    return this.postEventModel
      .find({ businessId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
