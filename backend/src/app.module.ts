import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from './modules/business/business.module';
import { MaterialModule } from './modules/material/material.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/business_project_game'),
    BusinessModule,
    MaterialModule,
    ProductModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
