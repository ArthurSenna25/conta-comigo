import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  Fog,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { estadoDoFio } from "./fio-fundo";
import {
  FADE_CANVAS_MS,
  faixaDoTubo,
  limitarDpr,
  LIMITES_FIO3D,
  posicaoDaCamera,
  suavizar,
  trechoDesenhado,
} from "./fio3d-limites";

/**
 * Fio 3D de fundo: porte de design/handoff/prototipos/fio3d.js (05-LANDING.md L14: tubo em 3 camadas
 * aditivas, 1400 partículas, ponta brilhante, câmera segue a curva). Este módulo é o único que importa
 * `three` e só chega por import() dinâmico (fio3d-ligar.ts). O ponteiro e o progresso/cor/opacidade
 * entram sozinhos (pointermove e estadoDoFio), então o contrato público é só montar → desmontar.
 */
const COR_FOG = 0x0b1326;
const COR_TUBO = 0xacd6fa;
const COR_PARTICULA = 0x9cc8ff;
const RADIAIS = 10;
const PONTOS_CURVA = 52;
const CAMADAS: readonly (readonly [raio: number, opacidade: number])[] = [
  [0.016, 1],
  [0.05, 0.34],
  [0.15, 0.06],
];

function criarCurva(): CatmullRomCurve3 {
  const pontos: Vector3[] = [];
  for (let i = 0; i <= PONTOS_CURVA; i++) {
    const t = i / PONTOS_CURVA;
    pontos.push(new Vector3(Math.sin(t * Math.PI * 6) * 2.6 + Math.sin(t * 17) * 0.35, Math.cos(t * Math.PI * 4) * 1.1, -t * 140));
  }
  return new CatmullRomCurve3(pontos, false, "catmullrom", 0.5);
}

function criarTubo(cena: Scene, curva: CatmullRomCurve3): { camadas: Mesh<TubeGeometry, MeshBasicMaterial>[]; total: number } {
  const camadas = CAMADAS.map(([raio, opacidade]) => {
    const material = new MeshBasicMaterial({ color: COR_TUBO, transparent: true, opacity: opacidade, blending: AdditiveBlending, depthWrite: false });
    const malha = new Mesh(new TubeGeometry(curva, LIMITES_FIO3D.segmentosTubo, raio, RADIAIS, false), material);
    cena.add(malha);
    return malha;
  });
  const indice = camadas[0].geometry.index;
  if (!indice) throw new Error("TubeGeometry sem índice");
  return { camadas, total: indice.count };
}

function criarPonta(cena: Scene): { ponta: Sprite; textura: CanvasTexture } {
  const tela = document.createElement("canvas"); // textura 2D em memória, nunca entra no DOM
  tela.width = tela.height = 128;
  const g = tela.getContext("2d");
  if (!g) throw new Error("canvas 2D indisponível");
  const gradiente = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradiente.addColorStop(0, "rgba(255,255,255,1)");
  gradiente.addColorStop(0.25, "rgba(255,255,255,0.45)");
  gradiente.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gradiente;
  g.fillRect(0, 0, 128, 128);
  const textura = new CanvasTexture(tela);
  const ponta = new Sprite(new SpriteMaterial({ map: textura, transparent: true, blending: AdditiveBlending, depthWrite: false }));
  ponta.scale.set(0.9, 0.9, 1);
  cena.add(ponta);
  return { ponta, textura };
}

function criarParticulas(cena: Scene, curva: CatmullRomCurve3): void {
  const n = LIMITES_FIO3D.particulas;
  const posicoes = new Float32Array(n * 3);
  const ponto = new Vector3();
  for (let i = 0; i < n; i++) {
    curva.getPointAt(Math.random(), ponto);
    posicoes[i * 3] = ponto.x + (Math.random() - 0.5) * 14;
    posicoes[i * 3 + 1] = ponto.y + (Math.random() - 0.5) * 8;
    posicoes[i * 3 + 2] = ponto.z + (Math.random() - 0.5) * 6;
  }
  const geometria = new BufferGeometry();
  geometria.setAttribute("position", new BufferAttribute(posicoes, 3));
  const material = new PointsMaterial({ color: COR_PARTICULA, size: 0.045, transparent: true, opacity: 0.7, blending: AdditiveBlending, depthWrite: false });
  cena.add(new Points(geometria, material));
}

/** Cria o canvas logo depois do SVG (mesma camada, por cima), em opacity 0 até o primeiro quadro (05 L17). */
function criarCanvas(): HTMLCanvasElement {
  const svg = document.querySelector('[data-movimento="fio-fundo"]');
  if (!svg) throw new Error("fundo do Fio não encontrado");
  const canvas = document.createElement("canvas");
  canvas.className = "lp-fio-3d";
  canvas.setAttribute("aria-hidden", "true");
  svg.after(canvas);
  return canvas;
}

/**
 * Monta o canvas e o loop. Devolve o `destroy`: remove canvas e listeners e libera renderer, geometrias,
 * materiais e textura. Se lançar no meio, já desfez o que criou (quem chama só precisa logar o aviso).
 */
