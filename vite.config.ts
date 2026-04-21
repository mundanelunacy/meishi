import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { APP_CHROME_THEME_COLORS } from "./src/app/chromeColors";

const DEFAULT_SITE_ORIGIN = "https://meishi-492400.web.app";
const PRIVACY_REGION_TOKEN = "__MEISHI_PRIVACY_REGION__";
const SITEMAP_PATHS = [
  "/landing",
  "/capture",
  "/review",
  "/settings",
  "/docs",
  "/privacy",
  "/terms",
] as const;
const GDPR_COUNTRIES = [
  "at",
  "be",
  "bg",
  "hr",
  "ch",
  "cy",
  "cz",
  "dk",
  "ee",
  "fi",
  "fr",
  "de",
  "gr",
  "hu",
  "ie",
  "it",
  "lv",
  "lt",
  "lu",
  "mt",
  "nl",
  "pl",
  "pt",
  "ro",
  "sk",
  "si",
  "es",
  "se",
  "is",
  "li",
  "no",
  "gb",
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

function createPrivacyIndexPlugin(): Plugin {
  return {
    name: "meishi-privacy-index",
    apply: "build",
    async writeBundle(options) {
      const outDir = resolve(options.dir ?? "dist");
      const indexPath = resolve(outDir, "index.html");
      const sourceHtml = await readFile(indexPath, "utf8");

      if (!sourceHtml.includes(PRIVACY_REGION_TOKEN)) {
        throw new Error(
          `Privacy bootstrap token ${PRIVACY_REGION_TOKEN} was not found in index.html.`,
        );
      }

      const nonGdprHtml = sourceHtml.replaceAll(
        PRIVACY_REGION_TOKEN,
        "non-gdpr",
      );
      const gdprHtml = sourceHtml.replaceAll(PRIVACY_REGION_TOKEN, "gdpr");

      await writeFile(indexPath, nonGdprHtml);

      for (const countryCode of GDPR_COUNTRIES) {
        const localizedDir = resolve(
          outDir,
          "localized-files",
          `ALL_${countryCode}`,
        );
        await mkdir(localizedDir, { recursive: true });
        await writeFile(resolve(localizedDir, "index.html"), gdprHtml);
      }
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
      createPrivacyIndexPlugin(),
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["meishi-mark.svg"],
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          globPatterns: ["**/*.{css,html,ico,js,png,svg,webmanifest}"],
          navigateFallbackDenylist: [/\/[^/?]+\.[^/]+$/],
          runtimeCaching: [],
        },
        manifest: {
          name: "Meishi",
          short_name: "Meishi",
          description:
            "Capture business cards, verify extracted data, and sync contacts to Google Contacts.",
          theme_color: APP_CHROME_THEME_COLORS.light,
          background_color: APP_CHROME_THEME_COLORS.light,
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
      proxy: {
        "/ingest": {
          target: env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ingest/, ""),
        },
      },
    },
  };
});
