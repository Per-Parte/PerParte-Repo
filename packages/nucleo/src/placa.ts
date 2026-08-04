/**
 * PLACA — o primeiro arquétipo fora da revolução vertical: um disco raso
 * (prato) girado em eixo HORIZONTAL, montado num pescoço com a fêmea
 * base↔corpo (F5). É a peça do gesto "eclipse" (Noah da Gantri): a esfera
 * difusora na frente, o disco refletor atrás, levemente inclinado.
 *
 * Como entra na arquitetura sem quebrar nada:
 * — o disco É um sólido de revolução (em torno do próprio eixo, deitado):
 *   a malha nasce da MESMA malhaRevolucao de sempre e depois gira;
 * — a montagem usa o mecanismo da base dupla que já existe (prato sem
 *   macho + pastilhas): coluna 1 = luz, coluna 2 = placa;
 * — a placa é TERMINAL: fêmea embaixo, nada empilha sobre ela.
 *
 * Produção ⚑: imprime com o disco deitado na mesa (chato, sem suporte);
 * o pescoço sobe quase perpendicular (90° − inclinação ≥ 72°, dentro de
 * F4), mas a canaleta fêmea sai inclinada — validar impresso com o kit.
 */

import {
  malhaRevolucao,
  rotacionarMalhaEmY,
  transladarMalha,
  unirMalhas,
  type Malha,
} from "./malha";
import { pontosFemea, type Ponto2D } from "./geometria";
import { ENCAIXES, REGRAS } from "./regras";

export interface ParametrosPlaca {
  /** Raio do disco, em mm. */
  raioMm: number;
  /** Concavidade da face da frente (para a esfera), em mm. */
  concavidadeMm: number;
  /** Inclinação para trás, em graus da vertical. */
  inclinacaoGraus: number;
  /** Altura do pescoço (da fêmea ao começo do disco), em mm. */
  pescocoMm: number;
}

export const LIMITES_PLACA = {
  /** Ø máx. 240 mm: o disco imprime deitado e cabe no F1 (250). */
  raioMm: { min: 80, max: 120, passo: 2.5 },
  concavidadeMm: { min: 0, max: 8, passo: 0.5 },
  /** ⚑ teto provisório: acima disso o CG do disco foge do prato. */
  inclinacaoGraus: { min: 0, max: 18, passo: 1 },
  pescocoMm: { min: 20, max: 60, passo: 2 },
} as const;

export const PLACA_PADRAO: ParametrosPlaca = {
  raioMm: 115,
  concavidadeMm: 5,
  inclinacaoGraus: 12,
  pescocoMm: 26,
};

/** Espessura do disco na borda, em mm (constante da v1). */
const ESPESSURA_MM = 12;
/** Quanto a borda de baixo do disco afunda no pescoço (funde na malha). */
const AFUNDA_MM = 10;
/** Raio do topo do pescoço — cobre a espessura do disco na junção. */
const RAIO_TOPO_PESCOCO_MM = 16;

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

export function grampearPlaca(v: unknown): ParametrosPlaca {
  const bruto = (v && typeof v === "object" ? v : {}) as
    Partial<ParametrosPlaca>;
  const L = LIMITES_PLACA;
  const num = (x: unknown, padrao: number) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : padrao;
  };
  return {
    raioMm: clamp(
      num(bruto.raioMm, PLACA_PADRAO.raioMm),
      L.raioMm.min,
      L.raioMm.max
    ),
    concavidadeMm: clamp(
      num(bruto.concavidadeMm, PLACA_PADRAO.concavidadeMm),
      L.concavidadeMm.min,
      L.concavidadeMm.max
    ),
    inclinacaoGraus: clamp(
      num(bruto.inclinacaoGraus, PLACA_PADRAO.inclinacaoGraus),
      L.inclinacaoGraus.min,
      L.inclinacaoGraus.max
    ),
    pescocoMm: clamp(
      num(bruto.pescocoMm, PLACA_PADRAO.pescocoMm),
      L.pescocoMm.min,
      L.pescocoMm.max
    ),
  };
}

