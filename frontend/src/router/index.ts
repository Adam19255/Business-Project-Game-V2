import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";
import createNewBusiness from "@/views/CreateNewBusiness.vue";
import ShowAllBusinesses from "@/views/ShowAllBusinesses.vue";
import BusinessSettings from "@/views/BusinessSettings.vue";
import ManageMaterials from "@/views/ManageMaterials.vue";
import CreateNewMaterial from "@/views/CreateNewMaterial.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Dashboard",
      component: Dashboard,
    },
    {
      path: "/business/new",
      name: "CreateNewBusiness",
      component: createNewBusiness,
    },
    {
      path: "/business/all",
      name: "ShowAllBusinesses",
      component: ShowAllBusinesses,
    },
    {
      path: "/materials",
      name: "ManageMaterials",
      component: ManageMaterials,
    },
    {
      path: "/materials/new",
      name: "CreateNewMaterial",
      component: CreateNewMaterial,
    },
    {
      path: "/business/settings",
      name: "BusinessSettings",
      component: BusinessSettings,
    },
  ],
});

export default router;
