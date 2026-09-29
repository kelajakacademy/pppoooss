import { Order, Product, Table, Waiter, OfflineOrder } from "../types";

const OFFLINE_ORDERS_KEY = "barpos_offline_orders_queue";
const OFFLINE_TABLES_KEY = "barpos_offline_tables_cache";
const OFFLINE_PRODUCTS_KEY = "barpos_offline_products_cache";
const OFFLINE_WAITERS_KEY = "barpos_offline_waiters_cache";
const OFFLINE_LAST_SYNC_KEY = "barpos_last_sync_timestamp";

type SyncListener = (status: {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncedJustNow?: number;
}) => void;

const listeners: Set<SyncListener> = new Set();
let isSyncingInProgress = false;

// Notify all subscribed UI components
function notifyListeners(syncedJustNow?: number) {
  const pending = getOfflineOrdersQueue();
  const lastSyncTime = localStorage.getItem(OFFLINE_LAST_SYNC_KEY);
  const status = {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingCount: pending.length,
    isSyncing: isSyncingInProgress,
    lastSyncTime,
    syncedJustNow
  };
  listeners.forEach(fn => {
    try {
      fn(status);
    } catch (e) {
      console.error("Error in sync listener:", e);
    }
  });
}

// 1. Queue Management
export function getOfflineOrdersQueue(): OfflineOrder[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read offline orders queue:", e);
    return [];
  }
}

export function saveOfflineOrder(order: Order, action: 'create' | 'finalize' | 'kitchen_update' = 'finalize'): OfflineOrder {
  const queue = getOfflineOrdersQueue();
  
  const offlineOrder: OfflineOrder = {
    ...order,
    offlineSavedAt: new Date().toISOString(),
    offlineAction: action
  };

  // If already in queue, update it; otherwise append
  const existingIdx = queue.findIndex(o => o.id === order.id);
  if (existingIdx >= 0) {
    queue[existingIdx] = offlineOrder;
  } else {
    queue.push(offlineOrder);
  }

  localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(queue));
  
  // Also reflect changes in cached tables
  updateOfflineTableStatus(order.tableNumber, action === 'finalize' ? 'available' : 'occupied', order.waiterId, order.waiterName, order.id);

  notifyListeners();
  return offlineOrder;
}

export function removeOfflineOrders(orderIds: string[]) {
  const queue = getOfflineOrdersQueue();
  const remaining = queue.filter(o => !orderIds.includes(o.id));
  localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(remaining));
  notifyListeners();
}

// 2. Cache Helpers for offline data persistence
export function cacheLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(OFFLINE_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {}
}

export function getCachedLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(OFFLINE_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function cacheLocalTables(tables: Table[]) {
  try {
    localStorage.setItem(OFFLINE_TABLES_KEY, JSON.stringify(tables));
  } catch (e) {}
}

export function getCachedLocalTables(): Table[] {
  try {
    const raw = localStorage.getItem(OFFLINE_TABLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function updateOfflineTableStatus(
  tableNumber: string, 
  status: 'available' | 'occupied', 
  waiterId?: string, 
  waiterName?: string, 
  orderId?: string
) {
  try {
    const tables = getCachedLocalTables();
    const updated = tables.map(tbl => {
      if (String(tbl.number) === String(tableNumber) || String(tbl.id) === String(tableNumber)) {
        return {
          ...tbl,
          status,
          activeOrderId: status === 'occupied' ? orderId : undefined,
          activeWaiterId: status === 'occupied' ? waiterId : undefined,
          activeWaiterName: status === 'occupied' ? waiterName : undefined,
        };
      }
      return tbl;
    });
    cacheLocalTables(updated);
  } catch (e) {}
}

export function cacheLocalWaiters(waiters: Waiter[]) {
  try {
    localStorage.setItem(OFFLINE_WAITERS_KEY, JSON.stringify(waiters));
  } catch (e) {}
}

export function getCachedLocalWaiters(): Waiter[] {
  try {
    const raw = localStorage.getItem(OFFLINE_WAITERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// 3. Batch Synchronization to Backend
export async function syncOfflineOrdersToServer(cafeId: string = "default"): Promise<{
  success: boolean;
  syncedCount: number;
  error?: string;
}> {
  if (isSyncingInProgress) {
    return { success: false, syncedCount: 0, error: "Sync already in progress" };
  }

  const queue = getOfflineOrdersQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { success: false, syncedCount: 0, error: "No internet connection" };
  }

  isSyncingInProgress = true;
  notifyListeners();

  try {
    const res = await fetch("/api/sync/offline-batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cafe-id": cafeId
      },
      body: JSON.stringify({
        orders: queue,
        sentAt: new Date().toISOString()
      })
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success) {
      const syncedIds = Array.isArray(data.syncedIds) ? data.syncedIds : queue.map(q => q.id);
      removeOfflineOrders(syncedIds);
      
      const now = new Date().toLocaleTimeString();
      localStorage.setItem(OFFLINE_LAST_SYNC_KEY, now);
      
      isSyncingInProgress = false;
      notifyListeners(syncedIds.length);
      return { success: true, syncedCount: syncedIds.length };
    } else {
      throw new Error(data.message || "Failed to process offline batch");
    }
  } catch (err: any) {
    console.error("Offline sync error:", err);
    isSyncingInProgress = false;
    notifyListeners();
    return { success: false, syncedCount: 0, error: err.message || "Sync failed" };
  }
}

// 4. Auto-sync network event listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("🌐 Internet connection restored. Initiating auto-sync...");
    notifyListeners();
    // Delay slightly to let network stabilize
    setTimeout(() => {
      syncOfflineOrdersToServer();
    }, 1500);
  });

  window.addEventListener("offline", () => {
    console.log("📴 Switched to offline mode. All actions will be saved locally.");
    notifyListeners();
  });

  // Periodic heartbeat sync every 45 seconds when online and queue has items
  setInterval(() => {
    if (navigator.onLine && getOfflineOrdersQueue().length > 0 && !isSyncingInProgress) {
      syncOfflineOrdersToServer();
    }
  }, 45000);
}

// 5. Subscription Hook Helper
export function subscribeToSync(listener: SyncListener): () => void {
  listeners.add(listener);
  // Send initial state
  listener({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingCount: getOfflineOrdersQueue().length,
    isSyncing: isSyncingInProgress,
    lastSyncTime: localStorage.getItem(OFFLINE_LAST_SYNC_KEY)
  });

  return () => {
    listeners.delete(listener);
  };
}
