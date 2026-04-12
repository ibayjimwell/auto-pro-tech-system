// ─── In-memory Inventory Store ───────────────────────────────────────────────
// Tracks parts/supplies, stock levels, deductions, and low-stock alerts.

const uid = () => Math.random().toString(36).slice(2, 10);
const delay = (ms = 60) => new Promise(r => setTimeout(r, ms));

// Low-stock alert subscribers
const alertSubscribers = [];

let items = [
  { id: 'inv-1', name: 'Engine Oil (1L)', sku: 'OIL-1L', category: 'Fluids', unit: 'bottle', stockQty: 24, minThreshold: 6, costPrice: 180, sellPrice: 250 },
  { id: 'inv-2', name: 'Oil Filter (Universal)', sku: 'FLT-OIL-U', category: 'Filters', unit: 'piece', stockQty: 15, minThreshold: 5, costPrice: 120, sellPrice: 180 },
  { id: 'inv-3', name: 'Air Filter', sku: 'FLT-AIR', category: 'Filters', unit: 'piece', stockQty: 10, minThreshold: 4, costPrice: 200, sellPrice: 320 },
  { id: 'inv-4', name: 'Brake Pad Set (Front)', sku: 'BRK-PAD-F', category: 'Brakes', unit: 'set', stockQty: 8, minThreshold: 3, costPrice: 650, sellPrice: 950 },
  { id: 'inv-5', name: 'Brake Pad Set (Rear)', sku: 'BRK-PAD-R', category: 'Brakes', unit: 'set', stockQty: 6, minThreshold: 3, costPrice: 580, sellPrice: 850 },
  { id: 'inv-6', name: 'Spark Plug (NGK)', sku: 'SPK-NGK', category: 'Ignition', unit: 'piece', stockQty: 32, minThreshold: 8, costPrice: 95, sellPrice: 150 },
  { id: 'inv-7', name: 'Transmission Fluid (1L)', sku: 'FLD-ATF', category: 'Fluids', unit: 'bottle', stockQty: 12, minThreshold: 4, costPrice: 220, sellPrice: 320 },
  { id: 'inv-8', name: 'Coolant (1L)', sku: 'FLD-COOL', category: 'Fluids', unit: 'bottle', stockQty: 3, minThreshold: 5, costPrice: 160, sellPrice: 240 }, // low stock demo
  { id: 'inv-9', name: 'Wiper Blade (21")', sku: 'WPR-21', category: 'Accessories', unit: 'piece', stockQty: 7, minThreshold: 4, costPrice: 120, sellPrice: 200 },
  { id: 'inv-10', name: 'Battery 12V 45Ah', sku: 'BAT-45AH', category: 'Electrical', unit: 'piece', stockQty: 4, minThreshold: 2, costPrice: 2800, sellPrice: 3500 },
  { id: 'inv-11', name: 'Fuel Filter', sku: 'FLT-FUEL', category: 'Filters', unit: 'piece', stockQty: 2, minThreshold: 4, costPrice: 180, sellPrice: 280 }, // low stock demo
  { id: 'inv-12', name: 'Power Steering Fluid (500ml)', sku: 'FLD-PSF', category: 'Fluids', unit: 'bottle', stockQty: 9, minThreshold: 3, costPrice: 130, sellPrice: 200 },
];

// Usage log: { id, inventoryItemId, itemName, qty, appointmentId, taskTitle, usedAt }
let usageLog = [];

function checkAndNotify(item) {
  if (item.stockQty <= item.minThreshold) {
    const alert = {
      id: uid(),
      inventoryItemId: item.id,
      itemName: item.name,
      stockQty: item.stockQty,
      minThreshold: item.minThreshold,
      level: item.stockQty === 0 ? 'OUT_OF_STOCK' : 'LOW',
      triggeredAt: new Date().toISOString(),
    };
    alertSubscribers.forEach(fn => fn(alert));
    return alert;
  }
  return null;
}

export const inventoryStore = {
  list: async () => {
    await delay();
    return [...items];
  },

  get: async (id) => {
    await delay();
    return items.find(i => i.id === id) || null;
  },

  create: async (data) => {
    await delay();
    const item = { id: uid(), ...data, stockQty: data.stockQty ?? 0, minThreshold: data.minThreshold ?? 5 };
    items = [...items, item];
    return item;
  },

  update: async (id, data) => {
    await delay();
    items = items.map(i => i.id === id ? { ...i, ...data } : i);
    const updated = items.find(i => i.id === id);
    checkAndNotify(updated);
    return updated;
  },

  delete: async (id) => {
    await delay();
    items = items.filter(i => i.id !== id);
  },

  // Deduct stock when a mechanic uses a part
  deductStock: async (inventoryItemId, qty, context = {}) => {
    await delay();
    const item = items.find(i => i.id === inventoryItemId);
    if (!item) throw new Error('Item not found');
    if (item.stockQty < qty) throw new Error(`Insufficient stock. Only ${item.stockQty} ${item.unit}(s) available.`);

    items = items.map(i => i.id === inventoryItemId ? { ...i, stockQty: i.stockQty - qty } : i);
    const updated = items.find(i => i.id === inventoryItemId);

    // Log usage
    const logEntry = {
      id: uid(),
      inventoryItemId,
      itemName: item.name,
      qty,
      appointmentId: context.appointmentId || null,
      taskTitle: context.taskTitle || null,
      usedAt: new Date().toISOString(),
    };
    usageLog = [logEntry, ...usageLog];

    // Trigger low-stock alert if needed
    const alert = checkAndNotify(updated);
    return { item: updated, alert };
  },

  // Restock (add qty)
  restock: async (id, qty) => {
    await delay();
    items = items.map(i => i.id === id ? { ...i, stockQty: i.stockQty + qty } : i);
    return items.find(i => i.id === id);
  },

  getUsageLog: async (appointmentId = null) => {
    await delay();
    if (appointmentId) return usageLog.filter(l => l.appointmentId === appointmentId);
    return [...usageLog];
  },

  getLowStockItems: async () => {
    await delay();
    return items.filter(i => i.stockQty <= i.minThreshold);
  },

  // Subscribe to low-stock alerts (returns unsubscribe fn)
  onLowStockAlert: (fn) => {
    alertSubscribers.push(fn);
    return () => {
      const idx = alertSubscribers.indexOf(fn);
      if (idx > -1) alertSubscribers.splice(idx, 1);
    };
  },

  getCategories: async () => {
    await delay();
    return [...new Set(items.map(i => i.category))].sort();
  },
};