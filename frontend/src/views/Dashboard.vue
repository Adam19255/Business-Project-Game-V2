<script setup lang="ts">
import { onMounted } from "vue";
import { useSimulationStore } from "@/stores/SimulationStore";
import { useBusinessStore } from "@/stores/BusinessStore";

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
      <button @click="() => $router.push('/events')">View Events</button>
    </div>

    <h2>Queues</h2>
    <pre>{{ simulation.queues }}</pre>

    <h2>Production Slots</h2>
    <pre>{{ simulation.productionSlots }}</pre>

    <h2>Deliveries</h2>
    <pre>{{ simulation.deliveries }}</pre>
  </div>
</template>
