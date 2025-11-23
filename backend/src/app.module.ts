import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from './modules/business/business.module';
import { MaterialModule } from './modules/material/material.module';
import { ProductModule } from './modules/product/product.module';
import { CustomerModule } from './modules/customer/customer.module';
import { EventModule } from './modules/event/event.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/business_project_game'),
    BusinessModule,
    MaterialModule,
    ProductModule,
    CustomerModule,
    EventModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
