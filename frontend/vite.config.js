import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Thêm cấu hình này
    watch: {
      usePolling: true,
    },
  },
  build: {
    target: "esnext", // 👈 thêm dòng này để hỗ trợ top-level await
  },
});
