import { defineStore } from "pinia";
import { ref } from "vue";
import { useBusinessStore } from "./BusinessStore";
import { useProductStore } from "./ProductStore";
import { useMaterialStore } from "./MaterialStore";
import axios from "axios";
import { useToastStore } from "./ToastStore";

const API_BASE = "http://localhost:3000";

export interface Customer {
  id: string;
  priority: 0 | 1 | 2;
  order: string[]; // product IDs
  orderingTimeLeft: number; // seconds left to finish ordering
  arrivalTime?: number;
  retries?: number;
  money?: number; // customer's available money (10-50)
  actionType?: "order" | "reorder" | "cancel";
  originalOrderIds?: string | string[]; // original order ID for reorder/cancel
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
  name: string;
  cost: number;
  materialIndex: number; // which material is currently being processed
  materialTimeLeft: number; // seconds left for current material
  materialsDone: string[]; // material ids done
  totalTimeLeft: number; // total seconds left for entire product
  priority: 0 | 1; // 1 = priority production (e.g. reproduction)
}

export interface DeliveryItem {
  id: string;
  orderId: string;
  productName: string;
  cost: number;
  productId: string;
  timeLeft: number; // time left until delivery is complete
}

interface OrderEventPayload {
  businessId: String | number | undefined;
  customerId: string;
  success: boolean;
  reason: string;
  productName: string;
  cost: number;
  productIds: string[];
  extra?: any;
  warning?: boolean;
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
  const priorityOneOrders = ref<string[]>([]);

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
          startDelivery(slot.orderId, slot.productId, "", 0);
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
          startDelivery(slot.orderId, slot.productId, prod.name, prod.price);
          slot.totalTimeLeft = 0;
        }
      }
    }

    // remove finished production slots
    productionSlots.value = productionSlots.value.filter((s) => s.totalTimeLeft > 0);

    // 3. Process deliveries
    for (const delivery of deliveries.value) {
      delivery.timeLeft = Math.max(0, delivery.timeLeft - 1);
    }

    // Determine failed deliveries (5% chance while in transit)
    const failed: DeliveryItem[] = [];
    const completed: DeliveryItem[] = [];

    for (const d of deliveries.value) {
      if (d.timeLeft > 0) {
        const failChance = Math.random();
        if (failChance < 0.05) {
          failed.push(d);
        }
      } else if (d.timeLeft === 0) {
        completed.push(d);
      }
    }

    // Handle failures: emit fail event, remove from deliveries and queue reproduction
    for (const f of failed) {
      // mark as failed
      f.timeLeft = 0;
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: f.orderId,
        success: false,
        reason: "DELIVERY_FAILED_REPRODUCING_ORDER",
        productName: f.productName,
        cost: f.cost,
        productIds: [f.productId],
        extra: {},
      });
      // remove failed delivery from active deliveries
      deliveries.value = deliveries.value.filter((dd) => dd !== f);
      // reproduce the order (create priority=1 production slot queued at front)
      await reproduceFailedOrders(f.orderId, f.productId);
    }

    // Handle completed deliveries
    for (const c of completed) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: c.orderId,
        success: true,
        reason: "DELIVERY_COMPLETE",
        productName: c.productName,
        productIds: [c.productId],
        cost: c.cost,
        extra: {},
      });
    }

    // Remove any deliveries that reached 0 (either completed or failed)
    deliveries.value = deliveries.value.filter((d) => d.timeLeft > 0);

    // 4. Move waiting creation queue into production slots
    fillProductionSlots();
  }

  async function reproduceFailedOrders(orderId: string, productId: string) {
    const prod = productStore.products.find((p) => String(p._id) === String(productId));
    const parts = orderId.split("_");
    const customerId = `c_${Date.now()}_${parts[3]}`;
    if (!prod) return;

    // create a new order id for the reproduced product
    const reproOrderId = `order_${customerId}`;

    // calculate times similarly to normal production slots
    const totalTime = (prod.materials ?? [])
      .map((materialId: string) => {
        const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
        return material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
      })
      .reduce((a: number, b: number) => a + b, 0);

    const firstMaterialId = prod.materials?.[0];
    const firstMaterial = materialStore.materials.find((m) => String(m._id) === String(firstMaterialId));
    const firstTime = firstMaterial ? Math.max(1, Math.floor(firstMaterial.timeRequired)) : 1;

    const newSlot: ProductionSlot = {
      id: `ps_${reproOrderId}`,
      orderId: reproOrderId,
      productId: prod._id as string,
      name: prod.name,
      cost: prod.price,
      materialIndex: 0,
      materialsDone: [],
      materialTimeLeft: firstTime,
      totalTimeLeft: Math.max(1, totalTime),
      priority: 1,
    };

    // Insert at the front of creationQueue so it is next to be produced,
    creationQueue.value.unshift(newSlot);

    // Mark this order as a priority-one reproduction so other logic can recognize it
    priorityOneOrders.value.push(newSlot.orderId);

    await emitOrderResult({
      businessId: businessStore.selectedBusiness?._id,
      customerId: newSlot.orderId,
      success: true,
      reason: "REPRODUCTION_QUEUED",
      productName: newSlot.name,
      productIds: [newSlot.productId],
      cost: newSlot.cost,
      extra: { originalOrderId: orderId },
    });
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
    const orderIds = Array.isArray(customer.originalOrderIds)
      ? customer.originalOrderIds
      : customer.originalOrderIds
      ? [customer.originalOrderIds]
      : [];

    if (orderIds.length === 0) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "CANCEL_FAILED_NO_ORDER_ID",
        cost: 0,
        productIds: [],
        productName: "",
      });
      return;
    }

    // Cancel ALL orders for this customer
    for (const orderId of orderIds) {
      // check if order is in production slots
      const prodSlotIndex = productionSlots.value.findIndex((s) => s.orderId === orderId);
      if (prodSlotIndex !== -1) {
        const remove = productionSlots.value.splice(prodSlotIndex, 1)[0];
        if (remove) {
          await emitOrderResult({
            businessId: businessStore.selectedBusiness?._id,
            customerId: customer.id,
            success: true,
            reason: "CANCEL_SUCCESSFUL_IN_PRODUCTION",
            productName: remove.name,
            productIds: [remove.productId],
            cost: remove.cost,
            extra: { orderId, showMessage: true },
            warning: false,
          });
        }
        continue;
      }

      // check if order is in creation queue
      const queueIndex = creationQueue.value.findIndex((s) => s.orderId === orderId);
      if (queueIndex !== -1) {
        const remove = creationQueue.value.splice(queueIndex, 1)[0];
        if (remove) {
          await emitOrderResult({
            businessId: businessStore.selectedBusiness?._id,
            customerId: customer.id,
            success: true,
            reason: "CANCEL_SUCCESSFUL_IN_QUEUE",
            productName: remove.name,
            productIds: [remove.productId],
            cost: remove.cost,
            extra: { orderId, showMessage: true },
            warning: false,
          });
        }
        continue;
      }

      // check if order is in deliveries (not cancellable)
      const deliveryIndex = deliveries.value.findIndex((d) => d.orderId === orderId);
      if (deliveryIndex !== -1 && deliveries.value[deliveryIndex]) {
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: false,
          reason: "CANCEL_FAILED_ALREADY_IN_DELIVERY",
          productName: deliveries.value[deliveryIndex].productName,
          productIds: [deliveries.value[deliveryIndex].productId],
          cost: deliveries.value[deliveryIndex].cost,
          extra: { orderId },
        });
        continue;
      }

      // order not found or already completed
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "CANCEL_FAILED_ORDER_NOT_FOUND",
        productName: "",
        productIds: [],
        cost: 0,
        extra: { orderId },
      });
    }

    // fill production slots from creation queue after all cancellations
    fillProductionSlots();
  }

  async function handleReorder(customer: Customer) {
    const orderIds = Array.isArray(customer.originalOrderIds)
      ? customer.originalOrderIds
      : customer.originalOrderIds
      ? [customer.originalOrderIds]
      : [];

    const newProductIds = customer.order ?? [];

    if (orderIds.length === 0 || newProductIds.length === 0) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "REORDER_FAILED_NO_PRODUCTS",
        productName: "",
        productIds: [],
        cost: 0,
      });
      return;
    }

    // Reorder ALL orders for this customer
    for (const originalOrderId of orderIds) {
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
        // For this order, just skip it or log
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: false,
          reason: "REORDER_FAILED_ORDER_NOT_FOUND",
          productName: "",
          productIds: [],
          cost: 0,
          extra: { originalOrderId },
        });
        continue;
      }

      // get the new product's materials (use first product from the new order)
      const newProduct = productStore.products.find((product) => String(product._id) === String(newProductIds[0]));
      if (!newProduct) {
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: false,
          reason: "REORDER_FAILED_PRODUCT_NOT_FOUND",
          productName: "",
          productIds: newProductIds,
          cost: 0,
          extra: { originalOrderId },
        });
        continue;
      }

      // check for overlapping materials and reuse progress if possible
      const originalProduct = productStore.products.find(
        (product) => String(product._id) === String(originalSlot.productId)
      );
      if (!originalProduct) {
        // original product deleted, remove and process as new order for this one
        if (isInProduction) {
          productionSlots.value.splice(prodIndex, 1);
        } else {
          const queueIndex = creationQueue.value.findIndex((s) => s.orderId === originalOrderId);
          if (queueIndex !== -1) {
            creationQueue.value.splice(queueIndex, 1);
          }
        }
        continue;
      }

      const overlappingMaterials = newProduct.materials.filter((materialId) =>
        originalSlot!.materialsDone.includes(materialId)
      );

      if (overlappingMaterials.length === 0) {
        // no overlap, remove original and it will be recreated
        if (isInProduction) {
          productionSlots.value.splice(prodIndex, 1);
        } else {
          const queueIndex = creationQueue.value.findIndex((s) => s.orderId === originalOrderId);
          if (queueIndex !== -1) {
            creationQueue.value.splice(queueIndex, 1);
          }
        }

        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: true,
          reason: "REORDER_PROCESSED_AS_NEW_ORDER",
          productName: newProduct.name,
          productIds: newProductIds,
          cost: newProduct.price,
          extra: { originalOrderId, showMessage: true },
          warning: false,
        });
        continue;
      }

      // there is overlap, calculate remaining times based on reused materials
      const timeSaved = overlappingMaterials.reduce((total, materialId) => {
        const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
        return total + (material ? Math.max(1, Math.floor(material.timeRequired)) : 0);
      }, 0);

      const totalNewTime = newProduct.materials.reduce((total, materialId) => {
        const material = materialStore.materials.find((m) => String(m._id) === String(materialId));
        return total + (material ? Math.max(1, Math.floor(material.timeRequired)) : 0);
      }, 0);

      const adjustedTotalTime = Math.max(1, totalNewTime - timeSaved);

      let startMaterialIndex = 0;
      for (let i = 0; i < newProduct.materials.length; i++) {
        const materialId = newProduct.materials[i];
        if (!materialId || !originalSlot.materialsDone.includes(materialId)) {
          startMaterialIndex = i;
          break;
        }
      }

      const updatedSlot: ProductionSlot = {
        id: originalSlot.id,
        orderId: originalSlot.orderId,
        productId: newProduct._id as string,
        name: newProduct.name,
        cost: newProduct.price,
        materialIndex: startMaterialIndex,
        materialsDone: [...originalSlot.materialsDone],
        materialTimeLeft: (() => {
          const nextMaterialId = newProduct.materials[startMaterialIndex];
          const material = materialStore.materials.find((m) => String(m._id) === String(nextMaterialId));
          return material ? Math.max(1, Math.floor(material.timeRequired)) : 1;
        })(),
        totalTimeLeft: adjustedTotalTime,
        priority: 1,
      };

      if (isInProduction) {
        productionSlots.value.splice(prodIndex, 1, updatedSlot);
      } else {
        const queueIndex = creationQueue.value.findIndex((s) => s.orderId === originalOrderId);
        if (queueIndex !== -1) {
          // replace in queue and move to front
          creationQueue.value.splice(queueIndex, 1, updatedSlot);
          creationQueue.value.unshift(updatedSlot);
        }
      }

      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: true,
        reason: "REORDER_SUCCESS_WITH_OVERLAP",
        productName: newProduct.name,
        productIds: [newProduct._id as string],
        cost: newProduct.price,
        extra: {
          originalOrderId,
          timeSaved,
          adjustedTotalTime,
          overlappingMaterials: overlappingMaterials.length,
          showMessage: true,
        },
        warning: false,
      });
    }

    // After all reorders, process any new orders if needed
    await processRegularOrder(customer);
  }

  async function processRegularOrder(customer: Customer) {
    const productIds = customer.order ?? [];
    if (!productIds.length) {
      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "NO_PRODUCTS_IN_ORDER",
        productName: "",
        cost: 0,
        productIds: [],
        extra: {},
      });
      return;
    }
    // check material availability first and collect product objects
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
          productName: product.name,
          productIds: [pid],
          cost: 0,
          extra: { missingMaterials: missing },
        });
        return;
      } else {
        productsToProcess.push(product);
      }
    }

    // calculate total order cost
    const totalCost = productsToProcess.reduce((sum: number, p: any) => sum + (p.price ?? 0), 0);

    // ensure customer has money
    const customerMoney = customer.money ?? 10;

    // first check if customer has sufficient funds
    if (customerMoney < totalCost) {
      // payment failed due to insufficient funds
      const newRetries = (customer.retries ?? 0) + 1;
      customer.retries = newRetries;

      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "PAYMENT_FAILED_INSUFFICIENT_FUNDS",
        productName: productsToProcess.map((p) => p.name).join(", "),
        productIds: productIds,
        cost: 0,
        extra: { customerMoney, retries: newRetries },
        warning: true,
      });

      // if retries remain, re-enqueue the customer to try again (up to 3 attempts)
      if (newRetries < 3) {
        enqueueCustomer({ ...customer, orderingTimeLeft: Math.max(1, Math.floor(Math.random() * 3) + 1) });
      } else {
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: false,
          reason: "ORDER_FAILED_MAX_RETRIES_INSUFFICIENT_FUNDS",
          productName: productsToProcess.map((p) => p.name).join(", "),
          productIds: productIds,
          cost: 0,
          extra: { customerMoney, retries: newRetries },
        });
      }

      return;
    }

    // random business failure of 5%
    const businessFail = Math.random() < 0.05;
    if (businessFail) {
      const newRetries = (customer.retries ?? 0) + 1;
      customer.retries = newRetries;

      await emitOrderResult({
        businessId: businessStore.selectedBusiness?._id,
        customerId: customer.id,
        success: false,
        reason: "PAYMENT_FAILED_BUSINESS_ERROR",
        productName: productsToProcess.map((p) => p.name).join(", "),
        productIds: productIds,
        cost: 0,
        extra: { retries: newRetries },
        warning: true,
      });

      if (newRetries < 3) {
        enqueueCustomer({ ...customer, orderingTimeLeft: Math.max(1, Math.floor(Math.random() * 3) + 1) });
      } else {
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: customer.id,
          success: false,
          reason: "ORDER_FAILED_MAX_RETRIES_BUSINESS_ERROR",
          productName: productsToProcess.map((p) => p.name).join(", "),
          productIds: productIds,
          cost: 0,
          extra: { retries: newRetries },
        });
      }

      return;
    }

    // Payment succeeded
    customer.money = (customer.money ?? 10) - totalCost;
    businessStore.updateBusiness(businessStore.selectedBusiness?._id as string | number, {
      revenue: (businessStore.selectedBusiness?.revenue ?? 0) + totalCost,
    });

    await emitOrderResult({
      businessId: businessStore.selectedBusiness?._id,
      customerId: customer.id,
      success: true,
      reason: "PAYMENT_SUCCESS",
      productName: productsToProcess.map((p) => p.name).join(", "),
      productIds: productIds,
      cost: totalCost,
      extra: { remainingMoney: customer.money },
    });

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
        productName: "",
        productIds: productIds,
        cost: 0,
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
        name: product.name,
        cost: product.price,
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
        priority: 0,
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
          productName: prodSlot.name,
          cost: prodSlot.cost,
          productIds: [prodSlot.productId],
          extra: { orderId: prodSlot.orderId },
        });
      } else {
        creationQueue.value.push(prodSlot);
        await emitOrderResult({
          businessId: businessStore.selectedBusiness?._id,
          customerId: prodSlot.orderId,
          success: true,
          reason: "PRODUCTION_QUEUED",
          productName: prodSlot.name,
          cost: prodSlot.cost,
          productIds: [prodSlot.productId],
          extra: { orderId: prodSlot.orderId },
        });
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
      productName: payload.productName,
      cost: payload.cost,
      productIds: payload.productIds,
      ...payload.extra,
    };
    try {
      await axios.post(`${API_BASE}/post-event`, data);
    } catch (error) {
      console.error("Error posting order event:", error);
    }
    // show a toast notification
    try {
      if (payload.success === false || payload.extra?.showMessage) {
        let type = "";
        if (payload.warning) type = "warning";
        else if (!payload.warning) type = "success";
        else type = "error";
        const toastStore = useToastStore();
        const msg = `${payload.reason} ${payload.warning ? `(${payload.extra.retries ?? 0} tries)` : ""}`;
        toastStore.addToast({ type: type as any, message: msg });
      }
    } catch (e) {
      // non-fatal
    }
  }

  // start delivery for completed production
  async function startDelivery(orderId: string, productId: string, productName: string, cost: number) {
    const business = getBusiness();
    const deliveryTime = business?.deliveryTime ?? 5;
    deliveries.value.push({
      id: `d_${orderId}`,
      orderId,
      productName,
      productId,
      cost,
      timeLeft: Math.max(1, Math.floor(deliveryTime)),
    });

    // remove production slot with this orderId
    productionSlots.value = productionSlots.value.filter((product) => product.orderId !== orderId);

    await emitOrderResult({
      businessId: businessStore.selectedBusiness?._id,
      customerId: orderId,
      success: true,
      reason: "DELIVERY_STARTED",
      productName,
      cost,
      productIds: [productId],
      extra: {},
    });
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
        productName: next.name,
        cost: next.cost,
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
    let customerExsitingId: string | undefined = "";
    if (customer.actionType === "cancel" || customer.actionType === "reorder") {
      const parts = customer.originalOrderIds?.[0]?.split("_") ?? [];
      customerExsitingId = parts[3];
    }
    const c: Customer = {
      id:
        customer.actionType === "cancel" || customer.actionType === "reorder"
          ? customer.id ?? `c_${Date.now()}_${customerExsitingId}`
          : customer.id ?? `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      priority: customer.priority ?? 0,
      order: customer.order ?? [],
      // customers ordering time between 2 and 6 seconds
      orderingTimeLeft: customer.orderingTimeLeft ?? Math.max(1, Math.floor(Math.random() * 5) + 2),
      arrivalTime: customer.arrivalTime ?? Date.now(),
      retries: customer.retries ?? 0,
      // assign random money between 10 and 50
      money: customer.money ?? Math.floor(Math.random() * 41) + 10,
      actionType: customer.actionType ?? "order",
      originalOrderIds: customer.originalOrderIds,
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

  function addCancelCustomer() {
    const originalOrderIds = getRandomOriginalOrderId();
    priorityOneOrders.value.push(...(originalOrderIds ?? []));
    if (!originalOrderIds || originalOrderIds.length === 0) {
      console.warn("No original order ID provided for cancel");
      return null;
    }
    return enqueueCustomer({
      order: [],
      priority: 1,
      actionType: "cancel",
      originalOrderIds,
    });
  }

  function addReorderCustomer() {
    const originalOrderIds = getRandomOriginalOrderId();
    priorityOneOrders.value.push(...(originalOrderIds ?? []));
    if (!originalOrderIds || originalOrderIds.length === 0) {
      console.warn("No original order ID provided for reorder");
      return null;
    }
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
      order: chosen,
      priority: 1,
      actionType: "reorder",
      originalOrderIds,
    });
  }

  function getRandomOriginalOrderId(): string[] | null | undefined {
    // gather all existing order IDs from production slots
    const existingOrderIds: string[] = [];
    for (const slot of productionSlots.value) {
      existingOrderIds.push(slot.orderId);
    }

    if (existingOrderIds.length === 0) return null;

    const filteredOrderIds = existingOrderIds.filter((id) => !priorityOneOrders.value.includes(id));

    if (filteredOrderIds.length === 0) return null;

    // Group orders by customer ID (the number after the second underscore)
    const ordersByCustomer = new Map<string, string[]>();

    for (const orderId of filteredOrderIds) {
      const parts = orderId.split("_");
      const customerId = parts[3];

      if (customerId) {
        if (!ordersByCustomer.has(customerId)) {
          ordersByCustomer.set(customerId, []);
        }
        ordersByCustomer.get(customerId)!.push(orderId);
      }
    }

    // Get all unique customer IDs
    const customerIds = Array.from(ordersByCustomer.keys());

    if (customerIds.length === 0) return null;

    // Pick a random customer
    const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];

    if (!randomCustomerId) return null;

    // Return all orders for that customer
    return ordersByCustomer.get(randomCustomerId);
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

    // actions
    initForBusiness,
    initFromSelectedBusiness,
    enqueueCustomer,
    addRegularCustomer,
    addCancelCustomer,
    addReorderCustomer,
    getRandomOriginalOrderId,
    addVipCustomer,
    addQueue,
    startTicking,
    stopTicking,
    tick,
    toggleQueueOpen,
  };
});
