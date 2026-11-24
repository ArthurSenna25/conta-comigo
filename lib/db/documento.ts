import type { SupabaseClient } from "@supabase/supabase-js";
import { ImagemArquivo } from "@/lib/contracts";
import { extensaoDoMime } from "./mapeamento";

const BUCKET = "documentos";
/** URL assinada de leitura: curta de propósito (DADOS.md). Gere na hora de mostrar, nunca guarde. */
export const URL_ASSINADA_SEGUNDOS = 60;

const falha = (o: string, e: { code?: string; statusCode?: string }) =>
  new Error(`falha ao ${o} documento (${e.code ?? e.statusCode ?? "sem código"})`);

/**
 * Sobe a imagem ao Storage e registra em `documentos`. Só chame na CONFIRMAÇÃO (a imagem nunca é gravada antes).
 * Path `{user_id}/{uuid}.ext`: o nome vem do servidor, o nome do usuário é descartado. Valida tipo e 5 MiB com o
 * contrato; a policy do bucket só deixa gravar na pasta do próprio usuário. Se a linha falhar, apaga o arquivo.
 * Lança erros do Zod e do Storage: a action deve validar antes (safeParse) e devolver `Resultado` genérico.
 * Se o INSERT dos lançamentos falhar depois deste upload, a ação deve chamar `removerDocumento`.
 */
export async function enviarDocumento(db: SupabaseClient, userId: string, arquivo: File): Promise<{ id: string }> {
  const imagem = ImagemArquivo.parse(arquivo);
  const id = crypto.randomUUID();
  const path = `${userId}/${id}.${extensaoDoMime(imagem.type)}`;

  const up = await db.storage.from(BUCKET).upload(path, imagem, { contentType: imagem.type, upsert: false });
  if (up.error) throw falha("enviar", up.error);

  const { error } = await db
    .from("documentos")
    .insert({ id, user_id: userId, storage_path: path, mime: imagem.type, tamanho_bytes: imagem.size });
  if (error) {
    const rm = await db.storage.from(BUCKET).remove([path]); // sem linha, sem arquivo órfão
    if (rm.error) throw new Error(`falha ao registrar documento (${error.code ?? "sem código"}) e ao desfazer o upload: arquivo órfão no Storage`);
    throw falha("registrar", error);
  }
  return { id };
}

async function caminhoDoDocumento(db: SupabaseClient, userId: string, documentoId: string): Promise<string | null> {
  const { data, error } = await db
    .from("documentos")
    .select("storage_path")
    .eq("id", documentoId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw falha("ler", error);
  return (data?.storage_path as string | undefined) ?? null;
}

/** URL assinada curta do documento do usuário, ou null se não existe ou não é dele. */
export async function urlAssinadaDocumento(
  db: SupabaseClient,
  userId: string,
  documentoId: string,
): Promise<string | null> {
  const path = await caminhoDoDocumento(db, userId, documentoId);
  if (!path) return null;
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, URL_ASSINADA_SEGUNDOS);
  if (error) throw falha("assinar", error);
  return data.signedUrl;
}

/**
 * Apaga arquivo e linha. Arquivo primeiro: se a linha falhar sobra uma linha sem arquivo (inofensiva e
 * repetível), nunca um arquivo sem dono. false se não existe ou não é do usuário.
 * ATENÇÃO: a FK faz `set null` nos lançamentos que usam o documento. Quem chama confere antes
 * `contarLancamentosDoDocumento(...) === 0` (ou quer mesmo desfazer um upload recém-feito).
 */
export async function removerDocumento(db: SupabaseClient, userId: string, documentoId: string): Promise<boolean> {
  const path = await caminhoDoDocumento(db, userId, documentoId);
  if (!path) return false;
  const rm = await db.storage.from(BUCKET).remove([path]);
  if (rm.error) throw falha("remover arquivo do", rm.error);
  const { error } = await db.from("documentos").delete().eq("id", documentoId).eq("user_id", userId);
  if (error) throw falha("remover", error);
  return true;
}
