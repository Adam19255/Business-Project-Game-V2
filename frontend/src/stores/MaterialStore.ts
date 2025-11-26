import { defineStore } from "pinia";
import axios from "axios";
import { useBusinessStore } from "./BusinessStore";
import { useToastStore } from "./ToastStore";

export interface Material {
  _id?: string | number;
  businessId: string;
  name: string;
  timeRequired: number;
  stock: number;
}

const API_BASE = "http://localhost:3000";

export const useMaterialStore = defineStore("material", {
  state: () => ({
    materials: [] as Material[],
    isLoading: false,
  }),
  actions: {
    async fetchMaterialsForBusiness(businessId?: string | number) {
      this.isLoading = true;
      try {
        const id = businessId ?? (useBusinessStore().selectedBusiness?._id as string | number | undefined);

        if (!id) {
          this.materials = [];
          return this.materials;
        }

        const res = await axios.get<Material[]>(`${API_BASE}/material/business/${id}`);
        this.materials = res.data ?? [];
        return this.materials;
      } catch (error) {
        console.error("Error fetching materials:", error);
        const toastStore = useToastStore();
        toastStore.addToast({ type: "error", message: "Error fetching materials" });
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createMaterial(payload: { name: string; timeRequired: number; stock: number; businessId?: string | number }) {
      this.isLoading = true;
      try {
        const id = payload.businessId ?? useBusinessStore().selectedBusiness?._id;
        if (!id) throw new Error("No selected business id");

        const body = { ...payload, businessId: String(id) };
        const res = await axios.post<Material>(`${API_BASE}/material`, body);
        this.materials.push(res.data);
        return res.data;
      } catch (error) {
        console.error("Error creating material:", error);
        const toastStore = useToastStore();
        toastStore.addToast({ type: "error", message: "Error creating material" });
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateMaterial(id: string | number, update: Partial<Material>) {
      this.isLoading = true;
      try {
        const res = await axios.patch<Material>(`${API_BASE}/material/${id}`, update);
        const idx = this.materials.findIndex((m) => String(m._id) === String(id));
        if (idx !== -1) this.materials.splice(idx, 1, res.data);
        return res.data;
      } catch (error) {
        console.error("Error updating material:", error);
        const toastStore = useToastStore();
        toastStore.addToast({ type: "error", message: "Error updating material" });
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteMaterial(id: string | number) {
      this.isLoading = true;
      try {
        await axios.delete(`${API_BASE}/material/${id}`);
        this.materials = this.materials.filter((m) => String(m._id) !== String(id));
      } catch (error) {
        console.error("Error deleting material:", error);
        const toastStore = useToastStore();
        toastStore.addToast({ type: "error", message: "Error deleting material" });
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
