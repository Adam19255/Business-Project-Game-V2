<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useBusinessStore } from "@/stores/BusinessStore";
import BusinessDetails from "../components/BusinessDetails.vue";

interface NewBusinessForm {
  name: string;
  productionSlotsCount: number;
  deliveryTime: number;
}

const router = useRouter();
const businessStore = useBusinessStore();

const form = reactive<NewBusinessForm>({
  name: "",
  productionSlotsCount: 0,
  deliveryTime: 0,
});

async function createBusiness() {
  if (!form.name.trim()) return alert("Name is required");

  const payload = {
    name: form.name.trim(),
    productionSlotsCount: Number(form.productionSlotsCount),
    deliveryTime: Number(form.deliveryTime),
  };

  try {
    await businessStore.createBusiness(payload);

    // Reset form
    clearForm();

    // Navigate to the list view
    router.push({ name: "ShowAllBusinesses" });
  } catch (err: any) {
    console.error(err);
    alert(`Failed to create business: ${err.message || err}`);
  }
}

function clearForm() {
  form.name = "";
  const fileInput = document.getElementById("businessImage") as HTMLInputElement;
  if (fileInput) {
    fileInput.value = "";
  }
  form.productionSlotsCount = 0;
  form.deliveryTime = 0;
}
</script>

<template>
  <h1 class="title">Create your business</h1>
  <div class="preview">
    <div class="left-side">
      <form @submit.prevent="createBusiness">
        <div class="form-item">
          <label for="businessImage">Upload your business image:</label>
          <input type="file" id="businessImage" name="businessImage" />
        </div>
        <div class="form-item">
          <label for="businessName">Business Name:</label>
          <input
            v-model="form.name"
            type="text"
            id="businessName"
            name="businessName"
            placeholder="Business Name"
            required />
        </div>
        <div class="form-item">
          <label for="productionSlotsCount">Production Slots Count:</label>
          <input
            v-model.number="form.productionSlotsCount"
            type="number"
            id="productionSlotsCount"
            name="productionSlotsCount"
            required
            min="0" />
        </div>
        <div class="form-item">
          <label for="deliveryTime">Delivery Time (hours):</label>
          <input
            v-model.number="form.deliveryTime"
            type="number"
            id="deliveryTime"
            name="deliveryTime"
            required
            min="0" />
        </div>

        <div class="action-buttons">
          <button type="button" @click="clearForm" class="secondary-button">Clear</button>
          <button type="submit" class="primary-button">Create Business</button>
        </div>
      </form>
    </div>
    <div class="right-side">
      <BusinessDetails
        :business="{
          id: 'preview',
          name: form.name || 'Business Name',
          productionSlotsCount: form.productionSlotsCount,
          deliveryTime: form.deliveryTime,
          products: [],
        }" />
    </div>
  </div>
</template>

<style scoped>
.title {
  font-size: 4rem;
  margin-bottom: 3rem;
  color: #42b983;
}

.preview {
  display: flex;
  gap: 2rem;

  .left-side {
    flex: 1;

    form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background-color: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

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
  }

  .right-side {
    flex: 1;
    display: flex;
    justify-content: center;
  }
}
</style>
