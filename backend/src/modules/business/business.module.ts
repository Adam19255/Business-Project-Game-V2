import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessSchema } from '../../schemas/business.schema';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { ProductSchema } from 'src/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Business', schema: BusinessSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [BusinessService],
  controllers: [BusinessController],
})
export class BusinessModule {}
