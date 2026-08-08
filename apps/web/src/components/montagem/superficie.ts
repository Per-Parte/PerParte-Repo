/**
 * Montagem v2 — SUPERFÍCIE das peças (item 7 do plano de alterações).
 *
 * As referências que o Davi mandou não são cores chapadas: são
 * MATERIAIS. Quatro têm a mesma trama fina de plástico (a cara de uma
 * peça impressa, vista de perto) e uma é metálica, com brilho e
 * partículas. Este módulo produz as duas superfícies e resolve o
 * problema que estava no caminho: **as malhas do núcleo não têm UV**
 * (elas nascem para virar STL, onde UV não existe).
 *
 * A saída é: mapas de relevo/rugosidade gerados por código (nenhum
 * arquivo binário no repo, nenhuma dúvida de licença de textura de
 * terceiro, e o padrão fica ajustável) + um assamento de UV por
 * triângulo que dá densidade constante em qualquer forma e tamanho.
 */

import * as THREE from "three";
import type { AcabamentoBloco } from "@per-parte/nucleo";

/**
 * Quantas vezes a textura se repete por unidade da cena (1 unidade =
 * 100 mm). Com 16 células por repetição, dá célula de ~1 mm — a escala
 * da trama nas referências. ⚑ ajustável a olho no impresso.
 */
/**
 * ⚑ Recalibrado em 08/08 (rodada dos cenários): a trama de ~1 mm virava
 * MOIRÉ à distância da câmera — numa foto real ela nem seria visível.
 * Célula de ~2,5 mm com relevo mais suave lê como plástico impresso sem
 * virar padrão de interferência.
 */
const REPETICOES_POR_UNIDADE = 4;

/** Lado do mapa gerado, em pixels. */
const LADO_PX = 256;

// ---------------------------------------------------------------------------
// Assamento de UV
// ---------------------------------------------------------------------------

/**
 * Dá UV a uma geometria SEM UV, projetando cada triângulo pelo eixo em
 * que a normal dele é dominante (as outras duas coordenadas viram u, v).
 *
 * Por que assim: a geometria já vem NÃO indexada de `toCreasedNormals`,
 * então cada triângulo tem vértices próprios e pode receber a projeção
 * que lhe convém — sem costura de "volta ao zero" (que uma projeção
 * cilíndrica teria) e sem esticar a textura na face de um corte da
 * ferramenta Fatiar (que uma projeção esférica teria). Como o u,v sai
 * direto da posição em unidades da cena, a densidade da trama é a mesma
 * numa esfera de 4 cm e num cubo de 20 cm — é a peça que é grande, a
 * textura da superfície não.
 */
export function assarUVsPorTriangulo(
  geo: THREE.BufferGeometry,
  repeticoesPorUnidade = REPETICOES_POR_UNIDADE
): void {
  const pos = geo.getAttribute("position");
  if (!pos || geo.getIndex()) return;
  const nTri = pos.count / 3;
  const uv = new Float32Array(pos.count * 2);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let t = 0; t < nTri; t++) {
    const i0 = t * 3;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i0 + 1);
    c.fromBufferAttribute(pos, i0 + 2);
    normal.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    const ax = Math.abs(normal.x);
    const ay = Math.abs(normal.y);
    const az = Math.abs(normal.z);
    // Eixo dominante da normal → o par de coordenadas que vira (u, v).
    const eixo = ax > ay && ax > az ? 0 : ay > az ? 1 : 2;
    for (let k = 0; k < 3; k++) {
      const v = k === 0 ? a : k === 1 ? b : c;
      // A SEGUNDA coordenada é sempre o eixo vertical do núcleo (z) nas
      // faces laterais: é o que deixa as LINHAS DE CAMADA da textura
      // horizontais em toda a lateral, como numa peça impressa real.
      const u = eixo === 0 ? v.y : v.x;
      const w = eixo === 2 ? v.y : v.z;
      uv[(i0 + k) * 2] = u * repeticoesPorUnidade;
      uv[(i0 + k) * 2 + 1] = w * repeticoesPorUnidade;
    }
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

// ---------------------------------------------------------------------------
// Mapas gerados por código
// ---------------------------------------------------------------------------

