import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";
import createNewBusiness from "@/views/CreateNewBusiness.vue";
import ShowAllBusinesses from "@/views/ShowAllBusinesses.vue";
import BusinessSettings from "@/views/BusinessSettings.vue";
import ManageMaterials from "@/views/ManageMaterials.vue";
import ManageProducts from "@/views/ManageProducts.vue";
import { useBusinessStore } from "@/stores/BusinessStore";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/business/all",
      name: "ShowAllBusinesses",
      component: ShowAllBusinesses,
    },
    {
      path: "/business/new",
      name: "CreateNewBusiness",
      component: createNewBusiness,
    },
    {
      path: "/business/settings",
      name: "BusinessSettings",
      component: BusinessSettings,
    },
    {
      path: "/materials",
      name: "ManageMaterials",
      component: ManageMaterials,
    },
    {
      path: "/products",
      name: "ManageProducts",
      component: ManageProducts,
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: Dashboard,
    },
  ],
});

router.beforeEach((to, from) => {
  const allowedWhenNoBusiness = ["/business/all", "/business/new"];
  const businessStore = useBusinessStore();

  // if no selected business and destination is not allowed, redirect to /business/all
  if (!businessStore.selectedBusiness && !allowedWhenNoBusiness.includes(to.path)) {
    return { path: "/business/all" };
  }

  // otherwise allow navigation
  return true;
});

export default router;