/**
 * Perfil do disco (meridiano raio × espessura, girado no eixo do próprio
 * disco): costas planas em y = 0, frente com concavidade — o centro recua,
 * a borda avança. Sempre sobra parede ≥ F2 no centro.
 */
export function perfilDisco(p: ParametrosPlaca): Ponto2D[] {
  const R = p.raioMm;
  const c = Math.min(
    p.concavidadeMm,
    ESPESSURA_MM - REGRAS.F.paredeEstruturalMm.min - 1
  );
  const eixo = 0.6;
  const pontos: Ponto2D[] = [
    { x: eixo, y: 0 },
    { x: R, y: 0 },
  ];
  // Frente, da borda ao centro: y(r) = espessura − c·(1 − (r/R)²).
  const n = 20;
  for (let i = 0; i <= n; i++) {
    const r = R - (R - eixo) * (i / n);
    const u = r / R;
    pontos.push({ x: r, y: ESPESSURA_MM - c * (1 - u * u) });
  }
  return pontos;
}

/** Perfil do pescoço: fêmea F5 embaixo, coluna que afina até o topo. */
export function perfilPescoco(
  p: ParametrosPlaca,
  folgaMm = ENCAIXES.folgaPadraoMm
): Ponto2D[] {
  const anel = ENCAIXES.baseCorpo.anel;
  const raioPeMm = anel.externoMm + folgaMm + REGRAS.F.paredeEstruturalMm.min;
  const h = p.pescocoMm + AFUNDA_MM;
  const pontos = pontosFemea(anel, folgaMm);
  const alturaFemea = anel.alturaMm + ENCAIXES.folgaProfundidadeMm;
  pontos.push({ x: raioPeMm, y: 0 });
  pontos.push({ x: raioPeMm, y: alturaFemea + 2 });
  // Afunila do pé para o topo (sempre para dentro: F4 de graça).
  const n = 12;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const r =
      raioPeMm + (RAIO_TOPO_PESCOCO_MM - raioPeMm) * Math.pow(u, 0.8);
    pontos.push({ x: r, y: alturaFemea + 2 + (h - alturaFemea - 2) * u });
  }
  pontos.push({ x: 0.6, y: h });
  return pontos;
}

/**
 * A malha completa da placa (pescoço + disco), pronta para preview e STL.
 * O disco gira (90° − inclinação) em Y: a face da frente aponta +X (para a
 * esfera) e o topo pende para trás (−X). O ponto mais baixo da borda cai
 * no eixo da montagem, AFUNDA_MM dentro do topo do pescoço — os dois
 * sólidos se fundem no fatiamento, como as pastilhas da base dupla.
 */
export function malhaPlaca(p: ParametrosPlaca, segmentos: number): Malha {
  const rad = ((90 - p.inclinacaoGraus) * Math.PI) / 180;
  const disco = rotacionarMalhaEmY(malhaRevolucao(perfilDisco(p), segmentos), rad);
  const cosI = Math.cos((p.inclinacaoGraus * Math.PI) / 180);
  const sinI = Math.sin((p.inclinacaoGraus * Math.PI) / 180);
  // Ponto mais baixo da borda (relativo ao centro): (R·sin i, 0, −R·cos i).
  // Centro = (0, 0, pescoço) − esse ponto.
  const xCentro = -p.raioMm * sinI;
  const zCentro = p.pescocoMm + p.raioMm * cosI;
  return unirMalhas(
    malhaRevolucao(perfilPescoco(p), segmentos),
    transladarMalha(disco, xCentro, 0, zCentro)
  );
}

/**
 * Perfis para a estimativa de peso (casca fina): o disco pesa como área
 * lateral × espessura típica de base; o pescoço é pequeno.
 */
export function perfisPlacaParaPeso(p: ParametrosPlaca): Ponto2D[][] {
  return [perfilDisco(p), perfilPescoco(p)];
}
