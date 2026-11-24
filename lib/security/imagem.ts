// O header Content-Type do upload é escolha do cliente; o conteúdo diz o que o arquivo é (AMEACAS #1).
// Puro: recebe os bytes, devolve o tipo real ou null. Quem lê o arquivo é a action.

const comeca = (b: Uint8Array, ...esperado: number[]) => esperado.every((v, i) => b[i] === v);

/** Tipo real da imagem pelos primeiros bytes (JPEG, PNG, WebP), ou null se não for um dos três. */
export function mimeDaImagem(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (b.length < 12) return null;
  if (comeca(b, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (comeca(b, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  // WebP = "RIFF" + tamanho (4 bytes) + "WEBP"; RIFF sozinho também é WAV/AVI
  if (comeca(b, 0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return "image/webp";
  }
  return null;
}
