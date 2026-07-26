import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/uploads': {
        target: 'http://localhost:3026',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
              return "vendor-react";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("leaflet") || id.includes("react-leaflet")) {
               return "vendor-map";
            }
            if (id.includes("embla-carousel")) {
              return "vendor-carousel";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("socket.io-client")) {
              return "vendor-socket";
            }
            return "vendor-react";
          }
        }
      }
    }
  }
}));
