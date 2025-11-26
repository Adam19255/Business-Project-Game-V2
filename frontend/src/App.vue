<script setup lang="ts">
import Sidebar from "./views/sidebar.vue";
import { onMounted } from "vue";
import { useBusinessStore } from "@/stores/BusinessStore";
import MessagesStack from "@/components/MessagesStack.vue";

const businessStore = useBusinessStore();

onMounted(() => {
  businessStore.fetchBusinesses();
});
</script>

<template>
  <Sidebar />
  <div class="content-container">
    <MessagesStack />
    <router-view />
  </div>
</template>
