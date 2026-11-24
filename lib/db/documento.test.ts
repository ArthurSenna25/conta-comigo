import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { enviarDocumento } from "./documento";

const USER = "0b0c7f0e-8f5e-4d6f-9d8e-1a2b3c4d5e6f";
const png = () => new File([new Uint8Array(16).fill(1)], "nota.png", { type: "image/png" });

/** Client falso: upload dá certo e o INSERT em `documentos` falha. */
function clienteComInsertQueFalha(erroDoRemove: { message: string } | null) {
  const remove = vi.fn().mockResolvedValue({ error: erroDoRemove });
  const upload = vi.fn().mockResolvedValue({ error: null });
  const db = {
    storage: { from: () => ({ upload, remove }) },
    from: () => ({ insert: () => Promise.resolve({ error: { code: "23514" } }) }),
  } as unknown as SupabaseClient;
  return { db, upload, remove };
}

describe("enviarDocumento: falha ao registrar a linha", () => {
  it("apaga o arquivo recém-enviado e lança sem o path nem o usuário na mensagem", async () => {
    const { db, upload, remove } = clienteComInsertQueFalha(null);
    await expect(enviarDocumento(db, USER, png())).rejects.toThrow(new Error("falha ao registrar documento (23514)"));
    const path = upload.mock.calls[0]![0] as string;
    expect(path).toMatch(new RegExp(`^${USER}/[0-9a-f-]{36}\.png$`));
    expect(remove).toHaveBeenCalledWith([path]);
  });

  it("se o desfazer também falha, o erro avisa que sobrou arquivo órfão", async () => {
    const { db } = clienteComInsertQueFalha({ message: "x" });
    await expect(enviarDocumento(db, USER, png())).rejects.toThrow(/órfão/);
  });

  it("não sobe nada se o arquivo é inválido (tipo ou tamanho)", async () => {
    const { db, upload } = clienteComInsertQueFalha(null);
    await expect(enviarDocumento(db, USER, new File([new Uint8Array(8)], "a.gif", { type: "image/gif" }))).rejects.toThrow();
    expect(upload).not.toHaveBeenCalled();
  });
});
