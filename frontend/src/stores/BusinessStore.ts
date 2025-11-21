import { defineStore } from "pinia";
import axios from "axios";

export interface Business {
  id?: string | number;
  name: string;
  productionSlotsCount: number;
  deliveryTime: number;
  products?: any[];
  queues?: any[];
}

export const useBusinessStore = defineStore("business", {
  state: () => ({
    businesses: [] as Business[],
    isLoading: false,
  }),
  actions: {
    async fetchBusinesses() {
      this.isLoading = true;
      try {
        const response = await axios.get<Business[]>("http://localhost:3000/business");
        this.businesses = response.data;
      } catch (error) {
        console.error("Error fetching businesses:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async createBusiness(business: Business) {
      this.isLoading = true;
      try {
        const res = await axios.post<Business>("http://localhost:3000/business", business);
        this.businesses.push(res.data);
        return res.data;
      } catch (error) {
        console.error("Error creating business:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
