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
const REPETICOES_POR_UNIDADE = 6;

/** Lado do mapa gerado, em pixels, e quantas células ele contém. */
const LADO_PX = 256;
const CELULAS = 16;

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
      const u = eixo === 0 ? v.z : v.x;
      const w = eixo === 1 ? v.z : v.y;
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
 * Trama do plástico: células levemente abauladas separadas por sulcos —
 * o mesmo desenho das quatro esferas foscas de referência.
 */
function gerarTramaNormal(): THREE.CanvasTexture {
  const passo = LADO_PX / CELULAS;
  const altura = new Float32Array(LADO_PX * LADO_PX);
  for (let y = 0; y < LADO_PX; y++) {
    for (let x = 0; x < LADO_PX; x++) {
      // Distância ao centro da célula, em [0, 1] por eixo.
      const u = Math.abs(((x % passo) / passo) * 2 - 1);
      const v = Math.abs(((y % passo) / passo) * 2 - 1);
      const borda = Math.max(u, v);
      // Platô no meio, sulco suave na divisa das células.
      const h = 1 - Math.pow(borda, 6);
      // Grão fino por cima: nenhuma peça impressa é lisa de verdade.
      const grao = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) * 0.12;
      altura[y * LADO_PX + x] = h + grao;
    }
  }
  return alturaParaNormal(altura, 2.2);
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
      normalScale: new THREE.Vector2(0.22, 0.22),
      roughness: 0.32,
      roughnessMap: glitterRugosidade,
      metalness: 0.55,
      // O metálico VIVE do reflexo: o envMap dele é a sala procedural.
      envMapIntensity: 1.0,
    };
  }
  tramaNormal ??= gerarTramaNormal();
  return {
    normalMap: tramaNormal,
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughness: 0.88,
    roughnessMap: null,
    metalness: 0,
    // O fosco não recebe envMap nenhum (ver useAmbienteMetalico): fica
    // só com as luzes, e a cor sai verdadeira. Este valor só existe
    // porque o campo é obrigatório no tipo.
    envMapIntensity: 1,
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
