/**
 * Montagem v2 · F2 — malhas do núcleo viram BufferGeometry (mesma
 * convenção do Cena3D: mm ÷ 100, Z do núcleo vira Y da cena via grupo
 * rotacionado) e miniaturas da grade de variações renderizadas pelo
 * PRÓPRIO motor (um renderer offscreen, cache por forma×variação).
 */

import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  VARIACOES_BLOCO,
  blocoDaVariacao,
  gerarMalhaBloco,
  gerarMalhaPontoDeLuz,
  type FormaBloco,
  type Malha,
  type ParametrosBloco,
} from "@per-parte/nucleo";

/** Mesma escala do configurador atual: 100 mm = 1 unidade da cena. */
export const MM = 100;

/**
 * Ângulo a partir do qual uma aresta é VIVA no preview. Abaixo dele as
 * facetas se fundem (a lateral de um cilindro de 192 colunas continua
 * lisa, o arco da borda continua liso); acima, a aresta fica crisp — a
 * quina do cubo, a face de um corte da ferramenta Fatiar. Sem isso a
 * normal média de vértice espalha o sombreado da tampa do corte pela
 * parede e a peça aparece listrada.
 */
const ANGULO_ARESTA_VIVA = Math.PI / 6;

export function geometriaDaMalha(m: Malha): THREE.BufferGeometry {
  const pos = new Float32Array(m.posicoes.length);
  for (let i = 0; i < m.posicoes.length; i++) pos[i] = m.posicoes[i] / MM;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(m.indices, 1));
  // toCreasedNormals devolve geometria NÃO indexada (é o que permite
  // normal própria por face na aresta viva). Só o preview usa isto — o
  // STL de produção sai da malha indexada do núcleo, intacta.
  const comArestas = toCreasedNormals(g, ANGULO_ARESTA_VIVA);
  g.dispose();
  return comArestas;
}

/**
 * Malha (geometria) de um bloco — preview usa menos segmentos que STL.
 * `gerarMalhaBloco` já entrega a peça com borda encurvada e fatiada.
 */
export function geometriaDoBloco(params: ParametrosBloco): THREE.BufferGeometry {
  return geometriaDaMalha(gerarMalhaBloco(params, 48));
}

/** As duas geometrias do ponto de luz (base opaca + bulbo emissivo). */
export function geometriasDoPontoDeLuz(): {
  base: THREE.BufferGeometry;
  bulbo: THREE.BufferGeometry;
} {
  const malhas = gerarMalhaPontoDeLuz(32);
  return {
    base: geometriaDaMalha(malhas.base),
    bulbo: geometriaDaMalha(malhas.bulbo),
  };
}

// ---------------------------------------------------------------------------
// Miniaturas da grade (espec §4: "miniaturas renderizadas" pelo motor).
// ---------------------------------------------------------------------------

const TAM_MINIATURA = 128;
const cacheMiniaturas = new Map<string, string>();
let rendererMiniaturas: THREE.WebGLRenderer | null = null;

function rendererOffscreen(): THREE.WebGLRenderer {
  if (!rendererMiniaturas) {
    rendererMiniaturas = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    rendererMiniaturas.setSize(TAM_MINIATURA, TAM_MINIATURA);
  }
  return rendererMiniaturas;
}

/**
 * Data-URL da miniatura de uma variação numa forma. Renderiza uma vez e
 * cacheia (32 combinações no total — barato e fiel ao que entra na cena).
 */
export function miniaturaDataUrl(forma: FormaBloco, variacaoId: string): string {
  const chave = `${forma}:${variacaoId}`;
  const pronta = cacheMiniaturas.get(chave);
  if (pronta) return pronta;

  const variacao = VARIACOES_BLOCO.find((v) => v.id === variacaoId);
  if (!variacao) return "";
  const params = blocoDaVariacao(variacao, forma);
  const geometria = geometriaDoBloco({ ...params, tamanhoMm: 100 });

  const cena = new THREE.Scene();
  const grupo = new THREE.Group();
  grupo.rotation.x = -Math.PI / 2;
  const material = new THREE.MeshStandardMaterial({
    color: "#E4DCCB",
    roughness: 0.55,
    metalness: 0,
  });
  const malha = new THREE.Mesh(geometria, material);
  grupo.add(malha);
  // Centraliza na altura (base em z = 0 no núcleo).
  const alturaCena = (params.tamanhoMm * params.escalaAltura) / MM;
  grupo.position.y = -alturaCena / 2;
  cena.add(grupo);
  cena.add(new THREE.AmbientLight("#ffffff", 0.9));
  const chaveLuz = new THREE.DirectionalLight("#ffffff", 1.6);
  chaveLuz.position.set(2, 3, 4);
  cena.add(chaveLuz);
  const contraLuz = new THREE.DirectionalLight("#dfe8f0", 0.5);
  contraLuz.position.set(-3, 1, -2);
  cena.add(contraLuz);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  camera.position.set(1.6, 1.1, 2.2);
  camera.lookAt(0, 0, 0);

  const renderer = rendererOffscreen();
  renderer.render(cena, camera);
  const url = renderer.domElement.toDataURL("image/png");

  geometria.dispose();
  material.dispose();
  cacheMiniaturas.set(chave, url);
  return url;
}
