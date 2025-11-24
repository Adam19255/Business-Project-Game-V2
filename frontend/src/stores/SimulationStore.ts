// src/stores/SimulationStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { useBusinessStore } from "./BusinessStore";
import { useProductStore } from "./ProductStore";
import { useMaterialStore } from "./MaterialStore";
// import { postEvent } from "@/services/api";

type ID = string;

export interface Customer {
  id: ID;
  priority: 0 | 1 | 2;
  order: ID[]; // product IDs
  orderingTimeLeft: number; // seconds left to finish ordering
  retries?: number;
}

export interface Queue {
  id: ID;
  number: number;
  customers: Customer[];
  isOpen: boolean;
}

export interface ProductionSlot {
  id: ID;
  orderId: ID;
  productId: ID;
  materialIndex: number; // which material is currently being processed
  materialTimeLeft: number; // seconds left for current material
  materialsDone: string[]; // material ids done
  totalTimeLeft: number; // fallback / additional tracking
}

export interface DeliveryItem {
  id: ID;
  orderId: ID;
  productId: ID;
  timeLeft: number;
}

const SNAPSHOT_KEY = "business_sim_snapshot";

export const useSimulationStore = defineStore("simulation", () => {
  const businessStore = useBusinessStore();
  const productStore = useProductStore();
  const materialStore = useMaterialStore();

  const activeBusinessId = ref<string | number | null>(null);
  const queues = ref<Queue[]>([]);
  const creationQueue = ref<ProductionSlot[]>([]);
  const productionSlots = ref<ProductionSlot[]>([]);
  const deliveries = ref<DeliveryItem[]>([]);
  const tickHandle = ref<number | null>(null);

  function getBusiness() {
    return businessStore.selectedBusiness;
  }

  function saveSnapshot() {
    const payload = {
      activeBusinessId: activeBusinessId.value,
      queues: queues.value,
      creationQueue: creationQueue.value,
      productionSlots: productionSlots.value,
      deliveries: deliveries.value,
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload));
  }

  function loadSnapshot() {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      activeBusinessId.value = parsed.activeBusinessId ?? null;
      queues.value = parsed.queues ?? [];
      creationQueue.value = parsed.creationQueue ?? [];
      productionSlots.value = parsed.productionSlots ?? [];
      deliveries.value = parsed.deliveries ?? [];
      return true;
    } catch (e) {
      console.warn("Failed to parse simulation snapshot", e);
      return false;
    }
  }

  // initialize simulation state for selected business
  function initForBusiness(businessId: string | number) {
    activeBusinessId.value = businessId;
    // initialize 3 queues by queueCount of business
    const business = businessStore.businesses.find((b) => String(b._id) === String(businessId));
    const queueCount = business?.queueCount ?? 3;
    queues.value = [];
    for (let i = 1; i <= queueCount; i++) {
      queues.value.push({ id: `q${i}`, number: i, customers: [], isOpen: i <= queueCount });
    }

    creationQueue.value = [];
    productionSlots.value = [];
    deliveries.value = [];
    saveSnapshot();
  }

  // tick logic: call every second
  function tick() {
    // 1. Advance ordering timers for customers
    for (const queue of queues.value) {
      if (!queue.customers.length) continue;
      const first = queue.customers[0] as Customer;
      if (first.orderingTimeLeft > 0) {
        first.orderingTimeLeft = Math.max(0, first.orderingTimeLeft - 1);
        if (first.orderingTimeLeft === 0) {
          // attempt to fulfill order
          attemptFulfillOrder(queue, first);
          // remove customer from queue whether success or failure
          queue.customers.shift();
        }
      }
    }

    // 2. Advance production slots
    for (const slot of productionSlots.value) {
      if (slot.materialTimeLeft > 0) {
        slot.materialTimeLeft = Math.max(0, slot.materialTimeLeft - 1);
        slot.totalTimeLeft = Math.max(0, slot.totalTimeLeft - 1);
      }

      // check if current material finished
      if (slot.materialTimeLeft === 0) {
        // mark material done
        const product = productStore.products.find((p) => String(p._id) === String(slot.productId));
        if (product) {
          const materialId = product.materials[slot.materialIndex];
          if (materialId && !slot.materialsDone.includes(materialId)) {
            slot.materialsDone.push(materialId);
          }
        }

        // move to next material
        const prod = productStore.products.find((p) => String(p._id) === String(slot.productId));
        if (!prod) {
          // product vanished: move to delivery as failed (skip), this can happen if product was deleted mid-production
          startDelivery(slot.orderId, slot.productId);
          // remove from productionSlots - will be cleaned below
          slot.totalTimeLeft = 0;
          continue;
        }

        const nextIndex = slot.materialIndex + 1;
        if (nextIndex < prod.materials.length) {
          // set next material timeLeft
          const nextMaterialId = prod.materials[nextIndex];
          const material = materialStore.materials.find((m) => String(m._id) === String(nextMaterialId));
          const nextTime = material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
          slot.materialIndex = nextIndex;
          slot.materialTimeLeft = nextTime;
          // totalTimeLeft already includes remaining time
        } else {
          // all materials done -> send to delivery
          startDelivery(slot.orderId, slot.productId);
          // mark for removal by setting totalTimeLeft = 0
          slot.totalTimeLeft = 0;
        }
      }
    }

    // remove finished production slots
    productionSlots.value = productionSlots.value.filter((s) => s.totalTimeLeft > 0);

    // 3. advance deliveries
    for (const delivery of deliveries.value) {
      delivery.timeLeft = Math.max(0, delivery.timeLeft - 1);
    }
    // complete deliveries
    const completed = deliveries.value.filter((delivery) => delivery.timeLeft === 0);
    for (const c of completed) {
      // postEvent({
      //   time: Date.now(),
      //   type: "DELIVERY_COMPLETE",
      //   payload: { orderId: c.orderId, productId: c.productId },
      // }).catch(() => {});
    }
    deliveries.value = deliveries.value.filter((d) => d.timeLeft > 0);

    // 4. try to move waiting creation queue into production slots (if business has free slots)
    fillProductionSlots();

    saveSnapshot();
  }

  function attemptFulfillOrder(queue: Queue, customer: Customer) {
    // Simplified: single product orders for now (customer.order[0])
    const productId = customer.order[0];
    const product = productStore.products.find((p) => String(p._id) === String(productId));
    if (!product) {
      // product does not exist -> fail
      emitOrderResult(customer.id, false, "PRODUCT_NOT_FOUND");
      return;
    }

    // Gather material objects
    const requiredMaterialIds = product.materials ?? [];
    const missing: string[] = [];
    for (const materialId of requiredMaterialIds) {
      const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
      if (!material || (material.stock ?? 0) <= 0) {
        missing.push(materialId);
      }
    }

    if (missing.length > 0) {
      // order fail due to missing materials
      emitOrderResult(customer.id, false, "MATERIALS_MISSING", { missing });
      // customer leaves queue on fail
      return;
    }

    // deduct materials (update backend via materialStore.updateMaterial to persist)
    for (const materialId of requiredMaterialIds) {
      const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
      if (material) {
        // decrement stock and persist
        const newStock = Math.max(0, (material.stock ?? 0) - 1);
        materialStore.updateMaterial(material._id as string | number, { stock: newStock }).catch((e) => {
          console.warn("Failed to persist material stock change", e);
        });
        // update in-memory copy immediate (so subsequent checks read new value)
        material.stock = newStock;
      }
    }

    // create production slot or queue it
    const orderId = `order_${customer.id}_${Date.now()}`;
    const prodSlot: ProductionSlot = {
      id: `ps_${orderId}`,
      orderId,
      productId: product._id as ID,
      materialIndex: 0,
      materialsDone: [],
      materialTimeLeft: (() => {
        const firstMaterialId = product.materials?.[0];
        const material = materialStore.materials.find((m) => String(m._id) === String(firstMaterialId));
        return material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
      })(),
      totalTimeLeft: product.materials
        .map((materialId) => {
          const material = materialStore.materials.find((x) => String(x._id) === String(materialId));
          return material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
        })
        .reduce((a, b) => a + b, 0),
    };

    // if free production slot available, start immediately
    const business = getBusiness();
    if (!business) {
      // no business loaded -> fail
      emitOrderResult(customer.id, false, "NO_BUSINESS_LOADED");
      return;
    }

    const usedSlots = productionSlots.value.length;
    if (usedSlots < (business.productionSlotsCount ?? 0)) {
      productionSlots.value.push(prodSlot);
      emitOrderResult(customer.id, true, "ORDER_ACCEPTED_AND_STARTED", { orderId });
      // postEvent({
      //   time: Date.now(),
      //   type: "ORDER_ACCEPTED",
      //   payload: { orderId, productId: product._id, customerId: customer.id },
      // }).catch(() => {});
    } else {
      // put into creationQueue (FIFO)
      creationQueue.value.push(prodSlot);
      emitOrderResult(customer.id, true, "ORDER_QUEUED", { orderId });
      // postEvent({
      //   time: Date.now(),
      //   type: "ORDER_QUEUED",
      //   payload: { orderId, productId: product._id, customerId: customer.id },
      // }).catch(() => {});
    }
  }

  function emitOrderResult(customerId: ID, success: boolean, reason: string, extra?: any) {
    console.log(`Order for customer ${customerId} ${success ? "succeeded" : "failed"}: ${reason}`);
    // postEvent({
    //   time: Date.now(),
    //   type: success ? "ORDER_SUCCESS" : "ORDER_FAILED",
    //   payload: {
    //     customerId,
    //     reason,
    //     ...extra,
    //   },
    // }).catch(() => {});
  }

  function startDelivery(orderId: ID, productId: ID) {
    const business = getBusiness();
    const deliveryTime = business?.deliveryTime ?? 5;
    deliveries.value.push({
      id: `d_${orderId}`,
      orderId,
      productId,
      timeLeft: Math.max(1, Math.floor(deliveryTime)),
    });

    // remove production slot with this orderId
    productionSlots.value = productionSlots.value.filter((p) => p.orderId !== orderId);

    // postEvent({
    //   time: Date.now(),
    //   type: "PRODUCTION_FINISHED",
    //   payload: { orderId, productId },
    // }).catch(() => {});
  }

  function fillProductionSlots() {
    const business = getBusiness();
    if (!business) return;

    const freeSlots = Math.max(0, (business.productionSlotsCount ?? 0) - productionSlots.value.length);
    if (freeSlots <= 0) return;
    // move up to freeSlots from creationQueue to productionSlots
    for (let i = 0; i < freeSlots; i++) {
      const next = creationQueue.value.shift();
      if (!next) break;
      productionSlots.value.push(next);
      // postEvent({
      //   time: Date.now(),
      //   type: "PRODUCTION_STARTED_FROM_QUEUE",
      //   payload: { orderId: next.orderId, productId: next.productId },
      // }).catch(() => {});
    }
  }

  function startTicking() {
    if (tickHandle.value != null) return;
    tickHandle.value = window.setInterval(() => tick(), 1000);
  }

  function stopTicking() {
    if (tickHandle.value != null) {
      clearInterval(tickHandle.value);
      tickHandle.value = null;
    }
  }

  function clearSimulation() {
    activeBusinessId.value = null;
    queues.value = [];
    creationQueue.value = [];
    productionSlots.value = [];
    deliveries.value = [];
    saveSnapshot();
  }

  // add customer to a specific queue (or automatically to shortest)
  function enqueueCustomer(customer: Partial<Customer>, queueId?: ID) {
    const c: Customer = {
      id: customer.id ?? `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      priority: customer.priority ?? 0,
      order: customer.order ?? [],
      // customers ordering time between 2 and 6 seconds
      orderingTimeLeft: customer.orderingTimeLeft ?? Math.max(1, Math.floor(Math.random() * 5) + 2),
      retries: 0,
    };

    if (queueId) {
      const q = queues.value.find((x) => x.id === queueId);
      if (q) {
        q.customers.push(c);
        saveSnapshot();
        return c;
      }
    }

    // add to shortest open queue
    if (queues.value.length === 0) {
      console.warn("No queues available");
      return null;
    }

    let openQueues = queues.value.filter((q) => q.isOpen);
    if (openQueues.length === 0) openQueues = queues.value;

    const shortest = openQueues.reduce((min, q) => (q.customers.length < min.customers.length ? q : min));
    shortest.customers.push(c);
    saveSnapshot();
    return c;
  }

  // add random customer ordering random product
  function addRandomCustomer() {
    const products = productStore.products;
    if (!products.length) return null;

    const p = products[Math.floor(Math.random() * products.length)];
    if (!p || !p._id) return null;

    return enqueueCustomer({ order: [String(p._id)] });
  }

  // init from selected business or load snapshot
  function initFromSelectedBusiness() {
    const selectedBusiness = businessStore.selectedBusiness;
    if (!selectedBusiness) return;
    initForBusiness(selectedBusiness._id as string | number);
    saveSnapshot();
  }

  return {
    // state
    activeBusinessId,
    queues,
    creationQueue,
    productionSlots,
    deliveries,

    // actions
    loadSnapshot,
    saveSnapshot,
    initForBusiness,
    initFromSelectedBusiness,
    enqueueCustomer,
    addRandomCustomer,
    startTicking,
    stopTicking,
    clearSimulation,
    tick,
  };
});
