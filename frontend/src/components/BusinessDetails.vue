<script setup lang="ts">
import ImagePlaceholder from "@/assets/image-placeholder.jpg";

const props = defineProps(["business"]);

function loadBusiness() {
  // Placeholder for loading business logic
  console.log(`Loading business: ${props.business.name}`);
}
</script>

<template>
  <div class="business-card">
    <img :src="ImagePlaceholder" alt="Business Image" class="business-image" />
    <div class="business-details">
      <h2>{{ props.business.name }}</h2>
      <p>Production Slots: {{ props.business.productionSlotsCount }}</p>
      <p>Delivery Time: {{ props.business.deliveryTime }} hours</p>
      <p>Products Count: {{ props.business.products.length }}</p>
    </div>
    <button @click="loadBusiness">Load Business</button>
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

  .business-image {
    width: 100%;
    height: 30rem;
    object-fit: cover;
    border-radius: 2.5rem;
    margin-bottom: 1rem;
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
  }
}
</style>
