import { github } from "./config.js";

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

export const binIds = {
  medplus: "medplus",
  "alpha-pharmacy": "alpha-pharmacy",
};

async function getGistFile(gistId) {
  const res = await fetchTimed(`${API}/${gistId}`, { headers: headers() });
  if (!res.ok) throw new Error(`GET gist ${gistId} failed: ${res.status}`);
  const data = await res.json();
  const file = data.files?.[github.filename];
  if (!file) throw new Error(`File "${github.filename}" not found in gist ${gistId}`);
  return file.content;
}

async function patchGistFile(gistId, content) {
  const body = {
    files: {
      [github.filename]: { content: JSON.stringify(content, null, 2) },
    },
  };
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

export async function getBin(pharmacyId) {
  const gistId = github.gists[pharmacyId];
  if (!gistId) throw new Error(`Unknown pharmacy id: ${pharmacyId}`);
  const raw = await getGistFile(gistId);
  return JSON.parse(raw);
}

export async function putBin(pharmacyId, pharmacyObject) {
  const gistId = github.gists[pharmacyId];
  if (!gistId) throw new Error(`Unknown pharmacy id: ${pharmacyId}`);
  return await patchGistFile(gistId, pharmacyObject);
}

export async function decrementStock(pharmacyId, medicineId, amount = 1) {
  const bin = await getBin(pharmacyId);
  const medicines = bin?.medicines || [];
  const med = medicines.find((m) => m.id === medicineId);
  if (!med) throw new Error(`Medicine id ${medicineId} not found in ${pharmacyId}`);

  med.stock = Math.max(0, (med.stock || 0) - amount);
  med.available_units = Math.max(0, (med.available_units || 0) - amount);

  return await putBin(pharmacyId, bin);
}
