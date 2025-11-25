import { defineStore } from "pinia";
import axios from "axios";
import { useMaterialStore } from "./MaterialStore";
import { useProductStore } from "./ProductStore";

export interface Business {
  _id?: string | number;
  name: string;
  queueCount: number;
  productionSlotsCount: number;
  deliveryTime: number;
  revenue?: number;
}

const API_BASE = "http://localhost:3000";

export const useBusinessStore = defineStore("business", {
  state: () => ({
    businesses: [] as Business[],
    isLoading: false,
    selectedBusiness: null as Business | null,
  }),
  actions: {
    async createBusiness(business: Omit<Business, "_id">) {
      this.isLoading = true;
      try {
        const res = await axios.post<Business>(`${API_BASE}/business`, business);
        this.businesses.push(res.data);
        return res.data;
      } catch (error) {
        console.error("Error creating business:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchBusinesses() {
      this.isLoading = true;
      try {
        const res = await axios.get<Business[]>(`${API_BASE}/business`);
        this.businesses = res.data ?? [];
        return this.businesses;
      } catch (error) {
        console.error("Error fetching businesses:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchBusinessById(id: string | number) {
      this.isLoading = true;
      try {
        const res = await axios.get<Business>(`${API_BASE}/business/${id}`);
        return res.data;
      } catch (error) {
        console.error("Error fetching business by id:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadBusiness(id: string | number) {
      try {
        const data = await this.fetchBusinessById(id);
        this.selectedBusiness = data;

        const materialStore = useMaterialStore();
        const productStore = useProductStore();

        await Promise.all([
          materialStore.fetchMaterialsForBusiness(data._id as string),
          productStore.fetchProductsForBusiness(data._id as string),
        ]);

        return data;
      } catch (error) {
        console.error("Error loading business:", error);
        throw error;
      }
    },
    async updateBusiness(id: string | number, update: Partial<Business>) {
      this.isLoading = true;
      try {
        const res = await axios.patch<Business>(`${API_BASE}/business/${id}`, update);
        const updated = res.data;
        const idx = this.businesses.findIndex((b) => String(b._id) === String(id));
        if (idx !== -1) this.businesses.splice(idx, 1, updated);

        if (this.selectedBusiness && String(this.selectedBusiness._id) === String(id)) {
          this.selectedBusiness = updated;
        }
        return updated;
      } catch (error) {
        console.error("Error updating business:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteBusiness(id: string | number) {
      this.isLoading = true;
      try {
        await axios.delete(`${API_BASE}/business/${id}`);
        this.businesses = this.businesses.filter((b) => String(b._id) !== String(id));
        if (this.selectedBusiness && String(this.selectedBusiness._id) === String(id)) {
          this.selectedBusiness = null;
        }
      } catch (error) {
        console.error("Error deleting business:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
