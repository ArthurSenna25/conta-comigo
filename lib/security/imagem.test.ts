import { describe, expect, it } from "vitest";
import { mimeDaImagem } from "./imagem";

const bytes = (...b: number[]) => new Uint8Array([...b, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe("mimeDaImagem (magic bytes)", () => {
  it("reconhece JPEG, PNG e WebP", () => {
    expect(mimeDaImagem(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(mimeDaImagem(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    // RIFF....WEBP
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0]);
    expect(mimeDaImagem(webp)).toBe("image/webp");
  });

  it("não reconhece HTML, GIF, PDF, RIFF que não é WebP nem vazio", () => {
    expect(mimeDaImagem(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(mimeDaImagem(new TextEncoder().encode("GIF89a......"))).toBeNull();
    expect(mimeDaImagem(new TextEncoder().encode("%PDF-1.7......"))).toBeNull();
    expect(mimeDaImagem(new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45]))).toBeNull(); // WAV
    expect(mimeDaImagem(new Uint8Array())).toBeNull();
    expect(mimeDaImagem(new Uint8Array([0xff, 0xd8]))).toBeNull(); // curto demais para ser JPEG válido
  });
});
