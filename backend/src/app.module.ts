import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from './modules/business/business.module';
import { ProductModule } from './modules/product/product.module';
import { MaterialModule } from './modules/material/material.module';
import { OrderModule } from './modules/order/order.module';
import { CustomerModule } from './modules/customer/customer.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/business_project_game'),
    BusinessModule,
    ProductModule,
    MaterialModule,
    OrderModule,
    CustomerModule,
    QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
