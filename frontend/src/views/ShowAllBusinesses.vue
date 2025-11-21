<script setup lang="ts">
import { onMounted } from "vue";
import { useBusinessStore } from "../stores/BusinessStore";
import BusinessDetails from "../components/BusinessDetails.vue";

const businessStore = useBusinessStore();

onMounted(() => {
  businessStore.fetchBusinesses();
});
</script>

<template>
  <div v-if="businessStore.isLoading">Loading...</div>
  <div v-else class="business-list">
    <BusinessDetails v-for="business in businessStore.businesses" :key="business.id" :business="business" />
  </div>
</template>

<style scoped>
.business-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}
</style>
