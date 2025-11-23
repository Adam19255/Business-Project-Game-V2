import { defineStore } from "pinia";
import axios from "axios";
import { useBusinessStore } from "./BusinessStore";

export interface Product {
  _id?: string | number;
  businessId: string;
  name: string;
  price: number;
  materials: string[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const useProductStore = defineStore("product", {
  state: () => ({
    products: [] as Product[],
    isLoading: false,
  }),
  actions: {
    async fetchProductsForBusiness(businessId?: string | number) {
      this.isLoading = true;
      try {
        const id = businessId ?? (useBusinessStore().selectedBusiness?._id as string | number | undefined);
        if (!id) {
          this.products = [];
          return this.products;
        }
        const res = await axios.get<Product[]>(`${API_BASE}/product/business/${id}`);
        this.products = res.data ?? [];
        return this.products;
      } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createProduct(payload: { name: string; price: number; materials: string[]; businessId?: string | number }) {
      this.isLoading = true;
      try {
        const id = payload.businessId ?? useBusinessStore().selectedBusiness?._id;
        if (!id) throw new Error("No selected business id");
        const body = { ...payload, businessId: String(id) };
        const res = await axios.post<Product>(`${API_BASE}/product`, body);
        this.products.push(res.data);
        return res.data;
      } catch (error) {
        console.error("Error creating product:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateProduct(id: string | number, update: Partial<Product>) {
      this.isLoading = true;
      try {
        const res = await axios.patch<Product>(`${API_BASE}/product/${id}`, update);
        const idx = this.products.findIndex((p) => String(p._id) === String(id));
        if (idx !== -1) this.products.splice(idx, 1, res.data);
        return res.data;
      } catch (error) {
        console.error("Error updating product:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteProduct(id: string | number) {
      this.isLoading = true;
      try {
        await axios.delete(`${API_BASE}/product/${id}`);
        this.products = this.products.filter((p) => String(p._id) !== String(id));
      } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
