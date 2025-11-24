<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
import { useBusinessStore } from "@/stores/BusinessStore";
import EventCard from "@/components/EventCard.vue";

const businessStore = useBusinessStore();
const businessId = businessStore.selectedBusiness?._id;
const events = ref<any[]>([]);
const loading = ref(true);

async function loadEvents() {
  try {
    const res = await axios.get(`http://localhost:3000/post-event/business/${businessId}`);
    events.value = res.data;
  } finally {
    loading.value = false;
  }
}

onMounted(loadEvents);
</script>

<template>
  <div class="events-page">
    <h1>Event Log</h1>
    <div v-if="loading">Loading events...</div>
    <div v-else class="event-list">
      <EventCard v-for="e in events" :key="e._id" :event="e" />
    </div>
  </div>
</template>

<style scoped>
.event-list {
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
  gap: 1.5rem;
}
</style>
