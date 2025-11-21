import { createRouter, createWebHistory } from "vue-router";
import createNewBusiness from "@/views/CreateNewBusiness.vue";
import ShowAllBusinesses from "@/views/ShowAllBusinesses.vue";
import BusinessSettings from "@/views/BusinessSettings.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/create-new-business",
      name: "CreateNewBusiness",
      component: createNewBusiness,
    },
    {
      path: "/show-all-businesses",
      name: "ShowAllBusinesses",
      component: ShowAllBusinesses,
    },
    {
      path: "/business-settings",
      name: "BusinessSettings",
      component: BusinessSettings,
    },
  ],
});

export default router;
