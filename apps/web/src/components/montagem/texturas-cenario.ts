/**
 * Montagem v2 — TEXTURAS dos cenários (item 8 do plano de alterações,
 * pedido do Davi em 08/08: cenários realistas como as referências).
 *
 * O que separa as fotos de referência de um render "cara de desenho 3D"
 * não é resolução — é INFORMAÇÃO na luz e nas superfícies: sombra de
 * persiana e de folhagem projetada na parede, estuque com grão, madeira
 * com veio, fundo levemente fora de foco, quina real entre parede e
 * chão. Este módulo gera tudo isso POR CÓDIGO (canvas 2D → textura):
 * nenhum asset de terceiro, nenhuma dúvida de licença, e cada cenário é
 * um conjunto de parâmetros, não um arquivo.
 *
 * Como a câmera do configurador é fixa (sem órbita — a manivela gira a
 * obra), a luz da PAREDE pode ser bakeada na própria textura, como numa
 * foto: pool de luz, gobo e desfoque entram no canvas uma vez, custo
 * zero por quadro. O que atravessa as PEÇAS é outra história — esse é o
 * gobo projetado de verdade (SpotLight.map), em cenarios.tsx.
 */

import * as THREE from "three";

/** Lado dos canvases de parede/chão, em px. */
const LADO = 1024;

// ---------------------------------------------------------------------------
// Ruído — a matéria-prima de tudo que não pode parecer liso demais
// ---------------------------------------------------------------------------

