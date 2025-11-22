import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from 'src/schemas/product.schema';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/createProduct.dto';
import { updateProductDto } from './dto/updateProduct.dto';

@Injectable()
export class ProductService {
  constructor(@InjectModel('Product') private productModel: Model<Product>) {}

  createProduct(createProductDto: CreateProductDto) {
    const newProduct = new this.productModel(createProductDto);
    return newProduct.save();
  }

  getAllProducts() {
    return this.productModel.find().exec();
  }

  getProductsForBusiness(businessId: string) {
    return this.productModel.find({ businessId }).exec();
  }

  getProductById(id: string) {
    return this.productModel.findById(id).exec();
  }

  updateProduct(id: string, updateProductDto: updateProductDto) {
    return this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();
  }

  deleteProduct(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }
}
