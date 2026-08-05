/**
 * Manipulação direta v1 — matemática pura dos gestos (§5.1 da spec).
 *
 * Sem React: planos de arrasto, conversões delta de tela → delta de valor,
 * regiões do corpo, trava de eixo, ganhos angulares e a régua da pilha.
 * Quem chama é o ControladorGestos; quem aplica o valor é o dirigir().
 */

import * as THREE from "three";

/** Escala da cena: 1 unidade 3D = 100 mm (a mesma da Cena3D). */
export const MM = 100;

/** Zona morta da trava de eixo, em px (§5.1 — mesmo padrão do clique seco). */
export const ZONA_MORTA_PX = 6;

/** Empurrão além do limite que dispara o motivo didático, em px (§5.2). */
export const EMPURRAO_TOAST_PX = 12;

/** Ganhos angulares da tabela §5.3, em graus por pixel de ponteiro. */
export const GANHO_GRAUS_POR_PX = {
  torcao: 0.5,
  juntaInclinacao: 0.2,
  placaInclinacao: 0.15,
} as const;

/** Regiões do corpo pelo t vertical do ponto de pega (§5.3): 0 = pé, 1 = topo. */
export function regiaoCorpo(t: number): "topo" | "meio" | "pe" {
  if (t >= 0.7) return "topo";
  if (t < 0.3) return "pe";
  return "meio";
}

/** Índice do ponto da silhueta livre para um t de pega (§5.3). */
export function indicePerfilLivre(t: number): number {
  return Math.min(4, Math.max(0, Math.round((t - 0.1) / 0.2)));
}

/**
 * Trava de eixo (§5.1): zona morta de 6 px; o eixo dominante do primeiro
 * movimento maior que ela trava o gesto até o pointerup.
 */
export function eixoDominante(
  dxPx: number,
  dyPx: number,
  zonaMortaPx = ZONA_MORTA_PX
): "h" | "v" | null {
  if (Math.hypot(dxPx, dyPx) <= zonaMortaPx) return null;
  return Math.abs(dxPx) >= Math.abs(dyPx) ? "h" : "v";
}

/**
 * Plano de arrasto VERTICAL (§5.1): contém o ponto de pega, com normal =
 * direção câmera→alvo projetada no plano XZ — o plano "de frente para a
 * câmera" que contém o eixo Y.
 */
export function planoVerticalDeArrasto(
  hit0: THREE.Vector3,
  direcaoCamera: THREE.Vector3
): THREE.Plane {
  const n = new THREE.Vector3(-direcaoCamera.x, 0, -direcaoCamera.z);
  if (n.lengthSq() < 1e-6) n.set(0, 0, 1);
  n.normalize();
  return new THREE.Plane().setFromNormalAndCoplanarPoint(n, hit0);
}

/** Plano de arrasto HORIZONTAL (§5.1): y = y do ponto de pega. */
export function planoHorizontalDeArrasto(hit0: THREE.Vector3): THREE.Plane {
  return new THREE.Plane().setFromNormalAndCoplanarPoint(
    new THREE.Vector3(0, 1, 0),
    hit0
  );
}

/**
 * Interseção raio × plano com guarda contra raio rasante: perto do paralelo
 * o ponto explode para o horizonte — melhor pular o quadro que tremer.
 */
export function intersecaoEstavel(
  raio: THREE.Ray,
  plano: THREE.Plane,
  saida: THREE.Vector3
): THREE.Vector3 | null {
  if (Math.abs(raio.direction.dot(plano.normal)) < 0.06) return null;
  return raio.intersectPlane(plano, saida);
}

/** Eixo vertical (§5.1): soma 1:1 em mm. */
export function deltaVerticalMm(
  hit: THREE.Vector3,
  hit0: THREE.Vector3
): number {
  return (hit.y - hit0.y) * MM;
}

/** Lateral X (§5.1): curva S, cabeça, separação — tudo vive no eixo X do mundo. */
export function deltaLateralMm(
  hit: THREE.Vector3,
  hit0: THREE.Vector3
): number {
  return (hit.x - hit0.x) * MM;
}

/** Radial (§5.1): distância ao eixo da parte (x = xColuna no mundo). */
export function deltaRadialMm(
  hit: THREE.Vector3,
  hit0: THREE.Vector3,
  eixoX: number
): number {
  return (
    (Math.hypot(hit.x - eixoX, hit.z) - Math.hypot(hit0.x - eixoX, hit0.z)) *
    MM
  );
}

/**
 * Reordenar a pilha (§5.3): onde a peça arrastada deve parar. O swap
 * acontece ao cruzar o MEIO da vizinha: o centro virtual da peça (centro
 * original + delta do dedo) é ranqueado entre os centros das outras.
 */
export function destinoNaPilha(
  alturasMm: number[],
  k0: number,
  deltaYmm: number
): number {
  if (k0 < 0 || k0 >= alturasMm.length) return k0;
  let y = 0;
  const centros = alturasMm.map((h) => {
    const c = y + h / 2;
    y += h;
    return c;
  });
  const virtual = centros[k0] + deltaYmm;
  let destino = 0;
  for (let i = 0; i < alturasMm.length; i++) {
    if (i !== k0 && centros[i] < virtual) destino++;
  }
  return destino;
}
