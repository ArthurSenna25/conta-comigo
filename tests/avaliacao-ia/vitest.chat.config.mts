import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../../", import.meta.url)) } },
  envDir: false,
  test: { include: ["tests/avaliacao-ia/chat.vivo.ts"], environment: "node", testTimeout: 500_000 },
});
