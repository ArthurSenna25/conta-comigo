"""Regenera as imagens de teste offline com Pillow e fontes locais."""

from pathlib import Path
import json

from PIL import Image, ImageDraw, ImageFont


BASE = Path(__file__).resolve().parent
DESTINO = BASE / "midia"
DESTINO.mkdir(exist_ok=True)


def fonte(tamanho, mono=False, negrito=False):
    familia = ("DejaVuSansMono", "consola") if mono else ("DejaVuSans", "arial")
    nomes = [familia[0] + ("-Bold" if negrito else "") + ".ttf",
             familia[1] + ("b" if mono and negrito else "bd" if negrito else "") + ".ttf"]
    for nome in nomes:
        try:
            return ImageFont.truetype(nome, tamanho)
        except OSError:
            continue
    raise SystemExit("Disponibilize a fonte DejaVu Sans / Mono ou Arial e Consolas.")


def renderizar(caso):
    linhas = caso["conteudo"]
    foto = caso["modalidade"] == "foto"
    regular = fonte(23, mono=True)
    titulo = fonte(32, negrito=True)
    largura = int(max(520, regular.getlength(max(linhas[1:], key=regular.getlength)),
                      titulo.getlength(linhas[0]))) + 64
    altura = 96 + len(linhas) * 48
    cor = "#fbf7e9" if foto else "#f2f5f8"
    folha = Image.new("RGB", (largura, altura), cor)
    area = ImageDraw.Draw(folha)
    if foto:
        area.text((32, 25), linhas[0], font=titulo, fill="#242323")
        area.line((30, 82, largura - 30, 82), fill="#787268", width=2)
    else:
        area.rectangle((0, 0, largura, 75), fill="#214063")
        area.text((32, 17), linhas[0], font=titulo, fill="white")
    for idx, linha in enumerate(linhas[1:]):
        y = 100 + idx * 48
        if not foto:
            area.rounded_rectangle((12, y - 4, largura - 12, y + 38), radius=4, fill="white")
        area.text((32, y), linha, font=regular, fill="#202327")
    if foto:
        # Papel sobre uma mesa, com margens e leve rotação de câmera.
        angulo = (int(caso["id"][-2:]) % 5 - 2) * 0.65
        folha = folha.rotate(angulo, resample=Image.Resampling.BICUBIC,
                             expand=True, fillcolor="#807669")
        mesa = Image.new("RGB", (folha.width + 64, folha.height + 64), "#807669")
        mesa.paste(folha, (32, 32))
        folha = mesa
    folha.save(DESTINO / (caso["id"] + ".png"), optimize=True)


for item in json.loads((BASE / "casos.json").read_text(encoding="utf-8")):
    if item["modalidade"] in ("foto", "print"):
        renderizar(item)
