import { defineStore } from "pinia";
import axios from "axios";
import { useBusinessStore } from "./BusinessStore";
import { useToastStore } from "./ToastStore";
export interface Product {
  _id?: string | number;
  businessId: string;
  name: string;
  price: number;
  materials: string[];
}

const API_BASE = "http://localhost:3000";

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
        const toastStore = useToastStore();
        toastStore.addToast({ type: "error", message: "Error fetching products" });
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
        const toastStore = useToastStore();
        toastStore.addToast({ type: "success", message: "Product created successfully" });
        return res.data;
      } catch (error) {
        console.error("Error creating product:", error);
        const toastStore = useToastStore();
        toastStore.addToast({ type: "error", message: "Error creating product" });
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
        const toastStore = useToastStore();
        toastStore.addToast({ type: "success", message: "Product updated successfully" });
        return res.data;
      } catch (error) {
        console.error("Error updating product:", error);
        const toastStore = useToastStore();
        toastStore.addToast({ type: "error", message: "Error updating product" });
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
        const toastStore = useToastStore();
        toastStore.addToast({ type: "success", message: "Product deleted successfully" });
      } catch (error) {
        console.error("Error deleting product:", error);
        const toastStore = useToastStore();
        toastStore.addToast({ type: "error", message: "Error deleting product" });
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
