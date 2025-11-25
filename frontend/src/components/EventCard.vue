<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  event: {
    _id: string;
    businessId: string;
    customerId: string;
    success: boolean;
    reason: string;
    productName: string;
    cost: number;
    productIds: string[];
    extra: Record<string, any>;
    createdAt: string;
  };
}>();

const extractCustomerId = (event: any) => {
  const parts = event.customerId?.split("_") ?? [];
  return parts[3] || parts[parts.length - 1] || "Unknown";
};
</script>

<template>
  <div class="event-card">
    <div class="card-header">
      <div class="card-left-side">
        <h2 :class="event.success ? 'success' : 'failure'">{{ event.success ? "Success" : "Failure" }}</h2>
        <p class="reason">{{ event.reason }}</p>
      </div>
      <p class="card-right-side">{{ new Date(event.createdAt).toLocaleString("he-IL") }}</p>
    </div>
    <hr />
    <div class="card-content">
      <div class="card-content-info">
        <p class="customer-id"><strong>Customer: </strong> #{{ extractCustomerId(event) }}</p>
        <p class="products"><strong>Product: </strong>{{ event.productName }}</p>
      </div>
      <p class="cost"><strong>$</strong>{{ event.cost }}</p>
    </div>
  </div>
</template>

<style scoped>
.event-card {
  padding: 1.2rem;
  border-radius: 1rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-left-side {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .success {
      color: #66c880;
      font-size: 1.7rem;
      font-weight: bold;
      margin: 0;
    }

    .failure {
      color: #e74c3c;
      font-size: 1.7rem;
      font-weight: bold;
      margin: 0;
    }

    .reason {
      font-size: 1.3rem;
      background-color: #ffc900;
      margin: 0;
      padding: 0.7rem 1rem 0.6rem;
      border-radius: 0.5rem;
    }

    .card-right-side {
      font-size: 1.5rem;
      color: #666;
    }
  }

  .customer-id {
    font-size: 1.3rem;
    margin: 0.5rem 0;
  }
  .products {
    font-size: 1.3rem;
    margin: 0.5rem 0;
  }

  .card-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .cost {
      font-size: 1.5rem;
      color: #42b983;
      font-weight: bold;
    }
  }
}
</style>
