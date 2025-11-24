import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import "./assets/main.scss";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

const pinia = createPinia();

if (localStorage.getItem("piniaState")) {
  const savedState = JSON.parse(localStorage.getItem("piniaState") as string);
  pinia.state.value = savedState;
}

watch(
  pinia.state,
  (state) => {
    localStorage.setItem("piniaState", JSON.stringify(state));
  },
  { deep: true }
);

app.use(pinia);
app.use(router);

app.mount("#app");
