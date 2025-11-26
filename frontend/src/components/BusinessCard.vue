<script setup lang="ts">
import Business from "@/assets/placeholders/business.svg";

import { useRouter } from "vue-router";
import { useBusinessStore } from "@/stores/BusinessStore";

const props = defineProps(["business"]);

const router = useRouter();
const businessStore = useBusinessStore();

async function loadBusiness() {
  if (!props.business || !props.business._id) {
    console.error("No business data provided to BusinessCard component");
    return;
  }
  try {
    await businessStore.loadBusiness(props.business._id);
    router.push({ name: "Dashboard" });
  } catch (err) {
    console.error("Failed to load business:", err);
    alert("Failed to load business. See console for details.");
  }
}
</script>

<template>
  <div class="business-card">
    <div class="business-image-wrapper">
      <img :src="Business" alt="Business Image" class="business-image" />
    </div>
    <div class="business-details">
      <h2>{{ props.business.name.length > 22 ? props.business.name.slice(0, 22) + "..." : props.business.name }}</h2>
      <p>Queue Count: {{ props.business.queueCount }}</p>
      <p>Production Slots: {{ props.business.productionSlotsCount }}</p>
      <p>Delivery Time: {{ props.business.deliveryTime }} seconds</p>
    </div>
    <button @click="loadBusiness" :class="props.business.id === 'preview' ? 'hide' : ''">Load Business</button>
  </div>
</template>

<style scoped>
.business-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 2.5rem;
  padding: 1.5rem;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;

  .business-image-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
    width: 100%;
    height: 30rem;
    border-radius: 2.5rem;
    margin-bottom: 1rem;

    .business-image {
      width: 17rem;
      object-fit: cover;
    }
  }

  .business-details {
    width: 100%;
    h2 {
      font-size: 2.5rem;
      margin: 0.5rem 0 0;
    }

    p {
      font-size: 1.6rem;
      margin: 0.5rem 0;
    }
  }

  button {
    width: 100%;
    margin: 1rem 0;
    padding: 0.8rem 1.5rem;
    font-size: 1.8rem;
    background-color: rgba(66, 185, 131, 0.6);
    border: none;
    border-radius: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: #42b983;
    }

    &.hide {
      display: none;
    }
  }
}
</style>
