<script setup lang="ts">
import { computed, reactive, watch, ref } from "vue";
import { useRouter } from "vue-router";
import { useBusinessStore } from "@/stores/BusinessStore";
import { useToastStore } from "@/stores/ToastStore";
import Modal from "@/components/Modal.vue";

const businessStore = useBusinessStore();
const toastStore = useToastStore();
const selected = computed(() => businessStore.selectedBusiness);
const router = useRouter();

const deleteModalVisible = ref(false);
const deleteTargetId = ref<string | number | null>(null);

const form = reactive({
  name: "",
  queueCount: 0,
  productionSlotsCount: 0,
  deliveryTime: 0,
});

watch(
  selected,
  (b) => {
    if (b) {
      form.name = b.name ?? "";
      form.queueCount = b.queueCount ?? 0;
      form.productionSlotsCount = b.productionSlotsCount ?? 0;
      form.deliveryTime = b.deliveryTime ?? 0;
    }
  },
  { immediate: true }
);

async function save() {
  if (!selected.value || !selected.value._id) {
    toastStore.addToast({ type: "error", message: "No business selected." });
    return;
  }

  const payload = {
    name: form.name.trim(),
    queueCount: Number(form.queueCount),
    productionSlotsCount: Number(form.productionSlotsCount),
    deliveryTime: Number(form.deliveryTime),
  };

  try {
    await businessStore.updateBusiness(selected.value._id as string | number, payload);
    toastStore.addToast({ type: "success", message: "Business settings saved." });
  } catch (err) {
    console.error(err);
    toastStore.addToast({ type: "error", message: "Failed to save settings. See console for details." });
  }
}

function reset() {
  if (!selected.value) return;
  form.name = selected.value.name ?? "";
  form.queueCount = selected.value.queueCount ?? 0;
  form.productionSlotsCount = selected.value.productionSlotsCount ?? 0;
  form.deliveryTime = selected.value.deliveryTime ?? 0;
}

function onDeleteRequested(id: string | number | undefined) {
  deleteTargetId.value = id ?? null;
  deleteModalVisible.value = true;
}

async function confirmDelete() {
  if (deleteTargetId.value == null) return;
  await businessStore.deleteBusiness(deleteTargetId.value as string | number);
  toastStore.addToast({ type: "success", message: "Business deleted successfully." });
  deleteTargetId.value = null;
  deleteModalVisible.value = false;
  router.push("/business/all");
}
</script>

<template>
  <div>
    <h1 class="title">Business Settings</h1>

    <div v-if="!selected" class="no-business">
      <p>No business loaded. Go to load businesses page and use the load button on a business card to open settings.</p>
      <RouterLink to="/business/all">
        <button class="primary-button">Go to Businesses</button>
      </RouterLink>
    </div>

    <form v-else @submit.prevent="save">
      <div class="form-item">
        <label for="name">Business Name:</label>
        <input id="name" type="text" v-model="form.name" />
      </div>
      <div class="form-item">
        <label for="queueCount">Queue Count:</label>
        <input id="queueCount" type="number" v-model.number="form.queueCount" min="0" />
      </div>
      <div class="form-item">
        <label for="productionSlotsCount">Production Slots Count:</label>
        <input id="productionSlotsCount" type="number" v-model.number="form.productionSlotsCount" min="0" />
      </div>
      <div class="form-item">
        <label for="deliveryTime">Delivery Time (seconds):</label>
        <input id="deliveryTime" type="number" v-model.number="form.deliveryTime" min="0" />
      </div>

      <div class="action-buttons">
        <button type="button" class="secondary-button" @click="reset">Reset</button>
        <button type="submit" class="primary-button">Save</button>
      </div>
    </form>

    <button @click="onDeleteRequested(selected?._id)" class="danger-button delete-business" v-if="selected">
      Delete Business
    </button>
  </div>

  <Modal
    v-model:modelValue="deleteModalVisible"
    :title="'Delete Business'"
    okButtonText="Delete"
    cancelButtonText="Cancel"
    :okButtonClass="'danger-button'"
    :cancelButtonClass="'secondary-button'"
    @ok="confirmDelete"
    @cancel="() => (deleteModalVisible = false)">
    <div class="delete-modal">
      <p>Are you sure you want to delete this business?</p>
      <p>This action cannot be undone.</p>
    </div>
  </Modal>
</template>

<style scoped>
.title {
  font-size: 4rem;
  margin-bottom: 3rem;
  color: #42b983;
}
.no-business {
  font-size: 2rem;
  color: #888;
  margin-bottom: 2rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 50rem;

  .form-item {
    display: flex;
    flex-direction: column;
    font-size: 2rem;

    label {
      margin-bottom: 0.5rem;
    }

    input {
      padding: 1rem;
      font-size: 2rem;
      border: 1px solid #ccc;
      border-radius: 0.5rem;
      transition: border-color 0.2s ease;

      &:focus {
        outline: none;
        border-color: #42b983;
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: end;
    margin-top: 2rem;
    gap: 1rem;
  }
}

.delete-business {
  margin-top: 2rem;
}

.delete-modal {
  font-size: 1.7rem;

  p {
    margin: 0.5rem 0;
  }
}
</style>
