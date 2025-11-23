<script setup lang="ts">
import Sidebar from "./views/sidebar.vue";
import { onMounted } from "vue";
import { useBusinessStore } from "@/stores/BusinessStore";

const businessStore = useBusinessStore();

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
