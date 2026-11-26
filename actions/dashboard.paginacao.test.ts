import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPerfil } from "@/lib/contracts/mocks";
import { obterDashboard } from "./dashboard";

const m = vi.hoisted(() => ({ criarClienteServidor: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./sessao", () => ({
  exigirAcesso: async () => ({ userId: "u1", demo: false, consentimentoVigente: true }),
}));
vi.mock("@/lib/db/cliente-servidor", () => ({ criarClienteServidor: m.criarClienteServidor }));
vi.mock("@/lib/db/perfil", () => ({
  lerPerfil: async () => ({ ...mockPerfil, receitaInicialCentavos: 0 }),
}));
vi.mock("@/lib/security/datas", () => ({ hojeBrasil: () => "2026-11-25" }));

const data = "2026-01-10";
const linhas = Array.from({ length: 1001 }, (_, indice) => ({
  id: `00000000-0000-4000-8000-${String(indice + 1).padStart(12, "0")}`,
  user_id: "u1",
  documento_id: null,
  tipo: "receita",
  data,
  valor_centavos: 6_000,
  categoria: "vendas",
  descricao: "sintética",
  contraparte: null,
  forma_pgto: null,
  origem: "manual",
  criado_em: `${data}T12:00:00Z`,
  atualizado_em: `${data}T12:00:00Z`,
}));

function simularPostgrest(
  falharNaProximaPagina = false,
  total = linhas.length,
  teto = 1000,
  concorrencia?: "exclusao" | "insercao" | "repeticao",
) {
  const registros = [
    ...linhas.slice(0, total),
    { ...linhas[0], id: "00000000-0000-4000-8000-000000000999", user_id: "u2", valor_centavos: 9_000_000 },
  ];
  const chamadas: URLSearchParams[] = [];
  let paginaRepetida = false;
  const fetchLocal: typeof fetch = async (url) => {
    const { searchParams: filtros } = new URL(String(url));
    chamadas.push(filtros);
    const inicio = Number(filtros.get("offset") ?? 0);
    const cursor = filtros.get("id")?.slice(3);
    const continuacao = inicio > 0 || cursor !== undefined;
    const tamanho = Math.min(Number(filtros.get("limit") ?? teto), teto);
    if (falharNaProximaPagina && continuacao) {
      return Response.json({ code: "falha_sintetica", message: "Falha da segunda página" }, { status: 500 });
    }
    const resultado = registros.filter((linha) =>
      (!filtros.has("user_id") || filtros.get("user_id") === `eq.${linha.user_id}`) &&
      (!filtros.has("tipo") || filtros.get("tipo") === `eq.${linha.tipo}`) &&
      filtros.getAll("data").every((filtro) =>
        filtro.startsWith("gte.") ? linha.data >= filtro.slice(4) : linha.data < filtro.slice(3),
      ),
    );
    // Alterna a ordem de empate para representar páginas sem desempate estável.
    const ordemId = filtros.get("order")?.split(",").find((ordem) => ordem.startsWith("id."));
    if (ordemId === "id.desc" || (!ordemId && inicio > 0)) resultado.reverse();
    const receitasAnuais = filtros.get("tipo") === "eq.receita";
    if (concorrencia === "repeticao" && receitasAnuais && continuacao) {
      if (paginaRepetida) return Response.json([]);
      paginaRepetida = true;
      return Response.json(resultado.slice(0, tamanho));
    }
    const pagina = resultado.filter((linha) => cursor === undefined || linha.id < cursor)
      .slice(inicio, inicio + tamanho);
    if (!continuacao && concorrencia === "exclusao" && receitasAnuais) {
      const lida = resultado[0];
      registros.splice(registros.indexOf(lida), 1);
    }
    if (!continuacao && concorrencia === "insercao" && !filtros.has("tipo")) {
      registros.push({ ...linhas[0], id: "00000000-0000-4000-8000-000000010002" });
    }
    return Response.json(pagina);
  };
  m.criarClienteServidor.mockResolvedValue(
    createClient("https://supabase.invalid", "chave-sintetica", {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: fetchLocal },
    }),
  );
  return chamadas;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("obterDashboard com o limite de linhas do PostgREST", () => {
  it("conta todas as 1001 receitas com datas iguais e mantém o escopo do usuário em cada página", async () => {
    const chamadas = simularPostgrest();
    expect(await obterDashboard()).toMatchObject({
      ok: true,
      dados: {
        limiteMei: { usadoCentavos: 6_006_000, faixa: "70" },
        alertas: [{ chave: "limite_mei:2026:70" }],
      },
    });
    expect(chamadas.every((filtros) => filtros.get("user_id") === "eq.u1")).toBe(true);
    const paginasReceitas = chamadas.filter((filtros) => filtros.get("tipo") === "eq.receita");
    expect(paginasReceitas.length).toBeGreaterThan(1);
    expect(paginasReceitas.every((filtros) => filtros.get("order") === "id.desc" && !filtros.has("offset"))).toBe(true);
  });

  it("retorna erro genérico sem dados parciais quando uma página posterior falha", async () => {
    const chamadas = simularPostgrest(true);
    const resultado = await obterDashboard();
    expect(resultado).toMatchObject({ ok: false, erro: { codigo: "interno" } });
    expect(resultado).not.toHaveProperty("dados");
    expect(JSON.stringify(resultado)).not.toContain("falha_sintetica");
    expect(chamadas.some((filtros) => filtros.has("id"))).toBe(true);
  });

  it("aceita exatamente 1000 receitas e encerra ao receber uma página vazia", async () => {
    const chamadas = simularPostgrest(false, 1000);
    expect(await obterDashboard()).toMatchObject({ ok: true, dados: { limiteMei: { usadoCentavos: 6_000_000 } } });
    const paginas = chamadas.filter((filtros) => filtros.get("tipo") === "eq.receita");
    expect(paginas.map((filtros) => filtros.get("id"))).toEqual([null, `lt.${linhas[0].id}`]);
  });

  it("avança pela quantidade efetivamente recebida se o servidor impõe um teto menor", async () => {
    const chamadas = simularPostgrest(false, 5, 2);
    expect(await obterDashboard()).toMatchObject({ ok: true, dados: { limiteMei: { usadoCentavos: 30_000 } } });
    const paginas = chamadas.filter((filtros) => filtros.get("tipo") === "eq.receita");
    expect(paginas.map((filtros) => filtros.get("id"))).toEqual([
      null, `lt.${linhas[3].id}`, `lt.${linhas[1].id}`, `lt.${linhas[0].id}`,
    ]);
  });

  it("lê a receita ainda pendente após a exclusão de uma linha da página já lida", async () => {
    simularPostgrest(false, 3, 2, "exclusao");
    expect(await obterDashboard()).toMatchObject({ ok: true, dados: { limiteMei: { usadoCentavos: 18_000 } } });
  });

  it("não repete linha no resumo quando uma inserção antecede a página já lida", async () => {
    simularPostgrest(false, 3, 2, "insercao");
    expect(await obterDashboard("2026-01")).toMatchObject({
      ok: true,
      dados: { resumoMes: { receitaCentavos: 18_000 } },
    });
  });

  it("rejeita uma página repetida sem publicar totais", async () => {
    simularPostgrest(false, 3, 2, "repeticao");
    const resultado = await obterDashboard();
    expect(resultado).toMatchObject({ ok: false, erro: { codigo: "interno" } });
    expect(resultado).not.toHaveProperty("dados");
  });
});
