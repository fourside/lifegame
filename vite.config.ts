import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      plugins: [react()],
    };
  }
  return {
    build: {
      ssr: true,
      emptyOutDir: false,
      rollupOptions: {
        input: "./src/worker.ts",
        output: {
          entryFileNames: "_worker.js",
        },
      },
    },
  };
});
