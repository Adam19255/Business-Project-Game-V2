<script setup lang="ts">
import Sidebar from "./views/Sidebar.vue";
</script>

<template>
  <Sidebar />
  <div class="content-container">
    <router-view />
  </div>
</template>
