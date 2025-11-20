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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { updateProductDto } from './dto/updateProduct.dto';
import mongoose from 'mongoose';

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  @Get()
  async getAllProducts() {
    return this.productService.getAllProducts();
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    mongoose.Types.ObjectId.isValid(id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Product ID', 400);
    }
    const product = await this.productService.getProductById(id);
    if (!product) {
      throw new HttpException('Product not found', 404);
    }
    return product;
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: updateProductDto,
  ) {
    mongoose.Types.ObjectId.isValid(id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Product ID', 400);
    }
    const product = await this.productService.getProductById(id);
    if (!product) {
      throw new HttpException('Product not found', 404);
    }
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    mongoose.Types.ObjectId.isValid(id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid Product ID', 400);
    }
    const product = await this.productService.getProductById(id);
    if (!product) {
      throw new HttpException('Product not found', 404);
    }
    return this.productService.deleteProduct(id);
  }
}
