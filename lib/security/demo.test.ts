import { describe, expect, it } from "vitest";
import {
  bloqueioDaContaDemo,
  credenciaisDemo,
  decidirSeed,
  ehContaDemo,
  limitesChamadasIa,
  MENSAGEM_IA_DEMO_SO_TEXTO,
  MENSAGEM_IA_DEMO_TEXTO_LONGO,
  recusaEntradaIaDemo,
  TEXTO_IA_DEMO_MAX,
  TETO_IA_DEMO_PADRAO_CENTAVOS,
  tetoDiarioIaCentavos,
} from "./demo";

describe("limitesChamadasIa: chamadas por dia, falha fechada", () => {
  const env = { AI_DAILY_CALLS_GLOBAL: "200" };

  it("padrões: 30 por usuário, 15 na demo, global vem do ambiente", () => {
    expect(limitesChamadasIa(false, env)).toEqual({ maxUsuario: 30, maxGlobal: 200 });
    expect(limitesChamadasIa(true, env)).toEqual({ maxUsuario: 15, maxGlobal: 200 });
  });

  it("usa os valores do ambiente; a demo nunca passa do limite do usuário", () => {
    expect(limitesChamadasIa(false, { ...env, AI_DAILY_CALLS_USER: "50" }).maxUsuario).toBe(50);
    expect(limitesChamadasIa(true, { ...env, DEMO_AI_DAILY_CALLS: "5" }).maxUsuario).toBe(5);
    expect(limitesChamadasIa(true, { ...env, DEMO_AI_DAILY_CALLS: "99", AI_DAILY_CALLS_USER: "8" }).maxUsuario).toBe(8);
  });

  it.each([undefined, "", "abc", "-1", "2.5", "1e9", "0"])("global %j nega (maxGlobal 0)", (valor) => {
    expect(limitesChamadasIa(false, { AI_DAILY_CALLS_GLOBAL: valor }).maxGlobal).toBe(0);
  });

  it("valor acima do int do Postgres é limitado, para não estourar o RPC", () => {
    const grande = { AI_DAILY_CALLS_GLOBAL: "3000000000", AI_DAILY_CALLS_USER: "9007199254740991" };
    expect(limitesChamadasIa(false, grande)).toEqual({ maxUsuario: 2_147_483_647, maxGlobal: 2_147_483_647 });
  });

  it("limite de usuário inválido volta ao padrão, nunca abre", () => {
    expect(limitesChamadasIa(false, { ...env, AI_DAILY_CALLS_USER: "x" }).maxUsuario).toBe(30);
    expect(limitesChamadasIa(true, { ...env, DEMO_AI_DAILY_CALLS: "x" }).maxUsuario).toBe(15);
  });
});

describe("ehContaDemo: só app_metadata.demo === true (escrita só pela API admin)", () => {
  it("true só com o booleano true", () => {
    expect(ehContaDemo({ app_metadata: { demo: true } })).toBe(true);
  });

  it.each([
    ["sem metadata", {}],
    ["metadata nula", { app_metadata: null }],
    ["demo false", { app_metadata: { demo: false } }],
    ["string 'true'", { app_metadata: { demo: "true" } }],
    ["número 1", { app_metadata: { demo: 1 } }],
    ["metadata não objeto", { app_metadata: "demo" }],
  ])("false: %s", (_nome, claims) => {
    expect(ehContaDemo(claims)).toBe(false);
  });

  it("ignora user_metadata (o usuário consegue escrever nele)", () => {
    expect(ehContaDemo({ user_metadata: { demo: true } })).toBe(false);
  });

  it("claims ausentes (sem sessão) não são demo", () => {
    expect(ehContaDemo(undefined)).toBe(false);
    expect(ehContaDemo(null)).toBe(false);
  });
});

describe("credenciaisDemo: só do servidor, sem as duas variáveis não há demo", () => {
  it("devolve e-mail e senha quando as duas existem", () => {
    expect(credenciaisDemo({ DEMO_EMAIL: "demo@exemplo.test", DEMO_PASSWORD: "x-senha-longa" })).toEqual({
      email: "demo@exemplo.test",
      senha: "x-senha-longa",
    });
  });

  it.each([
    ["nenhuma", {}],
    ["só e-mail", { DEMO_EMAIL: "demo@exemplo.test" }],
    ["só senha", { DEMO_PASSWORD: "x-senha-longa" }],
    ["e-mail vazio", { DEMO_EMAIL: "", DEMO_PASSWORD: "x-senha-longa" }],
    ["senha só com espaços", { DEMO_EMAIL: "demo@exemplo.test", DEMO_PASSWORD: "   " }],
  ])("null: %s", (_nome, env) => {
    expect(credenciaisDemo(env)).toBeNull();
  });

  it("normaliza o e-mail (apara e minúsculas), igual ao que o Auth grava", () => {
    expect(credenciaisDemo({ DEMO_EMAIL: "  Demo@Exemplo.TEST ", DEMO_PASSWORD: "x-senha-longa" })?.email).toBe("demo@exemplo.test");
  });

  it("não apara a senha (espaço pode fazer parte dela)", () => {
    expect(credenciaisDemo({ DEMO_EMAIL: "demo@exemplo.test", DEMO_PASSWORD: " abc " })?.senha).toBe(" abc ");
  });
});

