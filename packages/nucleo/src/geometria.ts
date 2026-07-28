/**
 * Geometria paramétrica do arquétipo de revolução — base, corpo e difusor.
 *
 * Portado do protótipo (`prototipo/configurador.html`), convertido para mm.
 * TypeScript puro e determinístico, sem dependência de Three.js: o mesmo
 * perfil que desenha o preview no navegador gera, no servidor, a malha de
 * produção (STL). "O que você viu é o que a gente imprime" é consequência
 * desta arquitetura.
 *
 * Toda parte é um perfil 2D (raio × altura) revolucionado no eixo Y.
 * As extremidades dos perfis terminam nos raios dos ENCAIXES (F5) — é isso
 * que garante que qualquer parte encaixa em qualquer outra.
 */

import { ENCAIXES, RAIO_LIVRE_MIOLO_MM } from "./regras";

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

const RA = ENCAIXES.baseCorpoRaioMm;
const RB = ENCAIXES.corpoDifusorRaioMm;

/** Raio mínimo de qualquer ponto do perfil (fecha o sólido sem degenerar). */
const RAIO_EIXO_MM = 0.6;

function amostrar(fn: (t: number) => [number, number], n: number): Ponto2D[] {
  const pontos: Ponto2D[] = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = fn(i / n);
    pontos.push({ x: Math.max(x, RAIO_EIXO_MM), y });
  }
  return pontos;
}

/**
 * Perfil da base. `escala` é o alargamento imposto pela estabilidade (E2):
 * a base cresce sozinha em vez de bloquear o cliente com um erro.
 * Termina sempre no encaixe base↔corpo (F5).
 */
export function perfilBase(p: ParametrosBase, escala = 1): Ponto2D[] {
  const r = p.raioMm * escala;
  const h = p.alturaMm;
  return amostrar((t) => {
    if (t === 0) return [RAIO_EIXO_MM, 0];
    if (t >= 1) return [RAIO_EIXO_MM, h];
    const u = (t - 0.06) / 0.88;
    if (u < 0) return [r * 0.97, 0];
    if (u > 1) return [RA, h];
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
    return [rr, u * h];
  }, 26);
}

/**
 * Perfil do corpo. Vai do encaixe base↔corpo ao encaixe corpo↔difusor (F5);
 * o miolo elétrico é um cilindro proibido que o perfil nunca invade.
 */
export function perfilCorpo(p: ParametrosCorpo): Ponto2D[] {
  const { alturaMm: h, volumeBojoMm, posicaoBojo, ondulacao, amplitudeOndaMm } =
    p;
  const k = Math.pow(2, -posicaoBojo * 1.2);
  return amostrar((t) => {
    if (t === 0) return [RAIO_EIXO_MM, 0];
    if (t >= 1) return [RAIO_EIXO_MM, h];
    const u = Math.min(Math.max((t - 0.02) / 0.96, 0), 1);
    let rr = RA + (RB - RA) * u;
    rr += volumeBojoMm * Math.sin(Math.PI * Math.pow(u, k));
    rr += amplitudeOndaMm * Math.sin(u * ondulacao * Math.PI * 2);
    rr = Math.max(rr, RAIO_LIVRE_MIOLO_MM);
    return [rr, u * h];
  }, 56);
}

/** Perfil do difusor. Nasce no encaixe corpo↔difusor (F5). */
export function perfilDifusor(p: ParametrosDifusor): Ponto2D[] {
  const { forma, alturaMm: dh, raioMm: dr } = p;
  return amostrar((t) => {
    const u = t;
    let rr: number;
    if (forma === "globo") {
      if (u >= 1) return [RAIO_EIXO_MM, dh];
      rr = RB + (dr - RB) * Math.sin(Math.PI * Math.pow(u, 0.9));
    } else if (forma === "sino") {
      rr = RB + (dr - RB) * Math.pow(u, 1.6);
    } else if (forma === "cone") {
      rr = RB + (dr - RB) * u;
    } else {
      rr = RB + (dr - RB) * Math.min(1, u * 3.2);
      if (u > 0.92) rr -= (u - 0.92) * (dr - RB);
    }
    return [rr, u * dh];
  }, 34);
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
