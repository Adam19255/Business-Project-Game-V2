<script setup lang="ts">
import Sidebar from "./views/sidebar.vue";
import { onMounted } from "vue";
import { useBusinessStore } from "@/stores/BusinessStore";
import { useSimulationStore } from "@/stores/SimulationStore";

const businessStore = useBusinessStore();
const simulationStore = useSimulationStore();

onMounted(() => {
  businessStore.fetchBusinesses();
});
</script>

<template>
  <Sidebar />
  <div class="content-container">
    <router-view />
  </div>
</template>
