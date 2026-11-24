import type { IngestRequest } from "@/lib/contracts";
import { ErroIa } from "@/lib/ai/erro";

// A borda valida o MIME/tamanho pelo contrato. Aqui conferimos o contêiner
// antes do envio ao provedor, inclusive quando ele é chamado fora da rota.
function jpeg(b: Buffer): boolean {
  if (b.readUInt16BE(0) !== 0xffd8 || b.includes(Buffer.from("Exif\0\0", "binary"))) return false;
  return b[2] === 0xff && b.readUInt16BE(b.length - 2) === 0xffd9;
}

function png(b: Buffer): boolean {
  if (!b.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return false;
  if (b.toString("ascii", 12, 16) !== "IHDR" || b.readUInt32BE(8) !== 13) return false;
  let pixels = false;
  for (let p = 8; p + 12 <= b.length;) {
    const tamanho = b.readUInt32BE(p);
    const tipo = b.toString("latin1", p + 4, p + 8);
    p += 12 + tamanho;
    if (p > b.length || tipo === "eXIf") return false;
    if (tipo === "IDAT" && tamanho > 0) pixels = true;
    if (tipo === "IEND") return tamanho === 0 && pixels && p === b.length;
  }
  return false;
}

function riff(b: Buffer, formato: "WAVE" | "WEBP"): boolean {
  if (b.toString("latin1", 0, 4) !== "RIFF" || b.toString("latin1", 8, 12) !== formato) return false;
  if (b.readUInt32LE(4) + 8 !== b.length) return false;
  let conteudo = false;
  let temFormato = false;
  let p = 12;
  while (p + 8 <= b.length) {
    const tipo = b.toString("latin1", p, p + 4);
    const tamanho = b.readUInt32LE(p + 4);
    p += 8 + tamanho + (tamanho % 2);
    if (p > b.length || tipo === "EXIF") return false;
    if (tipo === "fmt " && tamanho >= 16) temFormato = true;
    if (tamanho && (formato === "WAVE" ? tipo === "data" : ["VP8 ", "VP8L", "ANMF"].includes(tipo))) conteudo = true;
  }
  return p === b.length && conteudo && (formato === "WEBP" || temFormato);
}

function mpeg(b: Buffer): boolean {
  let p = 0;
  if (b.toString("latin1", 0, 3) === "ID3") {
    const tamanho = b.subarray(6, 10);
    if (tamanho.some((n) => n > 127)) return false;
    p = 10 + tamanho.reduce((n, byte) => n * 128 + byte, 0) + (b[5] & 0x10 ? 10 : 0);
  }
  return p + 4 <= b.length && b[p] === 0xff && (b[p + 1] & 0xe0) === 0xe0
    && (b[p + 1] & 0x06) !== 0 && (b[p + 1] & 0x18) !== 0x08 && (b[p + 2] & 0xf0) !== 0xf0;
}

const assinaturas: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": jpeg,
  "image/png": png,
  "image/webp": (b) => riff(b, "WEBP"),
  "audio/wav": (b) => riff(b, "WAVE"),
  "audio/mpeg": mpeg,
  "audio/ogg": (b) => b.toString("latin1", 0, 5) === "OggS\0" && (b.includes("OpusHead") || b.includes("vorbis") || b.includes("fLaC")),
  "audio/webm": (b) => b.readUInt32BE(0) === 0x1a45dfa3 && b.includes("webm") && (b.includes("A_OPUS") || b.includes("A_VORBIS")) && !b.includes("V_VP"),
  "audio/mp4": (b) => b.toString("latin1", 4, 8) === "ftyp" && b.includes("soun") && !b.includes("vide"),
};

export async function validarMidia(entrada: IngestRequest): Promise<void> {
  if (entrada.kind === "texto") return;
  const bytes = Buffer.from(await entrada.arquivo.arrayBuffer());
  if (bytes.length < 16 || !assinaturas[entrada.arquivo.type]?.(bytes)) throw new ErroIa("entrada");
}
