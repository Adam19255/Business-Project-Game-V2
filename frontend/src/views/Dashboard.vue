<script setup lang="ts">
import { onMounted } from "vue";
import { useSimulationStore } from "@/stores/SimulationStore";
import { useBusinessStore } from "@/stores/BusinessStore";
import Queue from "@/components/Queue.vue";

const simulation = useSimulationStore();
const businessStore = useBusinessStore();

onMounted(() => {
  if (!businessStore.selectedBusiness) {
    console.warn("Dashboard mounted without selected business");
    return;
  }

  simulation.initForBusiness(businessStore.selectedBusiness._id as string);
});
</script>

<template>
  <div class="dashboard">
    <h1>Business Dashboard</h1>

    <div class="controls">
      <button @click="simulation.startTicking">Start</button>
      <button @click="simulation.stopTicking">Stop</button>
      <button @click="simulation.addRandomCustomer">Add Random Customer</button>
      <!-- <button @click="() => $router.push('/events')">View Events</button> -->
    </div>

    <Queue v-for="queue in simulation.queues" :key="queue.id" :queue="queue" />
    <h2>Production Slots</h2>
    <pre>{{ simulation.productionSlots }}</pre>

    <h2>Deliveries</h2>
    <pre>{{ simulation.deliveries }}</pre>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}
</style>
