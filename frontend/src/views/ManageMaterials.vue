<script setup lang="ts">
import { ref } from "vue";
import { useMaterialStore } from "@/stores/MaterialStore";
import { useBusinessStore } from "@/stores/BusinessStore";
import { useToastStore } from "@/stores/ToastStore";
import MaterialCard from "@/components/MaterialCard.vue";
import Modal from "@/components/Modal.vue";

interface MaterialDraft {
  name: string;
  timeRequired: number;
  stock: number;
}

const materialStore = useMaterialStore();
const businessStore = useBusinessStore();
const toastStore = useToastStore();
const selected = ref(businessStore.selectedBusiness);

const editingId = ref<string | null>(null);
const newItemDraft = ref<MaterialDraft>({ name: "", timeRequired: 0, stock: 0 });
const draft = ref<MaterialDraft>({ name: "", timeRequired: 0, stock: 0 });
let materialName: string = "";

const addModalVisible = ref(false);
const modalVisible = ref(false);

const deleteModalVisible = ref(false);
const deleteTargetId = ref<string | number | null>(null);

async function submitNewMaterial() {
  if (!newItemDraft.value.name || newItemDraft.value.timeRequired == null || newItemDraft.value.stock == null) {
    toastStore.addToast({
      type: "error",
      message: "Please fill all fields.",
    });
    return;
  }
  await materialStore.createMaterial({
    name: newItemDraft.value.name,
    timeRequired: Number(newItemDraft.value.timeRequired),
    stock: Number(newItemDraft.value.stock),
  });
  toastStore.addToast({ type: "success", message: "Material added successfully." });
  addModalVisible.value = false;
  newItemDraft.value = { name: "", timeRequired: 0, stock: 0 };
}

function startEdit(material: MaterialDraft & { _id: string | number }) {
  editingId.value = String(material._id);
  draft.value = { ...material };
  materialName = material.name;
  modalVisible.value = true;
}

async function saveEdit() {
  if (!editingId.value) return;
  if (!draft.value.name || draft.value.timeRequired == null || draft.value.stock == null) {
    toastStore.addToast({
      type: "error",
      message: "Please fill all fields.",
    });
    return;
  }
  await materialStore.updateMaterial(editingId.value, {
    name: draft.value.name,
    timeRequired: Number(draft.value.timeRequired),
    stock: Number(draft.value.stock),
  });
  toastStore.addToast({ type: "success", message: "Material updated successfully." });
  editingId.value = null;
  modalVisible.value = false;
}

function onDeleteRequested(id: string | number | undefined) {
  deleteTargetId.value = id ?? null;
  deleteModalVisible.value = true;
}

async function confirmDelete() {
  if (deleteTargetId.value == null) return;
  await materialStore.deleteMaterial(deleteTargetId.value as string | number);
  toastStore.addToast({ type: "success", message: "Material deleted successfully." });
  deleteTargetId.value = null;
  deleteModalVisible.value = false;
}
</script>

<template>
  <div v-if="!selected" class="no-business">
    <p>No business loaded. Go to load businesses page and use the load button on a business card to open materials.</p>
    <RouterLink to="/business/all">
      <button class="primary-button">Go to Businesses</button>
    </RouterLink>
  </div>

  <div class="header" v-else>
    <div>
      <h1>Manage Materials</h1>
      <p v-if="materialStore.materials.length === 0">No materials found. Press the "New Material" button to add one.</p>
    </div>
    <div>
      <div class="primary-button add-material" @click="() => (addModalVisible = true)">
        <svg class="plus-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff">
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke="#CCCCCC"
            stroke-width="0.096"></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M4 12H20M12 4V20"
              stroke="#ffffff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"></path>
          </g>
        </svg>
        <span>New Material</span>
      </div>
    </div>
  </div>

  <div v-if="materialStore.isLoading">Loading...</div>

  <div v-else class="material-list">
    <div v-for="material in materialStore.materials" :key="material._id" class="material-wrapper">
      <MaterialCard :material="material" @edit="startEdit" @delete="() => onDeleteRequested(material._id)" />
    </div>
  </div>

  <Modal
    v-model:modelValue="addModalVisible"
    title="Add new material"
    okButtonText="Add"
    :closeOnOk="false"
    @ok="submitNewMaterial"
    @cancel="() => (addModalVisible = false)">
    <div class="edit-form">
      <div class="form-item">
        <label for="name">Name:</label>
        <input id="name" v-model="newItemDraft.name" type="text" required autofocus />
      </div>
      <div class="form-item">
        <label for="timeRequired">Time Required (seconds):</label>
        <input id="timeRequired" v-model.number="newItemDraft.timeRequired" type="number" required />
      </div>
      <div class="form-item">
        <label for="stock">Stock:</label>
        <input id="stock" v-model.number="newItemDraft.stock" type="number" required />
      </div>
    </div>
  </Modal>

  <Modal
    v-model:modelValue="modalVisible"
    :title="`Edit Material: ${materialName}`"
    okButtonText="Save"
    cancelButtonText="Cancel"
    :closeOnOk="false"
    @ok="saveEdit"
    @cancel="() => ((modalVisible = false), (editingId = null))">
    <div class="edit-form">
      <div class="form-item">
        <label for="name">Name:</label>
        <input id="name" v-model="draft.name" type="text" required autofocus />
      </div>

      <div class="form-item">
        <label for="timeRequired">Time Required (seconds):</label>
        <input id="timeRequired" v-model.number="draft.timeRequired" type="number" required />
      </div>
      <div class="form-item">
        <label for="stock">Stock:</label>
        <input id="stock" v-model.number="draft.stock" type="number" required />
      </div>
    </div>
  </Modal>

  <Modal
    v-model:modelValue="deleteModalVisible"
    :title="'Delete Material'"
    okButtonText="Delete"
    cancelButtonText="Cancel"
    :okButtonClass="'danger-button'"
    :cancelButtonClass="'secondary-button'"
    @ok="confirmDelete"
    @cancel="() => (deleteModalVisible = false)">
    <div class="delete-modal">
      <p>Are you sure you want to delete this material?</p>
      <p>This action cannot be undone.</p>
    </div>
  </Modal>
</template>

<style scoped>
.no-business {
  font-size: 2rem;
  color: #888;
  margin-bottom: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  p {
    font-size: 2rem;
  }

  .add-material {
    display: flex;
    gap: 0.5rem;
    min-width: unset;

    .plus-icon {
      width: 1.7rem;
      height: 1.7rem;
    }

    span {
      font-size: 1.7rem;
      margin-top: 0.1rem;
    }
  }
}

.material-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .form-item {
    display: flex;
    flex-direction: column;
    font-size: 1.7rem;

    label {
      margin-bottom: 0.5rem;
    }

    input {
      padding: 0.8rem;
      font-size: 1.7rem;
      border: 1px solid #ccc;
      border-radius: 0.5rem;
      transition: border-color 0.2s ease;

      &:focus {
        outline: none;
        border-color: #42b983;
      }
    }
  }
}

.delete-modal {
  font-size: 1.7rem;

  p {
    margin: 0.5rem 0;
  }
}
</style>
