import { AUDIO_MAX_BYTES, IMAGEM_MAX_BYTES, IngestRequest, type CodigoErro } from "@/lib/contracts";

export class ErroIngestao extends Error {
  constructor(readonly status: number, readonly codigo: CodigoErro, mensagem: string) {
    super(mensagem);
  }
}

// Espaço para os dois campos e delimitadores multipart; o limite do arquivo
// em si continua sendo o de IngestRequest, diferente para foto e áudio.
const MAX_CORPO = IMAGEM_MAX_BYTES + 16 * 1024;
const grande = () => new ErroIngestao(413, "invalido", "Arquivo muito grande. Reduza o tamanho e tente novamente.");
const invalida = () => new ErroIngestao(400, "invalido", "Envie um texto, uma imagem ou um áudio dentro dos formatos e tamanhos aceitos.");

export async function lerEntrada(request: Request): Promise<IngestRequest> {
  const tipo = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(tipo)) {
    throw new ErroIngestao(415, "invalido", "Envie os campos como formulário multipart.");
  }
  if (Number(request.headers.get("content-length")) > MAX_CORPO) throw grande();
  if (!request.body) throw invalida();
  const leitor = request.body.getReader();
  const partes: Uint8Array<ArrayBuffer>[] = [];
  let tamanho = 0;
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > MAX_CORPO) {
        void leitor.cancel().catch(() => {});
        throw grande();
      }
      partes.push(new Uint8Array(value));
    }
  } finally {
    leitor.releaseLock();
  }
  let form: FormData;
  try {
    form = await new Response(new Blob(partes), { headers: { "Content-Type": tipo } }).formData();
  } catch {
    throw invalida();
  }
  const kind = form.get("kind");
  const campo = kind === "texto" ? "texto" : "arquivo";
  if (Array.from(form.keys()).length !== 2 || !form.has(campo)) throw invalida();
  let valor = form.get(campo);
  // MediaRecorder pode incluir parâmetros de codec no MIME do Blob. O
  // contrato valida o tipo base e o provedor confere os bytes do contêiner.
  if (kind === "audio" && valor instanceof File && valor.type.includes(";")) {
    valor = new File([valor], "audio", { type: valor.type.split(";")[0].trim() });
  }
  if (valor instanceof File && valor.size > (kind === "audio" ? AUDIO_MAX_BYTES : IMAGEM_MAX_BYTES)) throw grande();
  const entrada = IngestRequest.safeParse({ kind, [campo]: valor });
  if (!entrada.success) throw invalida();
  return entrada.data;
}