export function montarFio3d(aoPerder: () => void): () => void {
  const desfazer: (() => void)[] = [];
  const destruir = () => {
    while (desfazer.length) desfazer.pop()?.();
  };
  try {
    const canvas = criarCanvas();
    desfazer.push(() => canvas.remove());

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    desfazer.push(() => {
      renderer.dispose();
      renderer.forceContextLoss(); // devolve o contexto GL já: o navegador limita quantos ficam abertos
    });
    renderer.setPixelRatio(limitarDpr(window.devicePixelRatio));
    renderer.setClearColor(0x000000, 0);

    const cena = new Scene();
    cena.fog = new Fog(COR_FOG, 5, 44);
    const camera = new PerspectiveCamera(58, 1, 0.05, 120);
    const curva = criarCurva();
    const { camadas, total } = criarTubo(cena, curva);
    const { ponta, textura } = criarPonta(cena);
    criarParticulas(cena, curva);
    desfazer.push(() => {
      cena.traverse((o) => {
        if (o instanceof Mesh || o instanceof Points) {
          o.geometry.dispose();
          (o.material as MeshBasicMaterial | PointsMaterial).dispose();
        }
        if (o instanceof Sprite) o.material.dispose();
      });
      textura.dispose();
    });

    const alvo = { p: 0, desenhado: 0 };
    const atual = { p: 0, desenhado: 0 };
    const ponteiro = { x: 0, y: 0 };
    const suave = { x: 0, y: 0 };
    const ponto = new Vector3();
    const olhar = new Vector3();
    const cor = new Color();
    let opacidadeAplicada = -1;
    let raf = 0;
    let visivel = true;
    let timerSvg = 0;

    const redimensionar = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const quadro = () => {
      raf = requestAnimationFrame(quadro);
      const fio = estadoDoFio();
      alvo.p = fio.progresso;
      alvo.desenhado = trechoDesenhado(fio.progresso);
      atual.p = suavizar(atual.p, alvo.p, 0.08);
      atual.desenhado = suavizar(atual.desenhado, alvo.desenhado, 0.05);
      suave.x = suavizar(suave.x, ponteiro.x, 0.05);
      suave.y = suavizar(suave.y, ponteiro.y, 0.05);

      const u = posicaoDaCamera(atual.p);
      curva.getPointAt(u, ponto);
      camera.position.set(ponto.x * 0.6 + suave.x * 0.8, ponto.y + 1.5 - suave.y * 0.4, ponto.z + 3.8);
      curva.getPointAt(Math.min(u + 0.045, 1), olhar);
      camera.lookAt(olhar.x, olhar.y - 0.1, olhar.z);

      const d = Math.min(1, Math.max(0.001, atual.desenhado));
      const { inicio, quantidade } = faixaDoTubo(total, atual.desenhado, u);
      for (const c of camadas) c.geometry.setDrawRange(inicio, quantidade);
      curva.getPointAt(d, ponto);
      ponta.position.copy(ponto);
      cor.setRGB(fio.rgb[0] / 255, fio.rgb[1] / 255, fio.rgb[2] / 255, SRGBColorSpace);
      for (const c of camadas) c.material.color.lerp(cor, 0.08);
      ponta.material.color.copy(camadas[0].material.color);
      renderer.render(cena, camera);

      if (opacidadeAplicada !== fio.opacidade) {
        opacidadeAplicada = fio.opacidade;
        canvas.style.opacity = String(fio.opacidade); // o CSS faz o fade de 600ms (05 L17)
        if (!timerSvg) timerSvg = window.setTimeout(() => document.documentElement.classList.add("mv-webgl"), FADE_CANVAS_MS);
      }
    };

    // 05 L179: pausa com aba oculta; o pedido também pede pausa com o canvas fora da tela.
    const atualizarLoop = () => {
      const deveRodar = visivel && !document.hidden;
      if (deveRodar && !raf) raf = requestAnimationFrame(quadro);
      else if (!deveRodar && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const aoMoverPonteiro = (e: PointerEvent) => {
      ponteiro.x = e.clientX / window.innerWidth - 0.5;
      ponteiro.y = e.clientY / window.innerHeight - 0.5;
    };
    const aoPerderContexto = (e: Event) => {
      e.preventDefault();
      console.warn("[fio3d] contexto WebGL perdido; a landing segue só com o Fio SVG.");
      aoPerder();
    };
    const observador = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      atualizarLoop();
    });

    redimensionar();
    window.addEventListener("resize", redimensionar);
    window.addEventListener("pointermove", aoMoverPonteiro, { passive: true });
    document.addEventListener("visibilitychange", atualizarLoop);
    canvas.addEventListener("webglcontextlost", aoPerderContexto);
    observador.observe(canvas);
    desfazer.push(() => {
      cancelAnimationFrame(raf);
      clearTimeout(timerSvg);
      document.documentElement.classList.remove("mv-webgl");
      observador.disconnect();
      canvas.removeEventListener("webglcontextlost", aoPerderContexto);
      document.removeEventListener("visibilitychange", atualizarLoop);
      window.removeEventListener("pointermove", aoMoverPonteiro);
      window.removeEventListener("resize", redimensionar);
    });
    atualizarLoop();
    return destruir;
  } catch (erro) {
    destruir();
    throw erro;
  }
}
