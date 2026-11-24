import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  // tests/rls usa rede e segredos: roda só com `pnpm test:rls`
  test: { environment: "node", exclude: [...configDefaults.exclude, "tests/rls/**"] },
});
