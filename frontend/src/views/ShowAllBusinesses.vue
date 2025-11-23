<script setup lang="ts">
import { useBusinessStore } from "../stores/BusinessStore";
import BusinessCard from "../components/BusinessCard.vue";

const businessStore = useBusinessStore();
</script>

<template>
  <div v-if="businessStore.isLoading">Loading...</div>
  <div v-else>
    <h1 class="title">Choose your Business</h1>
    <div class="business-list">
      <BusinessCard v-for="business in businessStore.businesses" :key="business._id" :business="business" />
    </div>
  </div>
</template>

<style scoped>
.title {
  margin-bottom: 2rem;
}
.business-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}
</style>
