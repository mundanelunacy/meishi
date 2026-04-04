import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["meishi-mark.svg"],
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
            purpose: "any"
          }
        ]
      }
    })
  ]
});