function telaVazia(): CanvasRenderingContext2D {
  const tela = document.createElement("canvas");
  tela.width = LADO_PX;
  tela.height = LADO_PX;
  return tela.getContext("2d")!;
}

function comoTextura(
  ctx: CanvasRenderingContext2D,
  espacoDeCor?: THREE.ColorSpace
): THREE.CanvasTexture {
  const textura = new THREE.CanvasTexture(ctx.canvas);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.anisotropy = 8;
  if (espacoDeCor) textura.colorSpace = espacoDeCor;
  return textura;
}

/** Converte um campo de altura em mapa de normais (Sobel simples). */
function alturaParaNormal(altura: Float32Array, forca: number): THREE.CanvasTexture {
  const ctx = telaVazia();
  const img = ctx.createImageData(LADO_PX, LADO_PX);
  const em = (x: number, y: number) =>
    altura[((y + LADO_PX) % LADO_PX) * LADO_PX + ((x + LADO_PX) % LADO_PX)];
  for (let y = 0; y < LADO_PX; y++) {
    for (let x = 0; x < LADO_PX; x++) {
      const dx = (em(x + 1, y) - em(x - 1, y)) * forca;
      const dy = (em(x, y + 1) - em(x, y - 1)) * forca;
      // Normal tangente: (-dx, -dy, 1) normalizada, em 0–255.
      const inv = 1 / Math.hypot(dx, dy, 1);
      const o = (y * LADO_PX + x) * 4;
      img.data[o] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      img.data[o + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      img.data[o + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return comoTextura(ctx);
}

/**
 * LINHAS DE CAMADA da impressão (1D, horizontais): é o que uma peça FDM
 * tem de verdade — a grade xadrez anterior virava moiré e lia como "UV
 * checker esquecido" (crítica visual de 08/08). A amplitude ondula com
 * um ruído lento, porque camada real nunca é perfeitamente regular.
 */
function gerarTramaNormal(): THREE.CanvasTexture {
  const LINHAS = 40; // ~0,6 mm visual por camada ⚑ (0,2 real viraria moiré)
  const altura = new Float32Array(LADO_PX * LADO_PX);
  for (let y = 0; y < LADO_PX; y++) {
    for (let x = 0; x < LADO_PX; x++) {
      const fase = Math.sin(x * 0.045) * 0.7;
      const onda = Math.sin(((y + fase) / LADO_PX) * Math.PI * 2 * LINHAS);
      const variacao =
        0.75 + 0.25 * Math.sin(x * 0.021 + y * 0.007 + Math.sin(y * 0.05));
      const grao =
        (((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) - 0.5) * 0.1;
      altura[y * LADO_PX + x] = 0.5 + 0.5 * onda * variacao + grao;
    }
  }
  return alturaParaNormal(altura, 1.1);
}

/** Rugosidade do fosco: manchas lentas — nenhuma superfície real é
 * uniforme, e é a variação que devolve "matéria" ao plástico. */
let foscoRugosidade: THREE.CanvasTexture | null = null;
function gerarFoscoRugosidade(): THREE.CanvasTexture {
  const ctx = telaVazia();
  const img = ctx.createImageData(LADO_PX, LADO_PX);
  for (let y = 0; y < LADO_PX; y++) {
    for (let x = 0; x < LADO_PX; x++) {
      const mancha =
        Math.sin(x * 0.037 + Math.sin(y * 0.049) * 2) *
        Math.sin(y * 0.031 + Math.sin(x * 0.043) * 2);
      const v = 225 + mancha * 16;
      const o = (y * LADO_PX + x) * 4;
      img.data[o] = v;
      img.data[o + 1] = v;
      img.data[o + 2] = v;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return comoTextura(ctx);
}

/**
 * Metálico: facetas minúsculas e aleatórias — são elas que produzem o
 * cintilar da esfera roxa quando a luz corre pela peça.
 */
function gerarGlitterNormal(): THREE.CanvasTexture {
  const altura = new Float32Array(LADO_PX * LADO_PX);
  let semente = 1;
  const aleatorio = () => {
    semente = (semente * 1664525 + 1013904223) % 4294967296;
    return semente / 4294967296;
  };
  for (let i = 0; i < altura.length; i++) altura[i] = aleatorio() * 0.35;
  // Poucas partículas grandes por cima do grão fino.
  for (let k = 0; k < 900; k++) {
    const cx = Math.floor(aleatorio() * LADO_PX);
    const cy = Math.floor(aleatorio() * LADO_PX);
    const r = 1 + Math.floor(aleatorio() * 2);
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (Math.hypot(x, y) > r) continue;
        const px = (cx + x + LADO_PX) % LADO_PX;
        const py = (cy + y + LADO_PX) % LADO_PX;
        altura[py * LADO_PX + px] = 1;
      }
    }
  }
  return alturaParaNormal(altura, 1.1);
}

/** Rugosidade salpicada: as partículas do metálico brilham, o resto não. */
function gerarGlitterRugosidade(): THREE.CanvasTexture {
  const ctx = telaVazia();
  const img = ctx.createImageData(LADO_PX, LADO_PX);
  let semente = 7;
  const aleatorio = () => {
    semente = (semente * 1664525 + 1013904223) % 4294967296;
    return semente / 4294967296;
  };
  for (let i = 0; i < LADO_PX * LADO_PX; i++) {
    // Base acetinada com pontos bem lisos espalhados (as partículas).
    const v = aleatorio() < 0.04 ? 20 : 90 + Math.floor(aleatorio() * 40);
    const o = i * 4;
    img.data[o] = v;
    img.data[o + 1] = v;
    img.data[o + 2] = v;
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return comoTextura(ctx);
}

// Um jogo de mapas para a página inteira (são iguais para toda peça).
let tramaNormal: THREE.CanvasTexture | null = null;
let glitterNormal: THREE.CanvasTexture | null = null;
let glitterRugosidade: THREE.CanvasTexture | null = null;

export interface SuperficieBloco {
  normalMap: THREE.Texture;
  normalScale: THREE.Vector2;
  roughness: number;
  roughnessMap: THREE.Texture | null;
  metalness: number;
  envMapIntensity: number;
  /** Brilho rasante de tecido/plástico fosco (PLA tem, e as fotos mostram). */
  sheen: number;
  sheenRoughness: number;
  /** Verniz do filamento metálico (a esfera de referência é envernizada). */
  clearcoat: number;
  clearcoatRoughness: number;
}

/** Os parâmetros de superfície de um acabamento (mapas em cache). */
export function superficieDoAcabamento(
  acabamento: AcabamentoBloco
): SuperficieBloco {
  if (acabamento === "metalico") {
    glitterNormal ??= gerarGlitterNormal();
    glitterRugosidade ??= gerarGlitterRugosidade();
    return {
      normalMap: glitterNormal,
      normalScale: new THREE.Vector2(0.16, 0.16),
      roughness: 0.32,
      roughnessMap: glitterRugosidade,
      metalness: 0.55,
      // O metálico VIVE do reflexo: o envMap dele é a sala procedural.
      envMapIntensity: 1.0,
      sheen: 0,
      sheenRoughness: 1,
      clearcoat: 0.55,
      clearcoatRoughness: 0.25,
    };
  }
  tramaNormal ??= gerarTramaNormal();
  foscoRugosidade ??= gerarFoscoRugosidade();
  return {
    normalMap: tramaNormal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughness: 0.88,
    roughnessMap: foscoRugosidade,
    metalness: 0,
    // O fosco não recebe envMap nenhum (ver useAmbienteMetalico): fica
    // só com as luzes, e a cor sai verdadeira. Este valor só existe
    // porque o campo é obrigatório no tipo.
    envMapIntensity: 1,
    // O falloff aveludado do PLA fosco nas bordas — sem ele a peça lê
    // como render porque plástico real nunca apaga na luz rasante.
    sheen: 0.35,
    sheenRoughness: 0.85,
    clearcoat: 0,
    clearcoatRoughness: 1,
  };
}

/**
 * Fundo CSS de uma amostra de cor no painel — o metálico ganha o
 * gradiente que denuncia o brilho, para a escolha não parecer só "mais
 * uma cor roxa" numa grade de quadrados chapados.
 */
export function fundoDaAmostra(
  hex: string,
  acabamento: AcabamentoBloco
): string {
  if (acabamento !== "metalico") return hex;
  return `linear-gradient(135deg, ${hex} 0%, #FFFFFF 26%, ${hex} 52%, #000000A0 100%)`;
}
