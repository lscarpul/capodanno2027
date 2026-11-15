import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativo: funziona sia su <utente>.github.io/capodanno2027/ sia su un dominio custom
export default defineConfig({ plugins: [react()], base: "./" });
