<script setup lang="ts">
import { computed } from "vue";
import ProductPlaceholder from "../assets/placeholders/product-placeholder.jpg";
import Fries from "@/assets/icons/fries.svg";
import OnionRings from "@/assets/icons/onion-rings.svg";
import Hamburger from "@/assets/icons/hamburger.svg";

const props = defineProps<{ product: any }>();
const emit = defineEmits<{
  (e: "edit", id: string | number): void;
  (e: "delete", id: string | number): void;
}>();

const ICONS: Record<string, string> = {
  fries: Fries,
  "onion rings": OnionRings,
  hamburger: Hamburger,
};

const iconSrc = computed(() => {
  const name = String(props.product?.name ?? "")
    .toLowerCase()
    .trim();
  return ICONS[name] ?? ProductPlaceholder;
});
</script>

<template>
  <div class="product-card">
    <div class="product-image-wrapper">
      <img :src="iconSrc" alt="Product Image" class="product-image" />
    </div>
    <div class="product-details">
      <h2 class="product-name">{{ product.name.length > 20 ? product.name.slice(0, 20) + "..." : product.name }}</h2>
      <p class="product-price">$ {{ product.price.toFixed(2) }}</p>
    </div>

    <div class="action-buttons">
      <svg
        class="edit-icon"
        @click="() => emit('edit', product._id)"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path
            d="M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z"
            stroke="#42b983"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"></path>
          <path
            d="M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13"
            stroke="#42b983"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"></path>
        </g>
      </svg>
      <svg
        class="delete-icon"
        @click="() => emit('delete', product._id)"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path
            d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M6 7H5M6 7H8M18 7H19M18 7H16M10 11V16M14 11V16M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7M8 7H16"
            stroke="#dc4446"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"></path>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 2.5rem;
  padding: 1.5rem;
  background-color: white;

  .product-image-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
    width: 100%;
    height: 20rem;
    border-radius: 2.5rem;
    margin-bottom: 1rem;

    .product-image {
      width: 15rem;
      object-fit: cover;
    }
  }

  .product-details {
    width: 100%;
    .product-name {
      font-size: 2.5rem;
      margin: 0.5rem 0 0;
      word-break: break-word;
    }

    .product-price {
      font-size: 2rem;
      margin: 1.5rem 0 0.5rem;
    }
  }

  .action-buttons {
    position: absolute;
    right: 7%;
    bottom: 7%;
    display: flex;
    gap: 1rem;

    .edit-icon,
    .delete-icon {
      width: 2rem;
      height: 2rem;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .edit-icon:hover,
    .delete-icon:hover {
      transform: scale(1.1);
    }
  }
}
</style>
