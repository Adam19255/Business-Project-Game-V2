<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import SuccessSVG from "@/assets/icons/success.svg";
import WarningSVG from "@/assets/icons/warning.svg";
import ErrorSVG from "@/assets/icons/error.svg";

const props = defineProps<{
  id?: string;
  type: "success" | "warning" | "error";
  message: string;
  timer?: number;
}>();

const emit = defineEmits<(e: "hidden", id?: string) => void>();

const visible = ref(true);
let timeoutId: number | undefined;

const startTimer = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  const ms = props.timer ?? 3000;
  timeoutId = window.setTimeout(() => {
    visible.value = false;
  }, ms);
};

onMounted(() => {
  visible.value = true;
  startTimer();
});

watch(
  () => props.message,
  (newVal) => {
    if (newVal) {
      visible.value = true;
      startTimer();
    }
  }
);

onBeforeUnmount(() => {
  if (timeoutId) clearTimeout(timeoutId);
});

// notify parent/store when hidden
watch(visible, (v) => {
  if (!v) {
    // give the transition a moment to finish before removing from store
    window.setTimeout(() => emit("hidden", props.id), 350);
  }
});
</script>

<template>
  <transition name="fade-slide" appear>
    <div v-if="visible" class="message-container">
      <img v-if="type === 'success'" :src="SuccessSVG" class="icon" alt="success" />
      <img v-else-if="type === 'warning'" :src="WarningSVG" class="icon" alt="warning" />
      <img v-else-if="type === 'error'" :src="ErrorSVG" class="icon" alt="error" />
      <span class="message-text">
        {{ message }}
      </span>
    </div>
  </transition>
</template>

<style scoped>
.message-container {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: white;
  border-radius: 2rem;
  gap: 1rem;
}

.icon {
  width: 2rem;
  height: 2rem;
}

.message-text {
  margin-top: 0.1rem;
  font-size: 1.25rem;
  color: #333;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 300ms ease, transform 300ms ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
