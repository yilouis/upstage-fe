import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-v3-html-to-public",
      apply: "serve",
      configResolved() {
        // Copy v3.html to public directory for dev server
        const v3Source = path.resolve("./v3.html");
        const publicDir = path.resolve("./public");

        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }

        if (fs.existsSync(v3Source)) {
          const content = fs.readFileSync(v3Source, "utf-8");
          fs.writeFileSync(path.resolve(publicDir, "v3.html"), content);
        }
      },
    },
    {
      name: "copy-v3-html-to-dist",
      apply: "build",
      generateBundle() {
        const v3Source = path.resolve("./v3.html");

        if (fs.existsSync(v3Source)) {
          const content = fs.readFileSync(v3Source, "utf-8");
          this.emitFile({
            type: "asset",
            fileName: "v3.html",
            source: content,
          });
        }
      },
    },
  ],
  server: {
    port: 5173,
  },
  publicDir: "public",
});
