import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpException,
} from '@nestjs/common';
import { PostEventService } from './postEvent.service';
import { CreatePostEventDto } from './dto/createPostEvent.dto';

@Controller('post-event')
export class PostEventController {
  constructor(private postEventService: PostEventService) {}

  @Post()
  async createPostEvent(@Body() createPostEventDto: CreatePostEventDto) {
    return this.postEventService.createPostEvent(createPostEventDto);
  }

  @Get('/business/:businessId')
  async getPostEventsByBusiness(@Param('businessId') businessId: string) {
    if (!businessId) {
      throw new HttpException('Business ID is required', 400);
    }
    const postEvents =
      await this.postEventService.getPostEventsByBusiness(businessId);
    return postEvents;
  }
}
