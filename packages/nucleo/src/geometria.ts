/**
 * Geometria paramétrica do arquétipo de revolução — base, corpo e difusor.
 *
 * TypeScript puro e determinístico, sem dependência de Three.js: o mesmo
 * perfil que desenha o preview no navegador gera a malha de produção (STL).
 *
 * Toda parte é um perfil 2D (meridiano raio × altura, do eixo embaixo ao
 * eixo em cima) revolucionado no eixo vertical. As extremidades carregam os
 * ENCAIXES (F5): a peça de baixo termina num anel macho, a de cima começa
 * numa canaleta fêmea — é isso que garante que qualquer parte encaixa em
 * qualquer outra.
 */

import { ENCAIXES, RAIO_LIVRE_MIOLO_MM, REGRAS } from "./regras";

export interface Ponto2D {
  /** Raio (distância ao eixo de revolução), em mm. */
  x: number;
  /** Altura, em mm. */
  y: number;
}

export type CurvaBase = "reta" | "cone" | "concava" | "degrau";
export type FormaDifusor = "globo" | "sino" | "cone" | "lanterna";

export interface ParametrosBase {
  alturaMm: number;
  raioMm: number;
  curva: CurvaBase;
}

export interface ParametrosCorpo {
  alturaMm: number;
  /** Barriga do perfil, em mm (negativo = cintura). */
  volumeBojoMm: number;
  /** Posição vertical do bojo: -1 (baixo) a +1 (alto). */
  posicaoBojo: number;
  /** Número de ondas horizontais ao longo da altura (0 = liso). */
  ondulacao: number;
  /** Profundidade da onda, em mm — limitada por F4 (balanço). */
  amplitudeOndaMm: number;
}

export interface ParametrosDifusor {
  forma: FormaDifusor;
  alturaMm: number;
  raioMm: number;
}

export interface AnelEncaixe {
  externoMm: number;
  internoMm: number;
  alturaMm: number;
}

const RA = ENCAIXES.baseCorpo.raioMm;
const RB = ENCAIXES.corpoDifusor.raioMm;

/** Raio mínimo de qualquer ponto do perfil (fecha o sólido sem degenerar). */
const RAIO_EIXO_MM = 0.6;

/**
 * Anel macho no topo de uma peça (a face superior fica em `y`).
 * Continua o meridiano a partir do ponto (raio da interface, y) e termina
 * no eixo, pronto para a tampa.
 */
export function pontosMacho(anel: AnelEncaixe, y: number): Ponto2D[] {
  return [
    { x: anel.externoMm, y },
    { x: anel.externoMm, y: y + anel.alturaMm },
    { x: anel.internoMm, y: y + anel.alturaMm },
    { x: anel.internoMm, y },
    { x: RAIO_EIXO_MM, y },
  ];
}

/**
 * Canaleta fêmea no fundo de uma peça (a face inferior fica em y = 0).
 * Começa o meridiano no eixo e termina na borda externa da canaleta,
 * pronto para emendar na parede lateral.
 */
export function pontosFemea(anel: AnelEncaixe, folgaMm: number): Ponto2D[] {
  const profundidade = anel.alturaMm + ENCAIXES.folgaProfundidadeMm;
  return [
    { x: RAIO_EIXO_MM, y: 0 },
    { x: anel.internoMm - folgaMm, y: 0 },
    { x: anel.internoMm - folgaMm, y: profundidade },
    { x: anel.externoMm + folgaMm, y: profundidade },
    { x: anel.externoMm + folgaMm, y: 0 },
  ];
}

/**
 * Perfil da base. `escala` é o alargamento imposto pela estabilidade (E2).
 * Termina no anel macho do encaixe base↔corpo (F5).
 */
export function perfilBase(p: ParametrosBase, escala = 1): Ponto2D[] {
  const r = p.raioMm * escala;
  const h = p.alturaMm;
  const pontos: Ponto2D[] = [{ x: RAIO_EIXO_MM, y: 0 }];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let rr: number;
    if (p.curva === "reta") rr = r - (r - RA) * Math.pow(u, 6);
    else if (p.curva === "cone") rr = r + (RA - r) * u;
    else if (p.curva === "concava") rr = RA + (r - RA) * Math.pow(1 - u, 1.7);
    else
      rr =
        u < 0.55
          ? r
          : u < 0.63
            ? r - (r - RA) * ((u - 0.55) / 0.08)
            : RA;
    pontos.push({ x: Math.max(rr, RAIO_EIXO_MM), y: u * h });
  }
  pontos.push(...pontosMacho(ENCAIXES.baseCorpo.anel, h));
  return pontos;
}

