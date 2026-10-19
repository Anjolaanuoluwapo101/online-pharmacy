/*
  Turns a completed checkout into a real order record in the orders gist, so the
  patient can watch a live rider on the map and the pharmacy can see the order.
*/
import { createOrder, getPatient, listOrders } from "./heraClient";
import { buildRoute } from "./deliverySim";
import { getBin } from "./gistClient";

const pad = (n) => String(n).padStart(2, "0");

export async function placeOrder({ cart, method, reference, patientId = "PAT-0001" }) {
  if (!cart || cart.length === 0) return null;

  // never create a zero-naira order
  const subtotalRaw = cart.reduce((a, i) => a + (i.quantity || 0) * (i.unitPrice || 0), 0);
  if (subtotalRaw <= 0) {
    console.warn("Refusing to place a ₦0 order");
    return null;
  }

  // group the cart the same way the cart screen does
  const groups = {};
  cart.forEach((item) => {
    if (!groups[item.pharmacyId]) {
      groups[item.pharmacyId] = { id: item.pharmacyId, items: [], logisticsFee: item.logisticsFee || 0 };
    }
    groups[item.pharmacyId].items.push(item);
  });

  const pharmacies = [];
  for (const [pid, g] of Object.entries(groups)) {
    const bin = await getBin(pid).catch(() => null);
    pharmacies.push({
      id: pid,
      name: bin?.name || (pid === "medplus" ? "MedPlus Pharmacy" : "Alpha-Pharmacy"),
      logistics_fee: g.logisticsFee,
      lat: bin?.location?.lat,
      lng: bin?.location?.lng,
      address: bin?.location?.address,
      items: g.items.map((i) => ({
        medicine_id: i.medicineId,
        medication_name: i.medicationName,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      })),
    });
  }

  const items = Object.values(groups).flatMap((g) =>
    g.items.map((i) => ({
      medicine_id: i.medicineId,
      medication_name: i.medicationName,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }))
  );

  const subtotal = items.reduce((a, i) => a + i.quantity * i.unit_price, 0);
  const logistics = pharmacies.reduce((a, p) => a + (p.logistics_fee || 0), 0);
  const total = subtotal + logistics;

  const patient = await getPatient(patientId).catch(() => null);
  const delivery = {
    address: patient?.location?.address || "14 Herbert Macaulay Way, Yaba",
    city: patient?.location?.city || "Lagos",
    lat: patient?.location?.lat ?? 6.5095,
    lng: patient?.location?.lng ?? 3.3711,
  };

  const primary = pharmacies[0];
  const from = [primary?.lat ?? 6.5244, primary?.lng ?? 3.3792];
  const route = buildRoute(from, [delivery.lat, delivery.lng]);

  const now = Date.now();
  const stamp = (offsetMin) => new Date(now + offsetMin * 60000).toISOString();
  const d = new Date(now);
  const dateKey = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

  const existing = await listOrders().catch(() => []);
  const seq = String(
    existing.filter((o) => o.id?.includes(dateKey)).length + 1
  ).padStart(3, "0");
  const id = `ORD-${dateKey}-${seq}`;

  const order = {
    id,
    patient_id: patientId,
    pharmacy_id: primary?.id || "medplus",
    pharmacies,
    status: "out_for_delivery",
    items,
    subtotal,
    logistics_fee: logistics,
    total,
    payment: { method, status: "paid", reference: reference || `DEMO-${id}` },
    pharmacy_location: {
      address: primary?.address || "12 Admiralty Way, Ikeja, Lagos",
      lat: primary?.lat ?? 6.5244,
      lng: primary?.lng ?? 3.3792,
    },
    delivery,
    route,
    rider: { name: "Sadiq Musa", vehicle: "Motorbike" },
    timeline: [
      { status: "placed", at: stamp(-12), note: "Order received" },
      { status: "confirmed", at: stamp(-8), note: "Pharmacy confirmed the order" },
      { status: "preparing", at: stamp(-4), note: "Pharmacist is preparing your medication" },
      { status: "out_for_delivery", at: stamp(-1), note: "Rider picked up your order" },
    ],
    eta: stamp(12),
    created_at: stamp(-12),
    updated_at: stamp(0),
  };

  await createOrder(order);
  return order;
}

/**
 * placeOrderBounded — the whole order write is capped so a slow network can
 * never hold the payment screen open. The write continues in the background.
 */
export function placeOrderBounded(args, ms = 5000) {
  const timeout = new Promise((r) => setTimeout(() => r(null), ms));
  return Promise.race([placeOrder(args), timeout]);
}
