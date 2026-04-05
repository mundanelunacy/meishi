import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load mode-specific .env files from the repo root for both dev and production.
  loadEnv(mode, process.cwd(), "");

  return {
    envPrefix: "VITE_",
    plugins: [
      TanStackRouterVite({
        autoCodeSplitting: true,
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["meishi-mark.svg"],
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          globPatterns: ["**/*.{css,html,ico,js,png,svg,webmanifest}"],
          runtimeCaching: [],
        },
        manifest: {
          name: "Meishi",
          short_name: "Meishi",
          description:
            "Capture business cards, verify extracted data, and sync contacts to Google Contacts.",
          theme_color: "#f6f1e7",
          background_color: "#f6f1e7",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/meishi-mark.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
      }),
    ],
    server: {
      allowedHosts: [".ngrok-free.app"],
    },
  };
});