/**
 * Perfil do corpo. Fêmea embaixo (recebe a base), macho em cima (recebe o
 * difusor). O miolo elétrico é um cilindro proibido que o perfil nunca
 * invade; perto da canaleta, a parede também não afunda na fêmea.
 */
export function perfilCorpo(
  p: ParametrosCorpo,
  folgaMm = ENCAIXES.folgaPadraoMm
): Ponto2D[] {
  const { alturaMm: h, volumeBojoMm, posicaoBojo, ondulacao, amplitudeOndaMm } =
    p;
  const k = Math.pow(2, -posicaoBojo * 1.2);
  const anelBase = ENCAIXES.baseCorpo.anel;
  const alturaFemea = anelBase.alturaMm + ENCAIXES.folgaProfundidadeMm;
  // Parede mínima em volta da canaleta (F2) — o pé do corpo não pode afinar
  // a ponto de furar a fêmea.
  const raioPeMm =
    anelBase.externoMm + folgaMm + REGRAS.F.paredeEstruturalMm.min;

  const pontos = pontosFemea(anelBase, folgaMm);
  const n = 56;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let rr = RA + (RB - RA) * u;
    rr += volumeBojoMm * Math.sin(Math.PI * Math.pow(u, k));
    rr += amplitudeOndaMm * Math.sin(u * ondulacao * Math.PI * 2);
    rr = Math.max(rr, RAIO_LIVRE_MIOLO_MM);
    const y = u * h;
    if (y < alturaFemea + 1) rr = Math.max(rr, raioPeMm);
    pontos.push({ x: rr, y });
  }
  pontos.push(...pontosMacho(ENCAIXES.corpoDifusor.anel, h));
  return pontos;
}

/** Perfil do difusor. Fêmea embaixo (encaixa no topo do corpo). */
export function perfilDifusor(
  p: ParametrosDifusor,
  folgaMm = ENCAIXES.folgaPadraoMm
): Ponto2D[] {
  const { forma, alturaMm: dh, raioMm: dr } = p;
  const pontos = pontosFemea(ENCAIXES.corpoDifusor.anel, folgaMm);
  const n = 34;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let rr: number;
    if (forma === "globo") {
      if (u >= 1) {
        pontos.push({ x: RAIO_EIXO_MM, y: dh });
        continue;
      }
      rr = RB + (dr - RB) * Math.sin(Math.PI * Math.pow(u, 0.9));
    } else if (forma === "sino") {
      rr = RB + (dr - RB) * Math.pow(u, 1.6);
    } else if (forma === "cone") {
      rr = RB + (dr - RB) * u;
    } else {
      rr = RB + (dr - RB) * Math.min(1, u * 3.2);
      if (u > 0.92) rr -= (u - 0.92) * (dr - RB);
    }
    pontos.push({ x: Math.max(rr, RAIO_EIXO_MM), y: u * dh });
  }
  return pontos;
}

/** Área lateral do sólido de revolução, em mm² (insumo do peso/preço). */
export function areaLateralMm2(perfil: Ponto2D[]): number {
  let area = 0;
  for (let i = 1; i < perfil.length; i++) {
    const r = (perfil[i].x + perfil[i - 1].x) / 2;
    const ds = Math.hypot(
      perfil[i].x - perfil[i - 1].x,
      perfil[i].y - perfil[i - 1].y
    );
    area += 2 * Math.PI * r * ds;
  }
  return area;
}

/**
 * Maior ângulo de balanço do perfil, em graus da vertical.
 * Uso: validação automática (Backend) e testes — deve ser ≤ F4.
 */
export function anguloBalancoMaximoGraus(perfil: Ponto2D[]): number {
  let pior = 0;
  for (let i = 1; i < perfil.length; i++) {
    const dx = Math.abs(perfil[i].x - perfil[i - 1].x);
    const dy = perfil[i].y - perfil[i - 1].y;
    if (dy <= 0) continue;
    pior = Math.max(pior, (Math.atan2(dx, dy) * 180) / Math.PI);
  }
  return pior;
}
