import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, loadEnv, type Plugin } from "vite";

const DEFAULT_SITE_ORIGIN = "https://meishi-492400.web.app";
const SITEMAP_PATHS = [
  "/landing",
  "/capture",
  "/review",
  "/settings",
  "/docs",
  "/privacy",
  "/terms",
] as const;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function resolveSiteOrigin(env: Record<string, string | undefined>): string {
  const rawOrigin =
    env.SITE_ORIGIN ?? env.VITE_SITE_ORIGIN ?? DEFAULT_SITE_ORIGIN;

  try {
    return new URL(rawOrigin).origin;
  } catch {
    throw new Error(
      `Invalid site origin for sitemap generation: ${rawOrigin}. Set SITE_ORIGIN to an absolute URL such as https://meishi-492400.web.app.`,
    );
  }
}

function createSiteMetadataPlugin(siteOrigin: string): Plugin {
  return {
    name: "meishi-site-metadata",
    apply: "build",
    generateBundle() {
      const urls = SITEMAP_PATHS.map(
        (path) =>
          `  <url><loc>${escapeXml(`${siteOrigin}${path}`)}</loc></url>`,
      ).join("\n");

      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          `${urls}\n` +
          "</urlset>\n",
      });

      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load mode-specific .env files from the repo root for both dev and production.
  const env = loadEnv(mode, process.cwd(), "");
  const siteOrigin = resolveSiteOrigin(env);

  return {
    envPrefix: "VITE_",
    plugins: [
      TanStackRouterVite({
        autoCodeSplitting: true,
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      createSiteMetadataPlugin(siteOrigin),
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
          theme_color: "#FAFAF9",
          background_color: "#FAFAF9",
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
