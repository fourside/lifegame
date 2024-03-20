import react from "@vitejs/plugin-react-swc";
import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      plugins: [react()],
      css: {
        transformer: "lightningcss",
        lightningcss: {
          targets: browserslistToTargets(browserslist(["> 1%", "not dead"])),
        },
      },
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
