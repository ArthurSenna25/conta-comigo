"use server";

import { z } from "zod";
import {
  ConfirmarRequest,
  DataISO,
  LancamentoInput,
  Uuid,
  type ConfirmarResponse,
  type Lancamento,
  type Resultado,
} from "@/lib/contracts";
import { mockLancamentos } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { enviarDocumento, removerDocumento } from "@/lib/db/documento";
import {
  contarLancamentosDoDocumento,
  criarLancamentos,
  editarLancamento,
  excluirLancamento,
  listarLancamentos,
} from "@/lib/db/lancamento";
import { dataFutura, hojeBrasil } from "@/lib/security/datas";
import { mimeDaImagem } from "@/lib/security/imagem";
import { modoMock } from "@/lib/security/modo-mock";
import { erro, interno, invalido } from "./resultado";
import { exigirAcesso } from "./sessao";

const DOIS_ANOS_EM_DIAS = 731;
const Periodo = z
  .object({ de: DataISO, ate: DataISO })
  .refine((p) => p.de < p.ate, "o início deve ser antes do fim")
  .refine((p) => (Date.parse(p.ate) - Date.parse(p.de)) / 86_400_000 <= DOIS_ANOS_EM_DIAS, "período grande demais");
const EdicaoInput = z.object({ id: Uuid, lancamento: LancamentoInput });

const MSG_DATA_FUTURA = "A data não pode ser no futuro.";
const MSG_IMAGEM = "Imagem inválida. Envie uma foto JPEG, PNG ou WebP de até 5 MB.";

const comDataFutura = (itens: readonly LancamentoInput[]) => {
  const hoje = hojeBrasil();
  return itens.some((i) => dataFutura(i.data, hoje));
};

/** Lê o FormData: só os dois campos conhecidos. `lancamentos` é JSON; `imagem` é opcional (arquivo vazio = ausente). */
function lerConfirmacao(fd: FormData): unknown {
  const bruto = fd.get("lancamentos");
  let lancamentos: unknown = null;
  try {
    lancamentos = typeof bruto === "string" ? JSON.parse(bruto) : null;
  } catch {
    lancamentos = null;
  }
  const imagem = fd.get("imagem");
  return { lancamentos, imagem: imagem instanceof File && imagem.size > 0 ? imagem : undefined };
}

/**
 * Confirma o rascunho: revalida TUDO no servidor (o que veio da IA não tem privilégio), confere o conteúdo real
 * da imagem (magic bytes, não o header), sobe o arquivo SÓ agora e grava o lote. Se a gravação falhar depois do
 * upload, desfaz o documento. Cliente: FormData com `lancamentos` (JSON) e, opcional, `imagem`.
 */
export async function confirmarLancamento(form: FormData): Promise<Resultado<ConfirmarResponse>> {
  const parsed = ConfirmarRequest.safeParse(lerConfirmacao(form));
  if (!parsed.success) return invalido(parsed.error);
  const { lancamentos: itens, imagem } = parsed.data;
  if (comDataFutura(itens)) return erro("invalido", MSG_DATA_FUTURA);

  if (modoMock()) {
    const agora = new Date().toISOString();
    const dados = itens.map((i) => ({ ...i, id: crypto.randomUUID(), documentoId: null, criadoEm: agora, atualizadoEm: agora }));
    return { ok: true, dados: { lancamentos: dados } };
  }

  const { userId } = await exigirAcesso(); // antes de ler os bytes: quem não tem acesso não faz o servidor processar arquivo
  if (imagem && mimeDaImagem(new Uint8Array(await imagem.arrayBuffer())) !== imagem.type) {
    return erro("invalido", MSG_IMAGEM);
  }

  let documentoId: string | null = null;
  let db: Awaited<ReturnType<typeof criarClienteServidor>> | null = null;
  try {
    db = await criarClienteServidor();
    if (imagem) documentoId = (await enviarDocumento(db, userId, imagem)).id;
    return { ok: true, dados: { lancamentos: await criarLancamentos(db, userId, itens, documentoId) } };
  } catch (e) {
    if (db && documentoId) {
      await removerDocumento(db, userId, documentoId).catch((r: unknown) => interno("confirmarLancamento/desfazer", r));
    }
    return interno("confirmarLancamento", e);
  }
}

/** Lançamentos do usuário com `de <= data < ate`, do mais novo ao mais antigo. */
export async function listar(periodo: unknown): Promise<Resultado<Lancamento[]>> {
  const parsed = Periodo.safeParse(periodo);
  if (!parsed.success) return invalido(parsed.error);
  if (modoMock()) {
    const { de, ate } = parsed.data;
    return { ok: true, dados: mockLancamentos.filter((l) => l.data >= de && l.data < ate) };
  }

  const { userId } = await exigirAcesso();
  try {
    return { ok: true, dados: await listarLancamentos(await criarClienteServidor(), userId, parsed.data) };
  } catch (e) {
    return interno("listar", e);
  }
}

/** Edita um lançamento do próprio usuário. O documento anexado não muda. */
export async function editar(entrada: unknown): Promise<Resultado<Lancamento>> {
  const parsed = EdicaoInput.safeParse(entrada);
  if (!parsed.success) return invalido(parsed.error);
  const { id, lancamento } = parsed.data;
  if (comDataFutura([lancamento])) return erro("invalido", MSG_DATA_FUTURA);
  if (modoMock()) {
    const agora = new Date().toISOString();
    return { ok: true, dados: { ...lancamento, id, documentoId: null, criadoEm: agora, atualizadoEm: agora } };
  }

  const { userId } = await exigirAcesso();
  try {
    const editado = await editarLancamento(await criarClienteServidor(), userId, id, lancamento);
    return editado ? { ok: true, dados: editado } : erro("nao_encontrado");
  } catch (e) {
    return interno("editar", e);
  }
}

/**
 * Exclui um lançamento do próprio usuário. Se era o último a usar o comprovante, apaga o arquivo e a linha do
 * documento (DADOS.md). Falha nessa limpeza é registrada, mas não desfaz a exclusão que o usuário pediu.
 */
export async function excluir(id: unknown): Promise<Resultado<null>> {
  const parsed = Uuid.safeParse(id);
  if (!parsed.success) return invalido(parsed.error);
  if (modoMock()) return { ok: true, dados: null };

  const { userId } = await exigirAcesso();
  try {
    const db = await criarClienteServidor();
    const excluido = await excluirLancamento(db, userId, parsed.data);
    if (!excluido) return erro("nao_encontrado");
    const { documentoId } = excluido;
    if (documentoId && (await contarLancamentosDoDocumento(db, userId, documentoId).catch(() => 1)) === 0) {
      await removerDocumento(db, userId, documentoId).catch((e: unknown) => interno("excluir/documento", e));
    }
    return { ok: true, dados: null };
  } catch (e) {
    return interno("excluir", e);
  }
}
