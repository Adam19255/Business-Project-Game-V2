<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useBusinessStore } from "@/stores/BusinessStore";

interface NewBusinessForm {
  name: string;
  productionSlotsCount: number;
  deliveryTime: number;
}

const router = useRouter();
const businessStore = useBusinessStore();

const form = reactive<NewBusinessForm>({
  name: "",
  productionSlotsCount: 0,
  deliveryTime: 0,
});

async function createBusiness() {
  if (!form.name.trim()) return alert("Name is required");

  const payload = {
    name: form.name.trim(),
    productionSlotsCount: Number(form.productionSlotsCount),
    deliveryTime: Number(form.deliveryTime),
  };

  try {
    await businessStore.createBusiness(payload);

    // Reset form
    form.name = "";
    form.productionSlotsCount = 0;
    form.deliveryTime = 0;

    // Navigate to the list view
    router.push({ name: "ShowAllBusinesses" });
  } catch (err: any) {
    console.error(err);
    alert(`Failed to create business: ${err.message || err}`);
  }
}
</script>

<template>
  <h1>Create a new business</h1>
  <form @submit.prevent="createBusiness">
    <label for="businessName">Business Name:</label>
    <input v-model="form.name" type="text" id="businessName" name="businessName" required />

    <label for="productionSlotsCount">Production Slots Count:</label>
    <input
      v-model.number="form.productionSlotsCount"
      type="number"
      id="productionSlotsCount"
      name="productionSlotsCount"
      required
      min="0" />

    <label for="deliveryTime">Delivery Time (hours):</label>
    <input v-model.number="form.deliveryTime" type="number" id="deliveryTime" name="deliveryTime" required min="0" />

    <button type="submit">Create Business</button>
  </form>
</template>
