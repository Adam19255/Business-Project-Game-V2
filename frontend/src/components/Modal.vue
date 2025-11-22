<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  title: { type: String, default: "" },
  modelValue: { type: Boolean, default: false },
  okButtonText: { type: String, default: "Submit" },
  cancelButtonText: { type: String, default: "Cancel" },
  okButtonClass: { type: String, default: "primary-button" },
  cancelButtonClass: { type: String, default: "secondary-button" },
});

const emit = defineEmits(["ok", "cancel", "update:modelValue"]);

function onOk() {
  emit("ok");
  emit("update:modelValue", false);
}

function onCancel() {
  emit("cancel");
  emit("update:modelValue", false);
}
</script>

<template>
  <Transition name="modal-zoom">
    <div v-if="modelValue" class="modal-overlay" @click.self="onCancel">
      <div class="modal">
        <header class="modal-header">
          <h3>{{ title }}</h3>
          <svg @click="onCancel" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#6b6b6b">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <g id="Menu / Close_SM">
                <path
                  id="Vector"
                  d="M16 16L12 12M12 12L8 8M12 12L16 8M12 12L8 16"
                  stroke="#6b6b6b"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"></path>
              </g>
            </g>
          </svg>
        </header>

        <section class="modal-body">
          <slot />
        </section>

        <footer class="modal-footer">
          <button :class="cancelButtonClass" @click="onCancel">{{ cancelButtonText }}</button>
          <button :class="okButtonClass" @click="onOk">{{ okButtonText }}</button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 1.5rem;
  max-width: 60rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  position: relative;
  padding: 1.25rem 1.5rem;

  h3 {
    font-size: 1.8rem;
    margin: 1rem 0 0;
    word-break: break-word;
  }

  svg {
    position: absolute;
    right: 1%;
    top: 4%;
    width: 3rem;
    height: 3rem;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Backdrop fade */
.modal-zoom-enter-active,
.modal-zoom-leave-active {
  transition: opacity 0.25s ease;
}

.modal-zoom-enter-from,
.modal-zoom-leave-to {
  opacity: 0;
}

/* Zoom (grow/shrink) */
.modal-zoom-enter-active .modal,
.modal-zoom-leave-active .modal {
  transition: transform 0.25s ease;
}

.modal-zoom-enter-from .modal {
  transform: scale(0.85);
}

.modal-zoom-leave-to .modal {
  transform: scale(0.85);
}
</style>
