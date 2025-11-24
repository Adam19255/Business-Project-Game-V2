<script setup lang="ts">
const props = defineProps<{
  event: {
    _id: string;
    businessId: string;
    customerId: string;
    success: boolean;
    reason: string;
    productIds: string[];
    extra: Record<string, any>;
    createdAt: string;
  };
}>();
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
      <p class="customer-id"><strong>Customer: </strong>{{ event.customerId }}</p>
      <p class="products"><strong>Products: </strong>{{ event.productIds.join(", ") }}</p>
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
}
</style>
