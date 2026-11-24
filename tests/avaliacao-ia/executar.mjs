import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

if (process.env.AVALIAR_GEMINI !== "sim") {
  throw new Error("Defina AVALIAR_GEMINI=sim para a avaliação real.");
}
// O carregador do Next roda antes do Vitest, pois NODE_ENV=test ignora .env.local.
const resolver = createRequire(import.meta.url);
const requireNext = createRequire(resolver.resolve("next/package.json"));
requireNext("@next/env").loadEnvConfig(process.cwd(), true);
const vitest = join(dirname(resolver.resolve("vitest/package.json")), "vitest.mjs");
const filho = spawnSync(process.execPath, [vitest, "run", "--config", "tests/avaliacao-ia/vitest.config.mts"], {
  stdio: "inherit",
});
if (filho.error) throw new Error("Não foi possível iniciar o Vitest");
process.exitCode = filho.status ?? 1;
