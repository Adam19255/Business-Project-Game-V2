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

  simulation.initFromSelectedBusiness();
});
</script>

<template>
  <div class="dashboard">
    <h1>Business Dashboard</h1>

    <div class="controls">
      <button class="play-button" @click="simulation.startTicking">Start</button>
      <button class="play-button" @click="simulation.stopTicking">Stop</button>
      <button class="play-button" @click="simulation.addRegularCustomer">Add Regular Customer</button>
      <button
        class="play-button"
        :class="{ disabled: simulation.productionSlots.length === 0 }"
        :disabled="simulation.productionSlots.length === 0"
        @click="simulation.addReorderCustomer()">
        Add Reorder Customer
      </button>
      <button
        class="play-button"
        :class="{ disabled: simulation.productionSlots.length === 0 }"
        :disabled="simulation.productionSlots.length === 0"
        @click="simulation.addCancelCustomer()">
        Add Cancel Customer
      </button>
      <button class="play-button" @click="simulation.addVipCustomer">Add VIP Customer</button>
      <button class="play-button" @click="() => $router.push('/events')">View Events</button>
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

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
