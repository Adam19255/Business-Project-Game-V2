<script setup lang="ts">
import { computed } from "vue";
import { useProductStore } from "@/stores/ProductStore";
import { useMaterialStore } from "@/stores/MaterialStore";
import Buns from "@/assets/icons/buns.svg";
import Lettuce from "@/assets/icons/lettuce.svg";
import Tomato from "@/assets/icons/tomato.svg";
import Oil from "@/assets/icons/oil.svg";
import Patty from "@/assets/icons/patty.svg";
import Onion from "@/assets/icons/onion.svg";
import Pickle from "@/assets/icons/pickle.svg";
import Potato from "@/assets/icons/potato.svg";
import Fries from "@/assets/icons/fries.svg";
import OnionRings from "@/assets/icons/onion-rings.svg";
import Hamburger from "@/assets/icons/hamburger.svg";

const props = defineProps<{
  slot: {
    id: string;
    orderId: string;
    productId: string;
    name: string;
    cost: number;
    materialIndex: number;
    materialTimeLeft: number;
    materialsDone: string[];
    totalTimeLeft: number;
    priority: 0 | 1;
  };
}>();

const productStore = useProductStore();
const materialStore = useMaterialStore();

const customerId = (event: any) => {
  const parts = props.slot.orderId?.split("_") ?? [];
  return parts[3] || parts[parts.length - 1] || "Unknown";
};

const product = computed(() => productStore.products.find((p) => String(p._id) === String(props.slot.productId)));

const materialsDetailed = computed(() => {
  const ids: string[] = (product.value?.materials ?? []).map((x: any) => String(x));
  return ids.map((id) => {
    const m = materialStore.materials.find((mat) => String(mat._id) === String(id));
    return { id, name: m ? m.name : id };
  });
});

const ICONS: Record<string, string> = {
  fries: Fries,
  "onion rings": OnionRings,
  hamburger: Hamburger,
  buns: Buns,
  lettuce: Lettuce,
  tomato: Tomato,
  oil: Oil,
  patty: Patty,
  onion: Onion,
  pickle: Pickle,
  potato: Potato,
};

const iconSrc = computed(() => {
  const name = String(props.slot?.name ?? "")
    .toLowerCase()
    .trim();
  return ICONS[name] ?? Hamburger;
});
</script>

<template>
  <div class="production-slot">
    <h2 class="production-title">Production Slot (Customer: #{{ customerId(slot) }})</h2>
    <div class="production-slot-container">
      <div class="production-header">
        <p class="production-status" v-if="slot.priority === 1">⚠️ High Priority</p>
        <p class="production-status" v-else>⏳ In Progress</p>
        <div class="product-image-wrapper">
          <img :src="iconSrc" alt="Product Image" class="product-image" />
        </div>
      </div>
      <div class="production-details">
        <div class="order-details">
          <p>Order ID: #{{ customerId(slot) }}</p>
          <p>Product name: {{ slot.name }}</p>
          <p>Cost: ${{ slot.cost }}</p>
          <p>Estimated Time Left: {{ slot.totalTimeLeft }}s</p>
        </div>
        <div class="production-materials">
          <p>Materials Status:</p>
          <div class="material-status">
            <div class="material-item" v-for="(m, idx) in materialsDetailed" :key="m.id">
              <img class="material-icon" :src="ICONS[m.name.toLowerCase()]" alt="material icon" />
              <div class="material-process">
                <div class="corrently-produced" v-if="slot.materialIndex === idx">
                  <strong>↑</strong>
                  <span> {{ slot.materialTimeLeft }}s</span>
                </div>
                <span v-else-if="slot.materialsDone && slot.materialsDone.includes(m.id)"> done</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.production-title {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.production-slot-container {
  display: flex;
  align-items: center;
  border-radius: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  background-color: white;

  .production-header {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    .production-status {
      font-size: 1.6rem;
      margin: 0;
    }

    .product-image-wrapper {
      display: flex;
      align-items: center;

      .product-image {
        width: 13rem;
      }
    }
  }

  .production-details {
    flex: 5;
    display: flex;
    gap: 15rem;

    .order-details {
      font-size: 1.8rem;

      p {
        margin: 0.5rem 0;
      }
    }

    .production-materials {
      font-size: 1.8rem;
      margin-right: 10rem;

      .material-status {
        display: flex;
        align-items: center;
        margin: 0.5rem 0;
        gap: 2rem;
      }

      .material-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 2rem;
        gap: 0.5rem;

        .material-process {
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;

          .corrently-produced {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 1.5rem;
            gap: 0.2rem;
          }
        }

        .material-icon {
          width: 4rem;
        }
      }
    }
  }
}
</style>
