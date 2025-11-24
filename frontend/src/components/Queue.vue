<script setup lang="ts">
import { useSimulationStore } from "@/stores/SimulationStore";

const simulation = useSimulationStore();
const props = defineProps({
  queue: {
    type: Object as () => { id: String | number; number: number; isOpen: boolean; customers: any[] },
    required: true,
  },
});
</script>

<template>
  <div class="queue-container">
    <p>
      Queue #{{ props.queue.number }}
      <span :class="props.queue.isOpen ? 'open' : 'closed'" @click="simulation.toggleQueueOpen(props.queue.id)">{{
        props.queue.isOpen ? "Open" : "Closed"
      }}</span>
    </p>
    <div class="cash-register-container">
      <svg
        class="cash-register"
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 512.002 512.002"
        xml:space="preserve"
        fill="#000000">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <circle style="fill: #31bafd" cx="256.001" cy="256" r="256"></circle>
          <path
            style="fill: #2b9ed8"
            d="M390.465,157.868c0,0-32.59,30.07-47.004,43.37L227.556,85.333l-7.199,12.471l-93.649,26.448 l49.695,49.695l47.688,151.28c-36.195,23.169-103.395,66.258-102.555,66.258l120.108,120.108c4.753,0.262,9.537,0.409,14.357,0.409 c133.83,0,243.655-102.7,255.012-233.584L390.465,157.868z"></path>
          <rect x="160.324" y="112.028" style="fill: #cfdbe6" width="33.616" height="67.232"></rect>
          <rect x="121.536" y="157.875" style="fill: #ffffff" width="268.929" height="201.697"></rect>
          <rect x="257.725" y="157.875" style="fill: #e6f3ff" width="132.741" height="201.697"></rect>
          <rect x="121.536" y="327.646" style="fill: #324a5e" width="268.929" height="63.836"></rect>
          <g>
            <rect x="257.725" y="327.646" style="fill: #2b3b4e" width="132.741" height="63.836"></rect>
            <rect x="130.156" y="336.3" style="fill: #2b3b4e" width="251.69" height="46.545"></rect>
          </g>
          <rect x="257.725" y="336.3" style="fill: #1e2c3a" width="124.121" height="46.545"></rect>
          <rect x="126.708" y="85.333" style="fill: #e6f3ff" width="100.848" height="38.919"></rect>
          <rect x="132.311" y="91.867" style="fill: #b5f1f4" width="89.643" height="25.859"></rect>
          <rect x="142.223" y="184.837" style="fill: #4cdbc4" width="100.848" height="67.232"></rect>
          <g>
            <rect x="266.344" y="184.837" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="266.344" y="212.592" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="266.344" y="239.537" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="266.344" y="266.481" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="294.116" y="184.837" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="294.116" y="212.592" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="294.116" y="239.537" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="294.116" y="266.481" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="321.889" y="184.837" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="321.889" y="212.592" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="321.889" y="239.537" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="321.889" y="266.481" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="349.661" y="184.837" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="349.661" y="212.592" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="349.661" y="239.537" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
            <rect x="349.661" y="266.481" style="fill: #f9b54c" width="20.113" height="17.961"></rect>
          </g>
        </g>
      </svg>
      <div class="queue">
          <div
            class="customer-container"
            v-for="customer in props.queue.customers"
            :key="customer.id"
            :class="{ 'priority-1': customer.priority === 1, 'priority-2': customer.priority === 2 }"
          >
            <div class="time-left">{{ customer.orderingTimeLeft }}</div>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.queue-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;

  p {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
  }

  .open {
    padding: 0.7rem 1rem 0.6rem;
    color: white;
    font-weight: bold;
    border-radius: 0.5rem;
    background-color: #66c880;
    cursor: pointer;
  }
  .closed {
    padding: 0.7rem 1rem 0.6rem;
    color: white;
    font-weight: bold;
    border-radius: 0.5rem;
    background-color: #e74c3c;
    cursor: pointer;
  }
}
.cash-register-container {
  display: flex;
  align-items: center;
}
.cash-register {
  flex: 1;
  width: 8rem;
  height: 8rem;
  margin-bottom: 2rem;
}
.queue {
  flex: 9;
  display: flex;
  gap: 1rem;
  border: 1px solid #ccc;
  border-radius: 2rem;
  padding: 2rem;
  background-color: white;

  .customer-container {
    position: relative;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: #66c880;

    &.priority-1 {
      background-color: #ff9f43; /* orange */
    }

    &.priority-2 {
      background-color: #ffd700; /* gold */
    }

    .time-left {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      font-size: 2rem;
    }
  }
}
</style>