describe("tetoDiarioIaCentavos: o teto da demo é o teto global de custo", () => {
  it("usuário comum: o teto global", () => {
    expect(tetoDiarioIaCentavos(false, { AI_DAILY_BUDGET_CENTS: "500" })).toBe(500);
  });

  it("demo: o menor entre o global e o da demo", () => {
    expect(tetoDiarioIaCentavos(true, { AI_DAILY_BUDGET_CENTS: "500", DEMO_AI_DAILY_BUDGET_CENTS: "50" })).toBe(50);
    expect(tetoDiarioIaCentavos(true, { AI_DAILY_BUDGET_CENTS: "30", DEMO_AI_DAILY_BUDGET_CENTS: "50" })).toBe(30);
  });

  it("demo sem valor próprio usa o padrão de 100 centavos", () => {
    expect(TETO_IA_DEMO_PADRAO_CENTAVOS).toBe(100);
    expect(tetoDiarioIaCentavos(true, { AI_DAILY_BUDGET_CENTS: "500" })).toBe(100);
  });

  it("demo com valor próprio inválido cai no padrão, nunca em 'sem teto'", () => {
    for (const ruim of ["abc", "-5", "1.5", "", "1e9"]) {
      expect(tetoDiarioIaCentavos(true, { AI_DAILY_BUDGET_CENTS: "500", DEMO_AI_DAILY_BUDGET_CENTS: ruim })).toBe(100);
    }
  });

  it("falha fechada: teto global ausente ou inválido = 0 (IA desligada), para todos", () => {
    for (const ruim of [undefined, "", "abc", "-1", "2.5", "Infinity"]) {
      expect(tetoDiarioIaCentavos(false, { AI_DAILY_BUDGET_CENTS: ruim })).toBe(0);
      expect(tetoDiarioIaCentavos(true, { AI_DAILY_BUDGET_CENTS: ruim, DEMO_AI_DAILY_BUDGET_CENTS: "50" })).toBe(0);
    }
  });

  it("zero explícito é aceito (IA desligada de propósito)", () => {
    expect(tetoDiarioIaCentavos(false, { AI_DAILY_BUDGET_CENTS: "0" })).toBe(0);
    expect(tetoDiarioIaCentavos(true, { AI_DAILY_BUDGET_CENTS: "500", DEMO_AI_DAILY_BUDGET_CENTS: "0" })).toBe(0);
  });
});

describe("bloqueioDaContaDemo: trocar e-mail/senha e excluir conta", () => {
  it("conta comum: sem bloqueio", () => {
    expect(bloqueioDaContaDemo(false)).toBeNull();
  });

  it("demo: erro 'proibido' com mensagem segura", () => {
    const r = bloqueioDaContaDemo(true);
    expect(r).toEqual({ ok: false, erro: { codigo: "proibido", mensagem: expect.any(String) } });
    expect(r?.ok === false && r.erro.mensagem).toMatch(/demonstra/i);
  });
});

describe("decidirSeed: só apaga usuário que a própria demo criou", () => {
  it("sem usuário com o e-mail: cria", () => {
    expect(decidirSeed(undefined)).toBe("criar");
  });

  it("usuário marcado como demo: recria (apaga e cria)", () => {
    expect(decidirSeed({ app_metadata: { demo: true } })).toBe("recriar");
  });

  it.each([
    ["sem marca", {}],
    ["marca false", { app_metadata: { demo: false } }],
    ["marca em user_metadata (forjável)", { user_metadata: { demo: true } }],
    ["marca como string", { app_metadata: { demo: "true" } }],
  ])("usuário real com o e-mail da demo (%s): aborta sem apagar", (_nome, existente) => {
    expect(decidirSeed(existente)).toBe("abortar");
  });
});

describe("recusaEntradaIaDemo: demo pública manda só texto curto ao Free", () => {
  it("recusa imagem e áudio", () => {
    expect(recusaEntradaIaDemo({ kind: "imagem" })).toBe(MENSAGEM_IA_DEMO_SO_TEXTO);
    expect(recusaEntradaIaDemo({ kind: "audio" })).toBe(MENSAGEM_IA_DEMO_SO_TEXTO);
  });

  it(`aceita texto até ${TEXTO_IA_DEMO_MAX} caracteres e recusa acima`, () => {
    expect(recusaEntradaIaDemo({ kind: "texto", texto: "a".repeat(TEXTO_IA_DEMO_MAX) })).toBeNull();
    expect(recusaEntradaIaDemo({ kind: "texto", texto: "a".repeat(TEXTO_IA_DEMO_MAX + 1) })).toBe(MENSAGEM_IA_DEMO_TEXTO_LONGO);
  });
});
