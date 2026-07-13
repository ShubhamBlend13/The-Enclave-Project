import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // New app versions replace the old service worker automatically.
      registerType: "autoUpdate",

      manifest: {
        name: "The Enclave",
        short_name: "Enclave",
        description:
          "Private villa and upkeep management portal.",

        theme_color: "#173D34",
        background_color: "#F4F1E8",

        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",

        icons: [
          {
            src: "/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      // Cache the application shell and static assets.
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg}",
        ],
      },
    }),
  ],
});