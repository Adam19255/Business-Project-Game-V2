// src/stores/SimulationStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { useBusinessStore } from "./BusinessStore";
import { useProductStore } from "./ProductStore";
import { useMaterialStore } from "./MaterialStore";
import axios from "axios";

const API_BASE = "http://localhost:3000";

export interface Customer {
  id: string;
  priority: 0 | 1 | 2;
  order: string[]; // product IDs
  orderingTimeLeft: number; // seconds left to finish ordering
  arrivalTime?: number;
  retries?: number;
  actionType?: "order" | "reorder" | "cancel";
  originalOrderId?: string; // original order ID for reorder/cancel
}

export interface Queue {
  id: string;
  number: number;
  customers: Customer[];
  isOpen: boolean;
}

export interface ProductionSlot {
  id: string;
  orderId: string;
  productId: string;
  materialIndex: number; // which material is currently being processed
  materialTimeLeft: number; // seconds left for current material
  materialsDone: string[]; // material ids done
  totalTimeLeft: number; // total seconds left for entire product
}

export interface DeliveryItem {
  id: string;
  orderId: string;
  productId: string;
  timeLeft: number; // time left until delivery is complete
}

export interface ExistingOrders {
  order: {
    orderId: string;
    customerId: string;
  };
}

interface OrderEventPayload {
  businessId: String | number | undefined;
  customerId: string;
  success: boolean;
  reason: string;
  productIds: string[];
  extra?: any;
}

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
  const existingOrders = ref<ExistingOrders[]>([]);

  // ensure ref arrays are valid arrays (protect against Pinia/restore overwriting them)
  function ensureArrays() {
    if (!Array.isArray(queues.value)) queues.value = [];
    if (!Array.isArray(creationQueue.value)) creationQueue.value = [];
    if (!Array.isArray(productionSlots.value)) productionSlots.value = [];
    if (!Array.isArray(deliveries.value)) deliveries.value = [];
    if (!Array.isArray(existingOrders.value)) existingOrders.value = [];
  }

  // get currently selected business
  function getBusiness() {
    return businessStore.selectedBusiness;
  }

  // initialize simulation state for selected business
  function initForBusiness(businessId: string | number) {
    activeBusinessId.value = businessId;
    // get the business's queue count, if not found default to 3
    const business = businessStore.businesses.find((b) => String(b._id) === String(businessId));
    const queueCount = business?.queueCount ?? 3;
    // initialize the queues, production and delivery states
    queues.value = [];
    for (let i = 1; i <= queueCount; i++) {
      queues.value.push({ id: `q${i}`, number: i, customers: [], isOpen: i <= queueCount });
    }

    creationQueue.value = [];
    productionSlots.value = [];
    deliveries.value = [];
  }

  /**
   * Initializes simulation from the currently selected business.
   * If simulation is already running for this business, does nothing.
   * Otherwise, creates fresh simulation state.
   */
  function initFromSelectedBusiness() {
    const selectedBusiness = businessStore.selectedBusiness;
    if (!selectedBusiness) return;
    // check if we are already simulating this business
    if (
      activeBusinessId.value &&
      String(activeBusinessId.value) === String(selectedBusiness._id) &&
      queues.value.length > 0
    ) {
      return;
    }

    // otherwise initialize fresh simulation for the selected business
    initForBusiness(selectedBusiness._id as string | number);
  }

  // tick logic: advance simulation by one second for all states
  async function tick() {
    // 1. Process customers in queues
    for (const queue of queues.value) {
      if (!queue.customers.length) continue;
      const first = queue.customers[0] as Customer;
      if (first.orderingTimeLeft > 0) {
        // decrement ordering time
        first.orderingTimeLeft = Math.max(0, first.orderingTimeLeft - 1);
        if (first.orderingTimeLeft === 0) {
          // attempt to fulfill order after ordering complete
          attemptFulfillOrder(queue, first);
          // remove customer from queue whether success or failure
          queue.customers.shift();
        }
      }
    }

    // 2. Process production slots
    for (const slot of productionSlots.value) {
      if (slot.materialTimeLeft > 0) {
        slot.materialTimeLeft = Math.max(0, slot.materialTimeLeft - 1);
        slot.totalTimeLeft = Math.max(0, slot.totalTimeLeft - 1);
      }

      // check if current material finished
      if (slot.materialTimeLeft === 0) {
        // mark material as done
        const product = productStore.products.find((product) => String(product._id) === String(slot.productId));
        if (product) {
          const materialId = product.materials[slot.materialIndex];
          if (materialId && !slot.materialsDone.includes(materialId)) {
            slot.materialsDone.push(materialId);
          }
        }

        // move to next material
        const prod = productStore.products.find((product) => String(product._id) === String(slot.productId));
        if (!prod) {
          // product was deleted during production, move to delivery as failed
          startDelivery(slot.orderId, slot.productId);
          slot.totalTimeLeft = 0;
          continue;
        }

        const nextIndex = slot.materialIndex + 1;
        if (nextIndex < prod.materials.length) {
          // start processing next material
          const nextMaterialId = prod.materials[nextIndex];
          const material = materialStore.materials.find((m) => String(m._id) === String(nextMaterialId));
          const nextTime = material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
          slot.materialIndex = nextIndex;
          slot.materialTimeLeft = nextTime;
        } else {
          // all materials done, send to delivery
          startDelivery(slot.orderId, slot.productId);
          slot.totalTimeLeft = 0;
        }
      }
    }

    // remove finished production slots
    productionSlots.value = productionSlots.value.filter((s) => s.totalTimeLeft > 0);

    // 3. Proceess deliveries
    for (const delivery of deliveries.value) {
      delivery.timeLeft = Math.max(0, delivery.timeLeft - 1);
    }
    // complete deliveries that have reached 0
    const completed = deliveries.value.filter((delivery) => delivery.timeLeft === 0);
    for (const c of completed) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: c.orderId,
        success: true,
        reason: "DELIVERY_COMPLETE",
        productIds: [c.productId],
        extra: {},
      });
    }
    deliveries.value = deliveries.value.filter((d) => d.timeLeft > 0);

    // 4. Move waiting creation queue into production slots
    fillProductionSlots();
  }

  /**
   * Attempts to fulfill a customer's order, cancel, or reorder.
   *
   * Process:
   * - For 'cancel': Stops production if still in progress, fails if already complete
   * - For 'reorder': Checks for overlapping materials and reuses progress if possible
   * - For 'order': Standard order fulfillment
   */
  async function attemptFulfillOrder(queue: Queue, customer: Customer) {
    // customer wants to cancel
    if (customer.actionType === "cancel") {
      await handleCancelOrder(customer);
      return;
    }

    // customer wawnts to reorder
    if (customer.actionType === "reorder") {
      await handleReorder(customer);
      return;
    }

    // regular order
    await processRegularOrder(customer);
  }

  async function handleCancelOrder(customer: Customer) {
    const orderId = customer.originalOrderId;
    if (!orderId) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "CANCEL_FAILED_NO_ORDER_ID",
        productIds: [],
      });
      return;
    }

    // check if order is in production slots
    const prodSlotIndex = productionSlots.value.findIndex((s) => s.orderId === orderId);
    if (prodSlotIndex !== -1) {
      // remove from production slots
      const remove = productionSlots.value.splice(prodSlotIndex, 1)[0];
      if (remove) {
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: true,
          reason: "CANCEL_SUCCESSFUL_IN_PRODUCTION",
          productIds: [remove.productId],
          extra: { orderId },
        });
        existingOrders.value.splice(
          existingOrders.value.findIndex((eo) => eo.order.orderId === orderId),
          1
        );
      }

      // fill production slots from creation queue
      fillProductionSlots();
      return;
    }

    // check if order is in creation queue
    const queueIndex = creationQueue.value.findIndex((s) => s.orderId === orderId);
    if (queueIndex !== -1) {
      // remove from creation queue
      const remove = creationQueue.value.splice(queueIndex, 1)[0];
      if (remove) {
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: true,
          reason: "CANCEL_SUCCESSFUL_IN_QUEUE",
          productIds: [remove.productId],
          extra: { orderId },
        });
        existingOrders.value.splice(
          existingOrders.value.findIndex((eo) => eo.order.orderId === orderId),
          1
        );
        return;
      }
    }

    // check if order is in deliveries (not cancellable)
    const deliveryIndex = deliveries.value.findIndex((d) => d.orderId === orderId);
    if (deliveryIndex !== -1 && deliveries.value[deliveryIndex]) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "CANCEL_FAILED_ALREADY_IN_DELIVERY",
        productIds: [deliveries.value[deliveryIndex].productId],
        extra: { orderId },
      });
      return;
    }

    // order not found or already completed
    await emitOrderResult({
      businessId: businessStore.selectedBusiness?._id,
      customerId: customer.id,
      success: false,
      reason: "CANCEL_FAILED_ORDER_NOT_FOUND",
      productIds: [],
      extra: { orderId },
    });
  }

  async function handleReorder(customer: Customer) {
    const originalOrderId = customer.originalOrderId;
    const newProductIds = customer.order ?? [];
    if (!originalOrderId || newProductIds.length === 0) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "REORDER_FAILED_NO_PRODUCTS",
        productIds: [],
      });
      return;
    }

    // find original order in production slots or queues
    let originalSlot: ProductionSlot | undefined;
    let isInProduction = false;

    const prodIndex = productionSlots.value.findIndex((s) => s.orderId === originalOrderId);
    if (prodIndex !== -1) {
      originalSlot = productionSlots.value[prodIndex];
      isInProduction = true;
    } else {
      const queueIndex = creationQueue.value.findIndex((s) => s.orderId === originalOrderId);
      if (queueIndex !== -1) {
        originalSlot = creationQueue.value[queueIndex];
      }
    }

    // if original order not found or in delivery, process as new order
    if (!originalSlot) {
      await processRegularOrder(customer);
      return;
    }

    // get the new product's materials
    const newProduct = productStore.products.find((product) => String(product._id) === String(newProductIds[0]));
    if (!newProduct) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "REORDER_FAILED_PRODUCT_NOT_FOUND",
        productIds: newProductIds,
      });
      return;
    }

    // check for overlapping materials and reuse progress if possible
    const originalProduct = productStore.products.find(
      (product) => String(product._id) === String(originalSlot.productId)
    );
    if (!originalProduct) {
      // original product deleted, process as new order
      await processRegularOrder(customer);
      return;
    }

    const overlappingMaterials = newProduct.materials.filter((materialId) =>
      originalSlot!.materialsDone.includes(materialId)
    );
    if (overlappingMaterials.length === 0) {
      // no overlap, process as new order
      if (isInProduction) {
        // remove original from production slots
        productionSlots.value.splice(prodIndex, 1);
      } else {
        // remove original from creation queue
        const queueIndex = creationQueue.value.findIndex((s) => s.orderId === originalOrderId);
        if (queueIndex !== -1) {
          creationQueue.value.splice(queueIndex, 1);
          existingOrders.value.splice(
            existingOrders.value.findIndex((eo) => eo.order.orderId === originalOrderId),
            1
          );
        }
      }

      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: true,
        reason: "REORDER_PROCESSED_AS_NEW_ORDER",
        productIds: newProductIds,
      });

      existingOrders.value.push({ order: { orderId: `order_${customer.id}_${Date.now()}`, customerId: customer.id } });

      // process as new order
      await processRegularOrder(customer);
      return;
    }

    // there is overlap, calculate remaining times based on reused materials
    const timeSaved = overlappingMaterials.reduce((total, materialId) => {
      const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
      return total + (material ? Math.max(1, Math.floor(material.timeRequired)) : 0);
    }, 0);

    // calculate total time for new product
    const totalNewTime = newProduct.materials.reduce((total, materialId) => {
      const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
      return total + (material ? Math.max(1, Math.floor(material.timeRequired)) : 0);
    }, 0);

    const adjustedTotalTime = Math.max(1, totalNewTime - timeSaved);

    // find first material to process that is not already done
    let startMaterialIndex = 0;
    for (let i = 0; i < newProduct.materials.length; i++) {
      const materialId = newProduct.materials[i];
      if (!materialId || !originalSlot.materialsDone.includes(materialId)) {
        startMaterialIndex = i;
        break;
      }
    }

    // update the original slot to the new product
    const updatedSlot: ProductionSlot = {
      id: originalSlot.id,
      orderId: originalSlot.orderId,
      productId: newProduct._id as string,
      materialIndex: startMaterialIndex,
      materialsDone: [...originalSlot.materialsDone],
      materialTimeLeft: (() => {
        const nextMaterialId = newProduct.materials[startMaterialIndex];
        const material = materialStore.materials.find((m) => String(m._id) === String(nextMaterialId));
        return material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
      })(),
      totalTimeLeft: adjustedTotalTime,
    };

    // replace in appropriate queue
    if (isInProduction) {
      productionSlots.value.splice(prodIndex, 1, updatedSlot);
    } else {
      const queueIndex = creationQueue.value.findIndex((s) => s.orderId === originalOrderId);
      if (queueIndex !== -1) {
        creationQueue.value.splice(queueIndex, 1, updatedSlot);
      }
    }
    await emitOrderResult({
      businessId: businessStore.selectedBusiness?._id,
      customerId: customer.id,
      success: true,
      reason: "REORDER_SUCCESS_WITH_OVERLAP",
      productIds: [newProduct._id as string],
      extra: { originalOrderId, timeSaved, adjustedTotalTime, overlappingMaterials: overlappingMaterials.length },
    });
  }

  async function processRegularOrder(customer: Customer) {
    const productIds = customer.order ?? [];
    if (!productIds.length) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "NO_PRODUCTS_IN_ORDER",
        productIds: [],
        extra: {},
      });
      return;
    }

    // check material availability
    const missingAny: { productId: string; missingMaterials: string[] }[] = [];
    const productsToProcess: any[] = [];

    for (const pid of productIds) {
      const product = productStore.products.find((product) => String(product._id) === String(pid));
      if (!product) {
        missingAny.push({ productId: pid, missingMaterials: ["PRODUCT_NOT_FOUND"] });
        continue;
      }

      const requiredMaterialIds = product.materials ?? [];
      const missing: string[] = [];

      for (const materialId of requiredMaterialIds) {
        const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
        if (!material || (material.stock ?? 0) <= 0) missing.push(materialId);
      }
      if (missing.length > 0) {
        missingAny.push({ productId: pid, missingMaterials: missing });
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: false,
          reason: "MATERIALS_MISSING_FOR_PRODUCT",
          productIds: [pid],
          extra: { missingMaterials: missing },
        });
        return;
      } else {
        productsToProcess.push(product);
      }
    }

    // deduct materials from stock
    for (const product of productsToProcess) {
      const requiredMaterialIds = product.materials ?? [];
      for (const materialId of requiredMaterialIds) {
        const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
        if (material) {
          const newStock = Math.max(0, (material.stock ?? 0) - 1);
          // update in store and backend
          materialStore.updateMaterial(material._id as string | number, { stock: newStock }).catch((e) => {
            console.warn("Failed to persist material stock change", e);
          });
          material.stock = newStock;
        }
      }
    }

    // create production slots
    const business = getBusiness();
    if (!business) {
      await emitOrderResult({
        businessId: undefined,
        customerId: customer.id,
        success: false,
        reason: "NO_BUSINESS_LOADED",
        productIds: productIds,
        extra: {},
      });
      return;
    }

    for (let i = 0; i < productsToProcess.length; i++) {
      const product = productsToProcess[i];
      const orderId = `order_${customer.id}_${Date.now()}_${i}`;

      // calculate production times
      const prodSlot: ProductionSlot = {
        id: `ps_${orderId}`,
        orderId,
        productId: product._id as string,
        materialIndex: 0,
        materialsDone: [],
        materialTimeLeft: (() => {
          const firstMaterialId = product.materials?.[0];
          const material = materialStore.materials.find((m) => String(m._id) === String(firstMaterialId));
          return material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
        })(),
        totalTimeLeft: product.materials
          .map((materialId: string) => {
            const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
            return material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
          })
          .reduce((a: number, b: number) => a + b, 0),
      };

      const usedSlots = productionSlots.value.length;

      // start or queue production
      if (usedSlots < (business.productionSlotsCount ?? 0)) {
        productionSlots.value.push(prodSlot);
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: prodSlot.orderId,
          success: true,
          reason: "PRODUCTION_ACCEPTED_AND_STARTED",
          productIds: [prodSlot.productId],
          extra: { orderId: prodSlot.orderId },
        });
        existingOrders.value.push({ order: { orderId: prodSlot.orderId, customerId: customer.id } });
      } else {
        creationQueue.value.push(prodSlot);
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: prodSlot.orderId,
          success: true,
          reason: "PRODUCTION_QUEUED",
          productIds: [prodSlot.productId],
          extra: { orderId: prodSlot.orderId },
        });
        existingOrders.value.push({ order: { orderId: prodSlot.orderId, customerId: customer.id } });
      }
    }
  }

  // backend logs
  async function emitOrderResult(payload: OrderEventPayload) {
    const data = {
      businessId: businessStore.selectedBusiness?._id,
      customerId: payload.customerId,
      success: payload.success,
      reason: payload.reason,
      productIds: payload.productIds,
      ...payload.extra,
    };
    try {
      await axios.post(`${API_BASE}/post-event`, data);
    } catch (error) {
      console.error("Error posting order event:", error);
    }
  }

  // start delivery for completed production
  async function startDelivery(orderId: string, productId: string) {
    const business = getBusiness();
    const deliveryTime = business?.deliveryTime ?? 5;
    deliveries.value.push({
      id: `d_${orderId}`,
      orderId,
      productId,
      timeLeft: Math.max(1, Math.floor(deliveryTime)),
    });

    // remove production slot with this orderId
    productionSlots.value = productionSlots.value.filter((product) => product.orderId !== orderId);

    await emitOrderResult({
      businessId: businessStore.selectedBusiness?._id,
      customerId: orderId,
      success: true,
      reason: "DELIVERY_STARTED",
      productIds: [productId],
      extra: {},
    });
    existingOrders.value.splice(
      existingOrders.value.findIndex((eo) => eo.order.orderId === orderId),
      1
    );
  }

  // move items from creationQueue to productionSlots if there is free capacity
  async function fillProductionSlots() {
    const business = getBusiness();
    if (!business) return;

    const freeSlots = Math.max(0, (business.productionSlotsCount ?? 0) - productionSlots.value.length);
    if (freeSlots <= 0) return;

    // move up to freeSlots from creationQueue to productionSlots
    for (let i = 0; i < freeSlots; i++) {
      const next = creationQueue.value.shift();
      if (!next) break;

      productionSlots.value.push(next);
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: next.orderId,
        success: true,
        reason: "PRODUCTION_STARTED_FROM_QUEUE",
        productIds: [next.productId],
        extra: {},
      });
    }
  }

  // start simulation timer
  function startTicking() {
    if (tickHandle.value != null) return;
    tickHandle.value = window.setInterval(() => tick(), 1000);
  }

  // stop simulation timer
  function stopTicking() {
    if (tickHandle.value != null) {
      clearInterval(tickHandle.value);
      tickHandle.value = null;
    }
  }

  // insert customer into specified queue respecting priority
  function insertIntoQueue(q: Queue, cust: Customer) {
    // we start at index 1 to never skip the person currently being served
    let insertIndex = Math.min(1, q.customers.length);

    // find the first position where existing customer's priority is less than new customer's priority
    while (insertIndex < q.customers.length) {
      const existing = q.customers[insertIndex];
      if (existing && existing.priority >= cust.priority) insertIndex++;
      else break;
    }

    // insert at the calculated index
    if (insertIndex >= q.customers.length) q.customers.push(cust);
    else q.customers.splice(insertIndex, 0, cust);
  }

  // adds a customer to a queue
  function enqueueCustomer(customer: Partial<Customer>) {
    const c: Customer = {
      id: customer.id ?? `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      priority: customer.priority ?? 0,
      order: customer.order ?? [],
      // customers ordering time between 2 and 6 seconds
      orderingTimeLeft: customer.orderingTimeLeft ?? Math.max(1, Math.floor(Math.random() * 5) + 2),
      arrivalTime: customer.arrivalTime ?? Date.now(),
      retries: customer.retries ?? 0,
      actionType: customer.actionType ?? "order",
      originalOrderId: customer.originalOrderId,
    };

    if (queues.value.length === 0) {
      console.warn("No queues available");
      return null;
    }

    // add to shortest open queue
    let openQueues = queues.value.filter((q) => q.isOpen);
    if (openQueues.length === 0) openQueues = queues.value;

    const shortest = openQueues.reduce((min, q) => (q.customers.length < min.customers.length ? q : min));
    insertIntoQueue(shortest, c);
    return c;
  }

  // rebalance all customers across open queues based on arrival time
  function rebalanceQueues() {
    // collect all customers from all queues
    const all: Customer[] = [];
    for (const q of queues.value) {
      for (const c of q.customers) all.push(c);
      q.customers = [];
    }

    // sort by arrivalTime (oldest first).
    all.sort((a, b) => (a.arrivalTime ?? 0) - (b.arrivalTime ?? 0));

    const openQueues = queues.value.filter((q) => q.isOpen);
    if (openQueues.length === 0) {
      console.warn("No open queues to rebalance into — dropping customers");
      return;
    }

    // distribute into open queues, but insert respecting priority rules
    let idx = 0;
    for (const cust of all) {
      const target = openQueues[idx % openQueues.length];
      if (target) insertIntoQueue(target, cust);
      idx++;
    }
  }

  // add regular customer ordering random product
  function addRegularCustomer() {
    const products = productStore.products;
    if (!products.length) return null;

    // choose 1..N random products
    const maxCount = products.length;
    const count = Math.floor(Math.random() * maxCount) + 1;
    const chosen: string[] = [];
    const copy = [...products];

    for (let i = 0; i < count && copy.length; i++) {
      const index = Math.floor(Math.random() * copy.length);
      const product = copy.splice(index, 1)[0];
      if (product && product._id) chosen.push(String(product._id));
    }

    return enqueueCustomer({ order: chosen, priority: 0 });
  }

  function addCancelCustomer(existingOrders: ExistingOrders[]) {
    if (!existingOrders.length) return null;
    const randomIndex = Math.floor(Math.random() * existingOrders.length);
    const originalOrderId = existingOrders[randomIndex]?.order.orderId;
    const customerId = existingOrders[randomIndex]?.order.customerId;
    return enqueueCustomer({
      id: customerId,
      order: [],
      priority: 1,
      actionType: "cancel",
      originalOrderId,
    });
  }

  function addReorderCustomer(existingOrders: ExistingOrders[]) {
    if (!existingOrders.length) {
      console.warn("No original order ID provided for reorder");
      return null;
    }
    const randomIndex = Math.floor(Math.random() * existingOrders.length);
    const originalOrderId = existingOrders[randomIndex]?.order.orderId;
    const customerId = existingOrders[randomIndex]?.order.customerId;

    const products = productStore.products;
    if (!products.length) return null;
    const count = Math.floor(Math.random() * products.length) + 1;
    const chosen: string[] = [];
    const copy = [...products];
    for (let i = 0; i < count && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      const product = copy.splice(idx, 1)[0];
      if (product && product._id) chosen.push(String(product._id));
    }
    return enqueueCustomer({
      id: customerId,
      order: chosen,
      priority: 1,
      actionType: "reorder",
      originalOrderId,
    });
  }

  function addVipCustomer() {
    const products = productStore.products;
    if (!products.length) return null;
    const count = Math.floor(Math.random() * products.length) + 1;
    const chosen: string[] = [];
    const copy = [...products];
    for (let i = 0; i < count && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      const product = copy.splice(idx, 1)[0];
      if (product && product._id) chosen.push(String(product._id));
    }
    return enqueueCustomer({ order: chosen, priority: 2 });
  }

  function toggleQueueOpen(queueId: String | number) {
    const q = queues.value.find((x) => x.id === queueId);
    if (!q) return;

    q.isOpen = !q.isOpen;

    // rebalance across open queues when a queue is opened or closed
    rebalanceQueues();
  }

  // add a new queue at runtime and rebalance customers
  function addQueue() {
    const nextNumber = queues.value.length + 1;
    const q: Queue = { id: `q${nextNumber}`, number: nextNumber, customers: [], isOpen: true };
    queues.value.push(q);
    // rebalance to include new queue
    rebalanceQueues();
    return q;
  }

  return {
    // state
    activeBusinessId,
    queues,
    creationQueue,
    productionSlots,
    deliveries,
    existingOrders,

    // actions
    initForBusiness,
    initFromSelectedBusiness,
    enqueueCustomer,
    addRegularCustomer,
    addCancelCustomer,
    addReorderCustomer,
    addVipCustomer,
    addQueue,
    startTicking,
    stopTicking,
    tick,
    toggleQueueOpen,
  };
});
