import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { Business } from '../../schemas/business.schema';
import { CreateBusinessDto } from './dto/createBusiness.dto';
import { updateBusinessDto } from './dto/updateBusiness.dto';

interface EmbeddedQueue {
  id: string;
  isActive: boolean;
  number: number;
  customersId: string[];
}

type BusinessDocument = Business & Document & { queues?: EmbeddedQueue[] };

interface UpdateWithQueueCount {
  queueCount?: number;
}

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel('Business') private businessModel: Model<BusinessDocument>,
  ) {}

  async createBusiness(createBusinessDto: CreateBusinessDto) {
    const queueCount: number = createBusinessDto.queueCount ?? 0;
    const queues: EmbeddedQueue[] = [];
    for (let i = 1; i <= queueCount; i++) {
      queues.push({
        id: randomUUID(),
        isActive: true,
        number: i,
        customersId: [],
      });
    }

    const toSave: Partial<BusinessDocument> = {
      name: createBusinessDto.name,
      productionSlotsCount: createBusinessDto.productionSlotsCount,
      deliveryTime: createBusinessDto.deliveryTime,
      queues,
    };

    const newBusiness = new this.businessModel(toSave);
    const savedBusiness = await newBusiness.save();
    return this.businessModel.findById(savedBusiness._id).exec();
  }

  getBusinessByName(name: string) {
    return this.businessModel.findOne({ name }).exec();
  }

  getAllBusinesses() {
    return this.businessModel.find().exec();
  }

  getBusinessById(id: string) {
    return this.businessModel.findById(id).exec();
  }

  async updateBusiness(id: string, updateBusinessDto: updateBusinessDto) {
    const business = await this.businessModel.findById(id).exec();
    if (!business) throw new NotFoundException('Business not found');

    const maybeQueueCount: number | undefined = (
      updateBusinessDto as UpdateWithQueueCount
    ).queueCount;
    if (typeof maybeQueueCount === 'number') {
      const target = maybeQueueCount;
      const current = Array.isArray(business.queues)
        ? business.queues.length
        : 0;

      if (!Array.isArray(business.queues)) {
        business.queues = [];
      }

      if (target > current) {
        for (let i = current + 1; i <= target; i++) {
          business.queues.push({
            id: randomUUID(),
            isActive: true,
            number: i,
            customersId: [],
          });
        }
      } else if (target < current) {
        business.queues = business.queues.slice(0, target);
      }
    }

    if ((updateBusinessDto as Partial<updateBusinessDto>).name !== undefined) {
      business.name = (updateBusinessDto as updateBusinessDto).name as string;
    }
    if (
      (updateBusinessDto as Partial<updateBusinessDto>).deliveryTime !==
      undefined
    ) {
      business.deliveryTime = (updateBusinessDto as updateBusinessDto)
        .deliveryTime as number;
    }
    if (
      typeof (updateBusinessDto as Partial<updateBusinessDto>)
        .productionSlotsCount === 'number'
    ) {
      business.productionSlotsCount = (updateBusinessDto as updateBusinessDto)
        .productionSlotsCount as number;
    }

    await business.save();
    return this.businessModel.findById(business._id).exec();
  }

  deleteBusiness(id: string) {
    return this.businessModel.findByIdAndDelete(id).exec();
  }
}
