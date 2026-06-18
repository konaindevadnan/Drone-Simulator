// import { fileURLToPath, URL } from "url";

// import { defineConfig } from "vite";
// import vue from "@vitejs/plugin-vue";

// // https://vitejs.dev/config/
// export default defineConfig({
//   server: {
//     open: true,
//      host: true,
//   },
//   plugins: [vue()],
//   resolve: {
//     alias: {
//       "@": fileURLToPath(new URL("./src", import.meta.url)),
//     },
//   },
// });

import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import os from "os";

// Function to find your computer's actual local network IP address
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Find IPv4 addresses that are not loopback/internal
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost"; // Fallback if no network found
};

const networkIP = getLocalIP();
const port = 5173;

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // Broadcasts the app across your local network
    port: port,
    // Forces the browser to open to the specific network IP instead of localhost!
    open: `http://${networkIP}:${port}`, 
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});