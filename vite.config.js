import { defineConfig } from "vite";

// Loopback only. Session notes and the rig stay on this machine.
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5183,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5183,
    strictPort: true,
  },
});
