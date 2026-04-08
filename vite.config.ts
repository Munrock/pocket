import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/pocket/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.png"],
      manifest: {
        name: "That time I needed to use a YouTube Video as a backing track for practice",
        short_name: "Tuback",
        description: "Streamlined YouTube playback controls for musicians",
        theme_color: "#0d0f14",
        background_color: "#0d0f14",
        display: "standalone",
        orientation: "portrait",
        start_url: "/pocket/front",
        icons: [
          {
            src: "icon.png",
            sizes: "192x192 512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.youtube\.com\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
