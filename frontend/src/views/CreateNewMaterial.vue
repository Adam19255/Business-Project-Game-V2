<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useMaterialStore } from "@/stores/MaterialStore";
import { useBusinessStore } from "@/stores/BusinessStore";

const router = useRouter();
const materialStore = useMaterialStore();
const businessStore = useBusinessStore();

const name = ref("");
const timeRequired = ref<number | null>(null);
const stock = ref<number | null>(null);
const error = ref<string | null>(null);

async function submit() {
  error.value = null;
  try {
    if (!businessStore.selectedBusiness) {
      error.value = "No business selected.";
      return;
    }
    if (!name.value || timeRequired.value === null || stock.value === null) {
      error.value = "Please fill all fields.";
      return;
    }

    await materialStore.createMaterial({
      name: name.value,
      timeRequired: Number(timeRequired.value),
      stock: Number(stock.value),
    });
    router.push({ path: "/materials" });
  } catch (e: any) {
    error.value = e?.message || "Failed to create material.";
  }
}
</script>

<template>
  <div class="page-container">
    <h1>Create New Material</h1>
    <div class="form">
      <label>
        Name
        <input v-model="name" type="text" />
      </label>

      <label>
        Time Required
        <input v-model.number="timeRequired" type="number" />
      </label>

      <label>
        Stock
        <input v-model.number="stock" type="number" />
      </label>

      <div class="actions">
        <button @click="submit">Create Material</button>
        <RouterLink to="/materials">Cancel</RouterLink>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 1.5rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 560px;
}
label {
  display: flex;
  flex-direction: column;
  font-weight: 500;
}
.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.error {
  color: #c53030;
}
</style>
