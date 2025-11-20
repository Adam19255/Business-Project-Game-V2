<script setup lang="ts">
import Sidebar from "./views/sidebar.vue";
</script>

<template>
  <Sidebar />
  <div class="content-container">
    <router-view />
  </div>
</template>

<style scoped></style>
