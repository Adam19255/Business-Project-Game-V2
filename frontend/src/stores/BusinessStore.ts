import { defineStore } from "pinia";
import axios from "axios";

export interface Business {
  _id?: string | number;
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
    selectedBusiness: null as Business | null,
  }),
  actions: {
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

    async fetchBusinessById(id: string | number) {
      this.isLoading = true;
      try {
        const response = await axios.get<Business>(`http://localhost:3000/business/${id}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching business by ID:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadBusiness(id: string | number) {
      // Fetch and set as the selected business
      try {
        const data = await this.fetchBusinessById(id);
        this.selectedBusiness = data;
        return data;
      } catch (error) {
        console.error("Error loading business:", error);
        throw error;
      }
    },

    async updateBusiness(id: string | number, update: Partial<Business>) {
      this.isLoading = true;
      try {
        const res = await axios.patch<Business>(`http://localhost:3000/business/${id}`, update);
        const updated = res.data;

        // Update in list
        const idx = this.businesses.findIndex((b) => String(b._id) === String(id));
        if (idx !== -1) this.businesses.splice(idx, 1, updated);

        // Update selected
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
        await axios.delete(`http://localhost:3000/business/${id}`);
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
