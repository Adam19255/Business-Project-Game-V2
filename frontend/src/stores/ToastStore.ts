import { ref } from "vue";
import { defineStore } from "pinia";

export interface Toast {
  id: string;
  type: "success" | "warning" | "error";
  message: string;
  timer?: number;
}

export const useToastStore = defineStore("toast", () => {
  const toasts = ref<Toast[]>([]);

  function addToast(payload: Omit<Toast, "id">) {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    toasts.value.push({ id, ...payload });
    return id;
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, addToast, removeToast };
});
