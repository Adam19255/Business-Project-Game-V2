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
    // validate businessId
    if (!mongoose.Types.ObjectId.isValid(createProductDto.businessId)) {
      throw new HttpException('Invalid Business ID', 400);
    }

    // materials must be an array with at least one valid ObjectId
    if (
      !Array.isArray(createProductDto.materials) ||
      createProductDto.materials.length === 0
    ) {
      throw new HttpException(
        'Product must include at least one material',
        400,
      );
    }
    for (const matId of createProductDto.materials) {
      if (!mongoose.Types.ObjectId.isValid(matId)) {
        throw new HttpException('Invalid Material ID in materials array', 400);
      }
    }

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

  @Get('/business/:businessId')
  async getProductsForBusiness(@Param('businessId') businessId: string) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new HttpException('Invalid Business ID', 400);
    }
    const products =
      await this.productService.getProductsForBusiness(businessId);
    return products || [];
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
