import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessSchema } from '../../schemas/business.schema';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { ProductSchema } from 'src/schemas/product.schema';
import { QueueSchema } from 'src/schemas/queue.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Business', schema: BusinessSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Queue', schema: QueueSchema },
    ]),
  ],
  providers: [BusinessService],
  controllers: [BusinessController],
})
export class BusinessModule {}
