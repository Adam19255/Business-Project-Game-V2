<script setup lang="ts">
import Messages from "@/components/Messages.vue";
import { useToastStore } from "@/stores/ToastStore";
const toastStore = useToastStore();

function onHidden(id?: string) {
  if (id) toastStore.removeToast(id);
}
</script>

<template>
  <div class="messages-stack">
    <Messages
      v-for="t in toastStore.toasts"
      :key="t.id"
      :id="t.id"
      :type="t.type"
      :message="t.message"
      :timer="t.timer"
      @hidden="onHidden" />
  </div>
</template>

<style scoped>
.messages-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
