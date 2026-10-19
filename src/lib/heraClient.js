/*
  Hera data layer — reads/writes the three seeded gist sources:
    - patients gist : PAT-xxxx.json   (one file per patient)
    - orders   gist : ORD-yyyymmdd-nnn.json (one file per order)
    - ops.json inside each pharmacy gist (staff, riders, sales, restock)

  Because every record is its own file, a PATCH touches only that file, so the
  patient app and the pharmacy app can write at the same time safely.
*/
import { github, hera } from "./config.js";

const API = "https://api.github.com/gists";

const headers = () => ({
  Authorization: `token ${github.pat}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
});

/** Every gist call is bounded so a stalled network can never freeze the UI. */
const TIMEOUT_MS = 8000;

async function fetchTimed(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") throw new Error("Network request timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function getGist(gistId) {
  const res = await fetchTimed(`${API}/${gistId}`, { headers: headers() });
  if (!res.ok) throw new Error(`GET gist ${gistId} failed: ${res.status}`);
  return res.json();
}

async function patchFile(gistId, filename, content) {
  const body = { files: { [filename]: { content: JSON.stringify(content, null, 2) } } };
  const res = await fetchTimed(`${API}/${gistId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PATCH gist ${gistId} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

const parse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("parse failed", e);
    return null;
  }
};

/* ---------- PATIENTS ---------- */
export async function listPatients() {
  const gist = await getGist(hera.patientsGist);
  return Object.entries(gist.files || {})
    .filter(([name]) => name.startsWith("PAT-") && name.endsWith(".json"))
    .map(([, f]) => parse(f.content))
    .filter(Boolean);
}

export async function getPatient(id) {
  const gist = await getGist(hera.patientsGist);
  const file = gist.files?.[`${id}.json`];
  return file ? parse(file.content) : null;
}

/* ---------- ORDERS ---------- */
export async function listOrders() {
  const gist = await getGist(hera.ordersGist);
  return Object.entries(gist.files || {})
    .filter(([name]) => name.startsWith("ORD-") && name.endsWith(".json"))
    .map(([, f]) => parse(f.content))
    .filter(Boolean)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function getOrder(id) {
  const gist = await getGist(hera.ordersGist);
  const file = gist.files?.[`${id}.json`];
  return file ? parse(file.content) : null;
}

export async function createOrder(order) {
  const filename = `${order.id}.json`;
  await patchFile(hera.ordersGist, filename, order);
  return order;
}

/** Merge a patch into a single order file — other order files are untouched. */
export async function updateOrder(id, patch) {
  const current = await getOrder(id);
  if (!current) throw new Error(`Order ${id} not found`);
  const next = { ...current, ...patch, updated_at: new Date().toISOString() };
  await patchFile(hera.ordersGist, `${id}.json`, next);
  return next;
}

/* ---------- PHARMACY OPS ---------- */
export async function getOps(pharmacyId) {
  const gistId = github.gists[pharmacyId];
  if (!gistId) throw new Error(`Unknown pharmacy id: ${pharmacyId}`);
  const gist = await getGist(gistId);
  const file = gist.files?.["ops.json"];
  return file ? parse(file.content) : null;
}
