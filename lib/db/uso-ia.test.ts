import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroReserva, reservarUsoIa } from "./uso-ia";

const { rpc, createClient } = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpc, createClient: vi.fn(() => ({ rpc })) };
});
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

const limites = { maxUsuario: 30, maxGlobal: 200 };

beforeEach(() => {
  vi.resetAllMocks();
  createClient.mockImplementation(() => ({ rpc }));
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publicavel");
  vi.stubEnv("SUPABASE_SECRET_KEY", "segredo-de-teste");
});

describe("reservarUsoIa", () => {
  it("chama o RPC com os limites e devolve true quando reservou", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(reservarUsoIa("usuario", limites)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("reservar_uso_ia", {
      p_user_id: "usuario", p_max_usuario: 30, p_max_global: 200,
    });
    expect(createClient).toHaveBeenCalledWith(
      "https://exemplo.supabase.co", "segredo-de-teste", { auth: { persistSession: false, autoRefreshToken: false } },
    );
  });

  it("devolve false quando o banco nega", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(reservarUsoIa("usuario", limites)).resolves.toBe(false);
  });

  it("falha fechada: erro do RPC lança sem vazar a mensagem do banco", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "detalhe interno do banco", code: "XX000" } });
    const falha = await reservarUsoIa("usuario", limites).catch((e: unknown) => e);
    expect(falha).toBeInstanceOf(ErroReserva);
    expect((falha as ErroReserva).motivo).toBe("rpc XX000"); // só o SQLSTATE, nunca o texto do banco
    expect(JSON.stringify([(falha as Error).message, (falha as ErroReserva).motivo])).not.toContain("detalhe interno");
  });

  it.each([null, "true", 1])("falha fechada: resposta %j que não é boolean lança", async (data) => {
    rpc.mockResolvedValue({ data, error: null });
    await expect(reservarUsoIa("usuario", limites)).rejects.toThrow();
  });

  it("falha fechada: sem SUPABASE_SECRET_KEY não chama nada", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    await expect(reservarUsoIa("usuario", limites)).rejects.toMatchObject({ motivo: "chave ausente" });
    expect(createClient).not.toHaveBeenCalled();
  });
});
