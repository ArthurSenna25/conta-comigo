// Regra de camadas (ver CLAUDE.md). Imports internos devem usar o alias @/*.
// Usado por eslint.config.mjs: `...layers`.
const FRAMEWORK = ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*"];
const SUPABASE = ["@supabase/*", "@/lib/supabase", "@/lib/supabase/*"];
const AI_SDK = ["ai", "@ai-sdk/*", "openai", "@anthropic-ai/*", "@google/*", "@google-cloud/*"];
const NODE_IO = ["fs", "fs/*", "node:fs", "node:fs/*"];
const lib = (name) => [`@/lib/${name}`, `@/lib/${name}/*`];
const restricted = (group, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
});

const layers = [
  // lib/engine e lib/contracts são PUROS: sem framework, supabase, SDK de IA, fs
  // nem outras camadas (engine pode importar contracts).
  {
    files: ["lib/engine/**/*.{ts,tsx}", "lib/contracts/**/*.{ts,tsx}"],
    rules: restricted(
      [
        ...FRAMEWORK,
        ...SUPABASE,
        ...AI_SDK,
        ...NODE_IO,
        ...lib("ai"),
        ...lib("db"),
        ...lib("security"),
      ],
      "lib/engine e lib/contracts são puros: sem next, react, supabase, SDK de IA, fs nem outras camadas.",
    ),
  },
  // lib/ai e lib/db dependem só de lib/contracts.
  {
    files: ["lib/ai/**/*.{ts,tsx}"],
    rules: restricted(
      [...lib("engine"), ...lib("db"), ...lib("security"), ...lib("supabase")],
      "lib/ai depende só de lib/contracts.",
    ),
  },
  {
    files: ["lib/db/**/*.{ts,tsx}"],
    rules: restricted(
      [...lib("engine"), ...lib("ai"), ...lib("security"), ...lib("supabase")],
      "lib/db depende só de lib/contracts.",
    ),
  },
  // app e components não acessam db nem ai direto: passam por actions/ ou app/api.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    ignores: ["app/api/**"],
    rules: restricted(
      [...lib("db"), ...lib("ai")],
      "app e components não acessam lib/db nem lib/ai direto: use actions/.",
    ),
  },
];

export default layers;
