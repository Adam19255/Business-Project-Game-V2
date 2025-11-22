<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useProductStore } from "@/stores/ProductStore";
import { useBusinessStore } from "@/stores/BusinessStore";
import { useMaterialStore } from "@/stores/MaterialStore";
import ProductCard from "../components/ProductCard.vue";
import Modal from "../components/Modal.vue";
import MultiSelectListbox from "@/components/MultiSelectListbox.vue";

interface ProductDraft {
  name: string;
  price: number;
  materials: string[];
}

const materialOptions = computed(() =>
  materialStore.materials
    .filter((m) => m._id != null)
    .map((m) => ({
      label: m.name,
      value: m._id as string | number,
    }))
);

const productStore = useProductStore();
const businessStore = useBusinessStore();
const materialStore = useMaterialStore();
const selected = ref(businessStore.selectedBusiness);
const modalVisible = ref(false);
const draft = ref<ProductDraft>({ name: "", price: 0, materials: [] as string[] });
const editModalVisible = ref(false);
const deleteModalVisible = ref(false);
const deleteTargetId = ref<string | number | null>(null);
const editingId = ref<string | null>(null);
let productName: string = "";

onMounted(async () => {
  if (!selected.value) return;
  await productStore.fetchProductsForBusiness(selected.value._id as string);
  await materialStore.fetchMaterialsForBusiness(selected.value._id as string);
});

async function submitNewProduct() {
  if (
    !draft.value.name ||
    draft.value.price == null ||
    draft.value.materials == null ||
    draft.value.materials.length === 0
  ) {
    alert("Please fill all fields.");
    return;
  }
  await productStore.createProduct({
    name: draft.value.name,
    price: Number(draft.value.price),
    materials: draft.value.materials,
  });
  modalVisible.value = false;
  draft.value = { name: "", price: 0, materials: [] };
}

function startEdit(id: string | number) {
  const product = productStore.products.find((p) => p._id === id);
  if (!product) return;
  productName = product.name;
  editingId.value = String(product._id);
  draft.value = {
    name: product.name,
    price: product.price,
    materials: [...(product.materials || [])],
  };
  editModalVisible.value = true;
}

async function saveEdit() {
  if (
    !draft.value.name ||
    draft.value.price == null ||
    draft.value.materials == null ||
    draft.value.materials.length === 0
  ) {
    alert("Please fill all fields.");
    return;
  }
  await productStore.updateProduct(editingId.value as string | number, {
    name: draft.value.name,
    price: Number(draft.value.price),
    materials: draft.value.materials,
  });
  editModalVisible.value = false;
  editingId.value = null;
}

function onDeleteRequested(id: string | number | undefined) {
  deleteTargetId.value = id ?? null;
  deleteModalVisible.value = true;
}

async function confirmDelete() {
  if (deleteTargetId.value == null) return;
  await productStore.deleteProduct(deleteTargetId.value as string | number);
  deleteTargetId.value = null;
  deleteModalVisible.value = false;
}
</script>

<template>
  <div v-if="!selected" class="no-business">
    <p>No business loaded. Go to load businesses page and use the load button on a business card to open products.</p>
    <RouterLink to="/business/all">
      <button class="primary-button">Go to Businesses</button>
    </RouterLink>
  </div>

  <div class="header" v-else>
    <div>
      <h1>Manage Products</h1>
      <p v-if="productStore.products.length === 0">No products found. Press the "New Product" button to add one.</p>
    </div>
    <div>
      <div
        class="primary-button add-product"
        @click="
          () => {
            modalVisible = true;
            draft = { name: '', price: 0, materials: [] };
          }
        ">
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
        <span>New Product</span>
      </div>
    </div>
  </div>

  <div v-if="productStore.isLoading">Loading...</div>
  <div v-else class="product-list">
    <div class="product-wrapper" v-for="product in productStore.products" :key="product._id">
      <ProductCard :product="product" @edit="startEdit" @delete="() => onDeleteRequested(product._id)" />
    </div>
  </div>

  <Modal
    v-model:modelValue="modalVisible"
    title="Add new product"
    okButtonText="Add"
    @ok="submitNewProduct"
    @cancel="() => (modalVisible = false)">
    <form class="add-form">
      <div class="form-item">
        <label for="name">Name:</label>
        <input v-model="draft.name" type="text" id="name" name="name" required />
      </div>
      <div class="form-item">
        <label for="price">Price:</label>
        <input v-model.number="draft.price" type="number" id="price" name="price" required />
      </div>
      <div class="form-item">
        <label for="materials">Materials:</label>
        <MultiSelectListbox v-model="draft.materials" :options="materialOptions" searchable height="170px" />
      </div>
    </form>
  </Modal>

  <Modal
    v-model:modelValue="editModalVisible"
    :title="`Edit Product: ${productName}`"
    okButtonText="Save"
    cancelButtonText="Cancel"
    @ok="saveEdit"
    @cancel="() => ((editModalVisible = false), (editingId = null))">
    <form class="add-form">
      <div class="form-item">
        <label for="name">Name:</label>
        <input v-model="draft.name" type="text" id="name" name="name" required />
      </div>
      <div class="form-item">
        <label for="price">Price:</label>
        <input v-model.number="draft.price" type="number" id="price" name="price" required />
      </div>
      <div class="form-item">
        <label for="materials">Materials:</label>
        <MultiSelectListbox v-model="draft.materials" :options="materialOptions" searchable height="170px" />
      </div>
    </form>
  </Modal>

  <Modal
    v-model:modelValue="deleteModalVisible"
    :title="'Delete Product'"
    okButtonText="Delete"
    cancelButtonText="Cancel"
    :okButtonClass="'danger-button'"
    :cancelButtonClass="'secondary-button'"
    @ok="confirmDelete"
    @cancel="() => (deleteModalVisible = false)">
    <div class="delete-modal">
      <p>Are you sure you want to delete this product?</p>
      <p>This action cannot be undone.</p>
    </div>
  </Modal>
</template>

<style>
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

  .add-product {
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

.product-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.add-form {
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
