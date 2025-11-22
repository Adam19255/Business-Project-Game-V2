import { defineStore } from "pinia";
import axios from "axios";
import { useBusinessStore } from "./BusinessStore";

export interface Material {
  _id?: string | number;
  businessId: string;
  name: string;
  timeRequired: number;
  stock: number;
}

export const useMaterialStore = defineStore("material", {
  state: () => ({
    materials: [] as Material[],
    isLoading: false,
  }),
  actions: {
    async fetchMaterialsForBusiness(businessId?: string | number) {
      this.isLoading = true;
      try {
        const id = businessId ?? useBusinessStore().selectedBusiness?._id ?? (undefined as any);
        if (!id) {
          this.materials = [];
          return [] as Material[];
        }

        const res = await axios.get<Material[]>(`http://localhost:3000/material/business/${id}`);
        this.materials = res.data;
        return this.materials;
      } catch (error) {
        console.error("Error fetching materials:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createMaterial(payload: { name: string; timeRequired: number; stock: number; businessId?: string | number }) {
      this.isLoading = true;
      try {
        const id = payload.businessId ?? useBusinessStore().selectedBusiness?._id;
        if (!id) throw new Error("No selected business");
        const body = { ...payload, businessId: String(id) };
        const res = await axios.post<Material>("http://localhost:3000/material", body);
        this.materials.push(res.data);
        return res.data;
      } catch (error) {
        console.error("Error creating material:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateMaterial(id: string | number, update: Partial<Material>) {
      this.isLoading = true;
      try {
        const res = await axios.patch<Material>(`http://localhost:3000/material/${id}`, update);
        const idx = this.materials.findIndex((m) => String(m._id) === String(id));
        if (idx !== -1) this.materials.splice(idx, 1, res.data);
        return res.data;
      } catch (error) {
        console.error("Error updating material:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteMaterial(id: string | number) {
      this.isLoading = true;
      try {
        await axios.delete(`http://localhost:3000/material/${id}`);
        this.materials = this.materials.filter((m) => String(m._id) !== String(id));
      } catch (error) {
        console.error("Error deleting material:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