/** PRNG determinístico (LCG): cenário igual em todo carregamento. */
function criarAleatorio(semente: number): () => number {
  let s = semente >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Ruído de valor com interpolação suave + fBm (4 oitavas). É o grão de
 * TODAS as superfícies daqui: estuque, veio de madeira, manchas.
 */
function criarFbm(semente: number): (x: number, y: number) => number {
  const rnd = criarAleatorio(semente);
  const N = 64;
  const grade = new Float32Array(N * N);
  for (let i = 0; i < grade.length; i++) grade[i] = rnd();
  const em = (x: number, y: number) =>
    grade[((y % N) + N) % N * N + (((x % N) + N) % N)];
  const suave = (t: number) => t * t * (3 - 2 * t);
  const ruido = (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = suave(x - x0);
    const fy = suave(y - y0);
    const a = em(x0, y0);
    const b = em(x0 + 1, y0);
    const c = em(x0, y0 + 1);
    const d = em(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  return (x, y) => {
    let v = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < 4; o++) {
      v += amp * ruido(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2.13;
    }
    return v; // ~[0, 1)
  };
}

// ---------------------------------------------------------------------------
// Helpers de canvas
// ---------------------------------------------------------------------------

function novaTela(lado = LADO): CanvasRenderingContext2D {
  const tela = document.createElement("canvas");
  tela.width = lado;
  tela.height = lado;
  return tela.getContext("2d")!;
}

function paraTextura(
  ctx: CanvasRenderingContext2D,
  sRGB = true
): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(ctx.canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (sRGB) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * O "fora de foco" das referências: o fundo das fotos 2 e 3 está
 * desfocado pela lente. Aqui o desfoque é bakeado no canvas — DOF de
 * verdade custaria um passe de pós-processamento por quadro; este custa
 * zero e é indistinguível num plano fixo.
 */
function borrar(ctx: CanvasRenderingContext2D, px: number): void {
  if (px <= 0) return;
  const copia = novaTela(ctx.canvas.width);
  copia.drawImage(ctx.canvas, 0, 0);
  ctx.filter = `blur(${px}px)`;
  ctx.drawImage(copia.canvas, 0, 0);
  ctx.filter = "none";
}

/** Mapa de normais a partir de um campo de altura (mesma receita das peças). */
function normalDeAltura(
  altura: Float32Array,
  lado: number,
  forca: number
): THREE.CanvasTexture {
  const ctx = novaTela(lado);
  const img = ctx.createImageData(lado, lado);
  const em = (x: number, y: number) =>
    altura[(((y % lado) + lado) % lado) * lado + (((x % lado) + lado) % lado)];
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const dx = (em(x + 1, y) - em(x - 1, y)) * forca;
      const dy = (em(x, y + 1) - em(x, y - 1)) * forca;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const o = (y * lado + x) * 4;
      img.data[o] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      img.data[o + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      img.data[o + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return paraTextura(ctx, false);
}

const paraHex = (c: THREE.Color) => `#${c.getHexString()}`;

// ---------------------------------------------------------------------------
// PAREDE — estuque com a luz da foto bakeada
// ---------------------------------------------------------------------------

export type GoboParede = "persiana" | "folhagem" | null;

export interface ReceitaParede {
  /** Cor do reboco no lado ILUMINADO. */
  cor: string;
  /** Cor no lado em sombra (as refs sempre têm um lado caindo). */
  sombra: string;
  /** Sombra projetada bakeada na parede. */
  gobo: GoboParede;
  /** Meias-canas verticais (o painel canelado da referência clara). */
  canelada?: boolean;
  /** Fora-de-foco do fundo, em px de blur no bake. */
  desfoquePx: number;
  /** De onde a luz vem no bake: -1 = esquerda, +1 = direita. */
  ladoDaLuz: 1 | -1;
  semente: number;
}

export interface TexturasParede {
  mapa: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  escalaNormal: number;
}

/** Silhueta de folhagem: cachos de elipses rotacionadas, depois borrados. */
function pintarFolhagem(
  ctx: CanvasRenderingContext2D,
  rnd: () => number,
  ladoDaLuz: number
): void {
  const sombra = novaTela();
  const g = sombra;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, LADO, LADO);
  g.fillStyle = "#000000";
  // Os cachos entram pelo canto OPOSTO à luz, como galhos na janela.
  const cx0 = ladoDaLuz > 0 ? LADO * 0.16 : LADO * 0.84;
  for (let cacho = 0; cacho < 7; cacho++) {
    const cx = cx0 + (rnd() - 0.5) * LADO * 0.5;
    const cy = LADO * (0.05 + rnd() * 0.45);
    for (let k = 0; k < 26; k++) {
      const ang = rnd() * Math.PI;
      const rx = 14 + rnd() * 34;
      const ry = rx * (0.32 + rnd() * 0.2);
      const dx = (rnd() - 0.5) * 150;
      const dy = (rnd() - 0.5) * 110;
      g.save();
      g.translate(cx + dx, cy + dy);
      g.rotate(ang);
      g.globalAlpha = 0.5 + rnd() * 0.4;
      g.beginPath();
      g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  g.globalAlpha = 1;
  // DUAS passadas — núcleo mais firme + penumbra larga deslocada: é a
  // sombra dupla que folhagem real projeta (crítica visual de 08/08).
  const nucleo = novaTela();
  nucleo.drawImage(sombra.canvas, 0, 0);
  borrar(nucleo, 10);
  borrar(g, 34);
  ctx.globalAlpha = 0.42;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(nucleo.canvas, 0, 0);
  ctx.globalAlpha = 0.3;
  ctx.drawImage(sombra.canvas, 14 * (ladoDaLuz > 0 ? -1 : 1), 10);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

/** Listras de persiana: ripas escuras suaves, levemente fora do prumo. */
function pintarPersiana(
  ctx: CanvasRenderingContext2D,
  rnd: () => number,
  ladoDaLuz: number
): void {
  const sombra = novaTela();
  const g = sombra;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, LADO, LADO);
  const passo = LADO / 11;
  const inclinacao = (rnd() * 0.06 + 0.03) * (ladoDaLuz > 0 ? 1 : -1);
  g.fillStyle = "#000000";
  for (let i = -2; i < 14; i++) {
    const x = i * passo + rnd() * 4;
    const largura = passo * (0.4 + rnd() * 0.08);
    g.save();
    g.translate(x, LADO / 2);
    g.transform(1, 0, inclinacao, 1, 0, 0);
    g.globalAlpha = 0.92;
    g.fillRect(-largura / 2, -LADO, largura, LADO * 2);
    g.restore();
  }
  g.globalAlpha = 1;
  borrar(g, 4);
  // As listras só existem onde a luz bate — no lado da sombra, somem.
  const mascara = g.createLinearGradient(
    ladoDaLuz > 0 ? LADO : 0, 0, ladoDaLuz > 0 ? LADO * 0.3 : LADO * 0.7, 0
  );
  mascara.addColorStop(0, "rgba(255,255,255,1)");
  mascara.addColorStop(1, "rgba(255,255,255,0)");
  g.globalCompositeOperation = "lighter";
  g.fillStyle = mascara;
  g.fillRect(0, 0, LADO, LADO);
  g.globalCompositeOperation = "source-over";

  ctx.globalAlpha = 0.72;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(sombra.canvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

/**
 * A parede inteira: estuque + luz em declive + pool + gobo + desfoque.
 * Devolve também o normal (o grão do reboco reage à luz real da cena).
 */
export function gerarParede(receita: ReceitaParede): TexturasParede {
  const rnd = criarAleatorio(receita.semente);
  const fbm = criarFbm(receita.semente + 17);
  const ctx = novaTela();
  const img = ctx.createImageData(LADO, LADO);
  const cor = new THREE.Color(receita.cor);
  const sombra = new THREE.Color(receita.sombra);
  const c = new THREE.Color();

  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      // Luz em declive na horizontal (o lado escuro das referências) e
      // um leve cair para o alto (teto sempre mais escuro nas fotos).
      const u = x / LADO;
      const v = y / LADO;
      const aoLongo = receita.ladoDaLuz > 0 ? u : 1 - u;
      let luz = 0.35 + 0.65 * Math.pow(aoLongo, 1.4);
      luz *= 0.9 + 0.1 * v;
      // Pool de luz CENTRADO atrás da obra (a câmera é fixa: o pico do
      // gradiente emoldura a peça, como na referência do ovo-tripé).
      const dPool = Math.hypot((u - 0.5) * 1.35, v - 0.55);
      luz += 0.3 * Math.max(0, 1 - dPool * 1.6);
      // Estuque: manchas largas + grão fino.
      const mancha = fbm(x / 190, y / 190) - 0.5;
      const grao = fbm(x / 7 + 40, y / 7 + 40) - 0.5;
      luz *= 1 + mancha * 0.1 + grao * 0.06;
      c.copy(sombra).lerp(cor, Math.min(1.15, Math.max(0, luz)));
      const o = (y * LADO + x) * 4;
      img.data[o] = Math.round(c.r * 255);
      img.data[o + 1] = Math.round(c.g * 255);
      img.data[o + 2] = Math.round(c.b * 255);
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  if (receita.gobo === "folhagem") pintarFolhagem(ctx, rnd, receita.ladoDaLuz);
  if (receita.gobo === "persiana") pintarPersiana(ctx, rnd, receita.ladoDaLuz);

  // Escurece a BASE da parede: o encontro com o chão tem oclusão real.
  const rodape = ctx.createLinearGradient(0, LADO * 0.8, 0, LADO);
  rodape.addColorStop(0, "rgba(0,0,0,0)");
  rodape.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = rodape;
  ctx.fillRect(0, 0, LADO, LADO);

  borrar(ctx, receita.desfoquePx);

  // Dither fino: mata o banding dos gradientes em telas de 8 bits (o
  // "degradê matematicamente liso" era um dos delatores de CG).
  const ditherImg = ctx.getImageData(0, 0, LADO, LADO);
  const dRnd = criarAleatorio(receita.semente + 777);
  for (let i = 0; i < ditherImg.data.length; i += 4) {
    const n = Math.round((dRnd() - 0.5) * 3);
    ditherImg.data[i] = Math.min(255, Math.max(0, ditherImg.data[i] + n));
    ditherImg.data[i + 1] = Math.min(255, Math.max(0, ditherImg.data[i + 1] + n));
    ditherImg.data[i + 2] = Math.min(255, Math.max(0, ditherImg.data[i + 2] + n));
  }
  ctx.putImageData(ditherImg, 0, 0);

  // Normal do estuque (e das meias-canas, quando canelada).
  const altura = new Float32Array(LADO * LADO);
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      let h = fbm(x / 9 + 80, y / 9 + 80) * 0.5 + fbm(x / 60, y / 60) * 0.5;
      if (receita.canelada) {
        // Meias-canas verticais do painel da referência clara.
        h = 0.25 * h + 0.75 * Math.abs(Math.sin((x / LADO) * Math.PI * 36));
      }
      altura[y * LADO + x] = h;
    }
  }
  return {
    mapa: paraTextura(ctx),
    normal: normalDeAltura(altura, LADO, receita.canelada ? 2.4 : 1.1),
    escalaNormal: receita.canelada ? 0.5 : 0.3,
  };
}

// ---------------------------------------------------------------------------
// CHÃO — madeira com veio, junta de tábua e roughness variado
// ---------------------------------------------------------------------------

export interface ReceitaMadeira {
  /** Tom claro e escuro do veio. */
  claro: string;
  escuro: string;
  /** Junta entre tábuas (mais escura). */
  junta: string;
  semente: number;
}

export interface TexturasChao {
  mapa: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  rugosidade: THREE.CanvasTexture;
}

export function gerarMadeira(receita: ReceitaMadeira): TexturasChao {
  const fbm = criarFbm(receita.semente);
  const rnd = criarAleatorio(receita.semente + 5);
  const ctx = novaTela();
  const img = ctx.createImageData(LADO, LADO);
  const claro = new THREE.Color(receita.claro);
  const escuro = new THREE.Color(receita.escuro);
  const junta = new THREE.Color(receita.junta);
  const c = new THREE.Color();

  const TABUAS = 7;
  const alturaTabua = LADO / TABUAS;
  // Cada tábua tem fase e tom próprios — nenhuma madeira repete a vizinha.
  const fases = Array.from({ length: TABUAS }, () => rnd() * 40);
  const tons = Array.from({ length: TABUAS }, () => 0.9 + rnd() * 0.2);

  const alturaRel = new Float32Array(LADO * LADO);
  const rug = novaTela();
  const rugImg = rug.createImageData(LADO, LADO);

  for (let y = 0; y < LADO; y++) {
    const tabua = Math.min(TABUAS - 1, Math.floor(y / alturaTabua));
    const dentroDaTabua = y - tabua * alturaTabua;
    const naJunta = dentroDaTabua < 3 || dentroDaTabua > alturaTabua - 3;
    for (let x = 0; x < LADO; x++) {
      // Veio ESTICADO ao longo da tábua (fibra direcional — a crítica
      // visual pegou o noise isotrópico lendo como mármore) e contraste
      // comprimido: madeira real varia pouco dentro de uma tábua.
      const distorcao = fbm(x / 220 + fases[tabua], y / 30) * 4;
      const veio =
        0.5 +
        0.5 *
          Math.sin(
            x / 46 + distorcao * 1.6 + fases[tabua] * 3 + (y % alturaTabua) / 14
          );
      const fibra = fbm(x / 6, y / 90 + fases[tabua]) - 0.5;
      let t = 0.42 + Math.pow(veio, 1.4) * 0.3 + fibra * 0.14;
      t = Math.min(1, Math.max(0, t)) * tons[tabua];
      c.copy(escuro).lerp(claro, t);
      if (naJunta) c.lerp(junta, 0.82);
      const o = (y * LADO + x) * 4;
      img.data[o] = Math.round(c.r * 255);
      img.data[o + 1] = Math.round(c.g * 255);
      img.data[o + 2] = Math.round(c.b * 255);
      img.data[o + 3] = 255;

      alturaRel[y * LADO + x] = naJunta ? 0.15 : 0.5 + (t - 0.5) * 0.35;
      // O veio escuro é um fio mais rugoso; a junta, mais ainda.
      const r = naJunta ? 235 : 118 + (1 - t) * 48 + (rnd() - 0.5) * 8;
      rugImg.data[o] = r;
      rugImg.data[o + 1] = r;
      rugImg.data[o + 2] = r;
      rugImg.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  rug.putImageData(rugImg, 0, 0);

  return {
    mapa: paraTextura(ctx),
    normal: normalDeAltura(alturaRel, LADO, 1.6),
    rugosidade: paraTextura(rug, false),
  };
}

// ---------------------------------------------------------------------------
// GOBO PROJETADO — o que atravessa as PEÇAS (SpotLight.map)
// ---------------------------------------------------------------------------

/**
 * Textura de projeção do foco: branca com o padrão do gobo. Diferente do
 * bake da parede, esta viaja na LUZ — as listras correm por cima da obra
 * quando a manivela gira, como nas fotos de produto de verdade.
 */
export function gerarGoboProjetado(
  tipo: Exclude<GoboParede, null>,
  semente: number
): THREE.CanvasTexture {
  const rnd = criarAleatorio(semente);
  const ctx = novaTela(512);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "#000000";
  if (tipo === "persiana") {
    const passo = 512 / 9;
    for (let i = 0; i < 10; i++) {
      ctx.globalAlpha = 0.62;
      ctx.fillRect(i * passo, 0, passo * 0.4, 512);
    }
    ctx.globalAlpha = 1;
    borrar(ctx, 4);
  } else {
    for (let cacho = 0; cacho < 6; cacho++) {
      const cx = rnd() * 512;
      const cy = rnd() * 512;
      for (let k = 0; k < 20; k++) {
        ctx.save();
        ctx.translate(cx + (rnd() - 0.5) * 130, cy + (rnd() - 0.5) * 130);
        ctx.rotate(rnd() * Math.PI);
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 + rnd() * 22, 6 + rnd() * 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    borrar(ctx, 10);
  }
  // Bordas do foco caem para o escuro — o cone não termina numa aresta.
  const raio = ctx.createRadialGradient(256, 256, 150, 256, 256, 256);
  raio.addColorStop(0, "rgba(0,0,0,0)");
  raio.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = raio;
  ctx.fillRect(0, 0, 512, 512);
  // Dithering: gradiente borrado em 8 bits PROJETADO vira curvas de
  // nível na peça — o ruído de ±1 nível quebra o banding sem aparecer.
  const img = ctx.getImageData(0, 0, 512, 512);
  const dRnd = criarAleatorio(semente + 99);
  for (let i = 0; i < img.data.length; i += 4) {
    const ruido = Math.round((dRnd() - 0.5) * 3);
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + ruido));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + ruido));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + ruido));
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(ctx.canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export { paraHex };
