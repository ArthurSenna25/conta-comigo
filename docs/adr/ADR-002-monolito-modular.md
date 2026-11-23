# ADR-002 · Monólito modular em camadas
Data: 23/11/2026 · Status: aceita

**Contexto:** 4 pessoas trabalhando em paralelo por 8 dias, um deploy só, e um núcleo fiscal que precisa ser testável isolado.
**Alternativas:** 1) Next.js sem regra de pastas 2) monólito modular com camadas e donos 3) front + API separados / microsserviços.
**Decisão:** monólito modular: `app` → `actions` → {`lib/db`, `lib/ai`, `lib/engine`} → `lib/contracts`. Engine e contracts puros. Imposto por ESLint + `tests/camadas.test.ts`.
**Consequências:** um repositório e um deploy; contratos e mocks permitem trabalho paralelo; interface só onde há 2 implementações (`AiProvider`).
**Gatilho para revisitar:** outro cliente (app nativo, bot de WhatsApp) consumindo a mesma API.
