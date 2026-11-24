/**
 * Teste de RLS/RPC de `reservar_uso_ia` contra o Supabase linkado: NÃO roda no `pnpm check`. Uso: `pnpm test:rls`.
 * O teste do limite global vem PRIMEIRO de propósito: ele prova que o dia começa com soma 0 (a primeira
 * reserva com global 1 só passa se ninguém usou a IA hoje); `service_role` não lê `ai_usage`, então não há
 * outra forma de conhecer a linha de base. Se falhar por uso real do dia, rode de novo quando zerar.
 */
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, criarUsuario, limparUsuarios, type Usuario } from "./ajuda";

const SEM_SESSAO = { auth: { persistSession: false, autoRefreshToken: false } } as const;
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, SEM_SESSAO);
const GRANDE = 1_000_000;

const reservar = (userId: string, maxUsuario: number, maxGlobal: number) =>
  admin.rpc("reservar_uso_ia", { p_user_id: userId, p_max_usuario: maxUsuario, p_max_global: maxGlobal });
const semPermissao = (e: { code?: string; message?: string } | null) =>
  e?.code === "42501" || /permission denied/i.test(e?.message ?? "");
const chamadasDe = async (u: Usuario) => (await u.db.from("ai_usage").select("chamadas")).data?.[0]?.chamadas ?? 0;

let P: Usuario;
let A: Usuario;
let B: Usuario;
let C: Usuario;

beforeAll(async () => {
  P = await criarUsuario();
  A = await criarUsuario();
  B = await criarUsuario();
  C = await criarUsuario();
});
afterAll(limparUsuarios);

describe("reservar_uso_ia: limite global entre usuários", () => {
  it("a soma do dia vale para todos", async () => {
    const baseline = await reservar(P.id, 5, 1);
    expect(baseline.error).toBeNull();
    expect(baseline.data, "o dia já tem uso de IA; rode quando zerar (soma global ≠ 0)").toBe(true);
    expect((await reservar(A.id, 5, 1)).data).toBe(false); // soma 1 >= global 1
    expect((await reservar(A.id, 5, 2)).data).toBe(true); // soma 1 < global 2
    expect((await reservar(B.id, 5, 2)).data).toBe(false); // soma 2 >= global 2, outro usuário
    expect(await chamadasDe(B)).toBe(0); // negar não grava nada
  });
});

describe("reservar_uso_ia: limite do usuário e concorrência", () => {
  it("10 reservas paralelas com limite 3 dão exatamente 3 true", async () => {
    const respostas = await Promise.all(Array.from({ length: 10 }, () => reservar(C.id, 3, GRANDE)));
    expect(respostas.every((r) => r.error === null)).toBe(true);
    expect(respostas.filter((r) => r.data === true)).toHaveLength(3);
    expect(respostas.filter((r) => r.data === false)).toHaveLength(7);
    expect(await chamadasDe(C)).toBe(3); // as negadas não incrementaram
  });

  it("depois do limite continua negando", async () => {
    expect((await reservar(C.id, 3, GRANDE)).data).toBe(false);
    expect(await chamadasDe(C)).toBe(3);
  });

  it.each([[0, 10], [-1, 10], [3, 0], [3, -1]])("falha fechada: limites (%i, %i) negam sem gravar", async (u, g) => {
    expect((await reservar(B.id, u, g)).data).toBe(false);
    expect(await chamadasDe(B)).toBe(0);
  });
});

describe("reservar_uso_ia: quem pode executar", () => {
  it("usuário comum e anon não executam", async () => {
    const args = { p_user_id: A.id, p_max_usuario: 1, p_max_global: GRANDE };
    const antes = await chamadasDe(A);
    expect(semPermissao((await A.db.rpc("reservar_uso_ia", args)).error)).toBe(true);
    expect(semPermissao((await anon.rpc("reservar_uso_ia", args)).error)).toBe(true);
    expect(await chamadasDe(A)).toBe(antes); // a tentativa negada não gravou nada
  });
});
