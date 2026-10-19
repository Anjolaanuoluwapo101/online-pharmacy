import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // read .env / .env.<mode> — VITE_ prefixed vars only
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react()],
    envPrefix: "VITE_",

    // Expose .env values to the client as process.env.VITE_* so the app can
    // use the familiar `process.env.X` syntax instead of import.meta.env.
    define: {
      "process.env.VITE_GROQ_API_KEY": JSON.stringify(env.VITE_GROQ_API_KEY || ""),
      "process.env.VITE_GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      "process.env.VITE_GITHUB_PAT": JSON.stringify(env.VITE_GITHUB_PAT || ""),
      "process.env.VITE_GIST_MEDPLUS": JSON.stringify(env.VITE_GIST_MEDPLUS || ""),
      "process.env.VITE_GIST_ALPHA": JSON.stringify(env.VITE_GIST_ALPHA || ""),
      "process.env.VITE_GIST_PATIENTS": JSON.stringify(env.VITE_GIST_PATIENTS || ""),
      "process.env.VITE_GIST_ORDERS": JSON.stringify(env.VITE_GIST_ORDERS || ""),
    },

    server: {
      host: true, // reachable from a phone on the same wifi (handy for the demo)
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
