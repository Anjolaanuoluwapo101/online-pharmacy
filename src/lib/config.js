/*
  Runtime configuration.

  Secrets live in `.env` (see `.env.example`) and are injected at build time
  by Vite's `define` in vite.config.js, so they never touch the repo.
  Only VITE_-prefixed variables are exposed to the client.
*/

const env = {
  VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY,
  VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
  VITE_GITHUB_PAT: process.env.VITE_GITHUB_PAT,
  VITE_GIST_MEDPLUS: process.env.VITE_GIST_MEDPLUS,
  VITE_GIST_ALPHA: process.env.VITE_GIST_ALPHA,
  VITE_GIST_PATIENTS: process.env.VITE_GIST_PATIENTS,
  VITE_GIST_ORDERS: process.env.VITE_GIST_ORDERS,
};

function requireEnv(key, label) {
  const value = env[key];
  if (!value) {
    console.error(
      `[prescilly] Missing ${label} — add ${key} to your .env file (copy .env.example) and restart the dev server.`
    );
  }
  return value || "";
}

export const groq = {
  apiKey: requireEnv("VITE_GROQ_API_KEY", "Groq API key"),
  model: "openai/gpt-oss-120b",
};

export const gemini = {
  apiKey: requireEnv("VITE_GEMINI_API_KEY", "Gemini API key"),
  model: "gemini-3.8-flash",
};

export const github = {
  pat: requireEnv("VITE_GITHUB_PAT", "GitHub personal access token"),
  gists: {
    medplus: requireEnv("VITE_GIST_MEDPLUS", "MedPlus gist id"),
    "alpha-pharmacy": requireEnv("VITE_GIST_ALPHA", "Alpha-Pharmacy gist id"),
  },
  filename: "inventory.json",
};

export const hera = {
  patientsGist: requireEnv("VITE_GIST_PATIENTS", "Patients gist id"),
  ordersGist: requireEnv("VITE_GIST_ORDERS", "Orders gist id"),
};

export const app = {
  name: "prescilly",
  version: "1.0.0",
};
