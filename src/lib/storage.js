/*
  localStorage helpers:
  - cart: array of { pharmacyId, medicineId, quantity, unitPrice, logisticsFee, medicationName }
  - reminders: array of { id, medication_name, dosage, frequency, times_per_day, start_date, end_date, status }
*/
const STORAGE_KEYS = {
  cart: "hera_cart",
  reminders: "hera_reminders",
};

// ---- CART ----
export function getCart() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.cart);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn("cart read error", e);
    return [];
  }
}

export function setCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  } catch (e) {
    console.warn("cart write error", e);
  }
}

const CART_CHANGE_EVENT = "hera:cart-change";

function dispatchCartChange() {
  try {
    window.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT));
  } catch (_) {}
}

export function onCartChange(cb) {
  const handler = () => cb();
  window.addEventListener(CART_CHANGE_EVENT, handler);
  return () => window.removeEventListener(CART_CHANGE_EVENT, handler);
}

/**
 * Add a line item.
 * A cart line belongs to ONE pharmacy + ONE medicine: MedPlus and Alpha are
 * separate suppliers with separate logistics, so the same drug at two
 * pharmacies stays two lines. Re-adding the same medicine from the SAME
 * pharmacy merges quantities instead of duplicating the row.
 */
export function addToCart(item) {
  const cart = getCart();
  const exists = cart.find(
    (c) => c.pharmacyId === item.pharmacyId && c.medicineId === item.medicineId
  );
  if (exists) {
    exists.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  setCart(cart);
  dispatchCartChange();
}

/** Group the cart by pharmacy (one group per supplier). */
export function groupCart(items = getCart()) {
  const grouped = {};
  items.forEach((item) => {
    if (!grouped[item.pharmacyId]) {
      grouped[item.pharmacyId] = {
        id: item.pharmacyId,
        items: [],
        subtotal: 0,
        logisticsFee: item.logisticsFee || 0,
      };
    }
    grouped[item.pharmacyId].items.push(item);
    grouped[item.pharmacyId].subtotal += item.quantity * item.unitPrice;
  });
  return grouped;
}

/** Order total = every group's subtotal + one logistics fee per pharmacy. */
export function cartTotal(items = getCart()) {
  return Object.values(groupCart(items)).reduce(
    (sum, g) => sum + g.subtotal + (g.logisticsFee || 0),
    0
  );
}

/** How many units of a medicine are already in the cart for a pharmacy. */
export function cartQuantity(pharmacyId, medicineId, items = getCart()) {
  const line = items.find(
    (c) => c.pharmacyId === pharmacyId && c.medicineId === medicineId
  );
  return line ? line.quantity : 0;
}

/** Distinct medicine lines in the cart. */
export function cartCount(items = getCart()) {
  return items.length;
}

export function clearCart() {
  setCart([]);
  dispatchCartChange();
}

export function removeFromCart(pharmacyId, medicineId) {
  const cart = getCart().filter(
    (c) => !(c.pharmacyId === pharmacyId && c.medicineId === medicineId)
  );
  setCart(cart);
  dispatchCartChange();
}

export function setItemQty(pharmacyId, medicineId, qty) {
  const cart = getCart();
  const item = cart.find((c) => c.pharmacyId === pharmacyId && c.medicineId === medicineId);
  if (item && qty > 0) {
    // never allow more than the pharmacy actually has in stock
    const cap = item.availableUnits ? item.availableUnits : Infinity;
    item.quantity = Math.min(qty, cap);
  } else if (item && qty <= 0) {
    cart.splice(cart.indexOf(item), 1);
  }
  setCart(cart);
  dispatchCartChange();
}

// ---- REMINDERS ----
const reminderKey = (r) =>
  `rx-${String(r?.medication_name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

function mergeTaken(a, b) {
  if (!a && !b) return undefined;
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([day, times]) => {
    out[day] = [...new Set([...(out[day] || []), ...(times || [])])];
  });
  return out;
}

/** One record per medicine — the course window is merged, dose logs are unioned. */
function dedupeReminders(list) {
  const byKey = new Map();
  (list || []).forEach((r) => {
    const key = reminderKey(r);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...r, id: key });
      return;
    }
    const merged = { ...prev, ...r, taken: mergeTaken(prev.taken, r.taken) };
    if (prev.end_date && r.end_date) {
      merged.end_date = prev.end_date > r.end_date ? prev.end_date : r.end_date;
    }
    byKey.set(key, merged);
  });
  return [...byKey.values()];
}

export function getReminders() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.reminders);
    const list = data ? JSON.parse(data) : [];
    return Array.isArray(list) ? dedupeReminders(list) : [];
  } catch (e) {
    console.warn("reminders read error", e);
    return [];
  }
}

/** Persist the dedupe so stale duplicate records leave storage for good. */
export function pruneReminders() {
  const raw = localStorage.getItem(STORAGE_KEYS.reminders);
  if (!raw) return 0;
  try {
    const list = JSON.parse(raw) || [];
    const clean = dedupeReminders(list);
    if (clean.length !== list.length) {
      setReminders(clean);
      return list.length - clean.length;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

export function setReminders(reminders) {
  try {
    localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(reminders));
  } catch (e) {
    console.warn("reminders write error", e);
  }
}

/**
 * Add (or refresh) a reminder for a medicine.
 * Re-ordering the same medicine updates the existing course instead of
 * creating a duplicate, and keeps the dose history.
 */
export function addReminder(reminder) {
  const reminders = getReminders();
  const key = reminderKey(reminder);
  const existing = reminders.find((r) => reminderKey(r) === key);
  if (existing) {
    existing.start_date = reminder.start_date ?? existing.start_date;
    existing.end_date = reminder.end_date ?? existing.end_date;
    existing.dosage = reminder.dosage ?? existing.dosage;
    existing.frequency = reminder.frequency ?? existing.frequency;
    existing.times_per_day = reminder.times_per_day ?? existing.times_per_day;
    existing.status = reminder.status || "active";
    delete existing.snoozedUntil;
    existing.taken = mergeTaken(existing.taken, reminder.taken);
  } else {
    reminders.push({ ...reminder, id: key });
  }
  setReminders(reminders);
}

export function removeReminder(id) {
  const reminders = getReminders().filter((r) => r.id !== id);
  setReminders(reminders);
}

export function updateReminderStatus(id, status) {
  const reminders = getReminders();
  const r = reminders.find((r) => r.id === id);
  if (r) r.status = status;
  setReminders(reminders);
}

/** Log a single dose as taken (per medicine, per time, per day). */
export function markDoseTaken(id, key, time) {
  const reminders = getReminders();
  const r = reminders.find((x) => x.id === id);
  if (!r) return;
  if (!r.taken) r.taken = {};
  if (!r.taken[key]) r.taken[key] = [];
  if (!r.taken[key].includes(time)) r.taken[key].push(time);
  setReminders(reminders);
}

export function undoDose(id, key, time) {
  const reminders = getReminders();
  const r = reminders.find((x) => x.id === id);
  if (!r || !r.taken || !r.taken[key]) return;
  r.taken[key] = r.taken[key].filter((t) => t !== time);
  if (!r.taken[key].length) delete r.taken[key];
  setReminders(reminders);
}

/** Push the next dose of a medicine to a later time. */
export function snoozeReminder(id, untilISO) {
  const reminders = getReminders();
  const r = reminders.find((x) => x.id === id);
  if (!r) return;
  r.snoozedUntil = untilISO;
  setReminders(reminders);
}

export function clearSnooze(id) {
  const reminders = getReminders();
  const r = reminders.find((x) => x.id === id);
  if (!r) return;
  delete r.snoozedUntil;
  setReminders(reminders);
}
