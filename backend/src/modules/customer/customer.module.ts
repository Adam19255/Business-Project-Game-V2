import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersSchema } from 'src/schemas/customer.schema';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Customer', schema: CustomersSchema }]),
  ],
  providers: [CustomerService],
  controllers: [CustomerController],
})
export class CustomerModule {}
