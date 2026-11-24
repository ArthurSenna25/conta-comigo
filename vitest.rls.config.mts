import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Teste de RLS: usa rede e segredos, por isso fica fora de `pnpm test` / `pnpm check`.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/rls/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
