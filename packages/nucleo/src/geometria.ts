/**
 * Geometria paramétrica do arquétipo de revolução — base, corpo e difusor.
 *
 * TypeScript puro e determinístico, sem dependência de Three.js: o mesmo
 * perfil que desenha o preview no navegador gera a malha de produção (STL).
 *
 * Toda parte é um perfil 2D (meridiano raio × altura, do eixo embaixo ao
 * eixo em cima) revolucionado. O corpo pode ainda curvar a própria ESPINHA
 * (deslocamento lateral em S, com as pontas sempre verticais) — os encaixes
 * continuam horizontais e padronizados (F5), e a inclinação da espinha fica
 * dentro do balanço imprimível (F4).
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
  /** Gomos verticais esculpidos ao redor (0 = liso). */
  gomos: number;
  /** Profundidade dos gomos, em mm — só esculpem para dentro. */
  profundidadeGomosMm: number;
  /** Giro dos gomos da base ao topo, em graus (espiral). */
  torcaoGraus: number;
  /** Espinha: deslocamento lateral do topo, em mm (corpo em S). */
  deslocamentoMm: number;
  /** Espinha: onde a dobra acontece, -1 (baixo) a +1 (alto). */
  posicaoDobra: number;
  /**
   * Silhueta livre (modo avançado): 5 raios de controle em
   * t = 0,1 / 0,3 / 0,5 / 0,7 / 0,9. Quando presente, substitui
   * bojo/posição/ondulação; gomos e espinha continuam valendo.
   */
  perfilLivre?: number[];
}

export interface ParametrosDifusor {
  forma: FormaDifusor;
  alturaMm: number;
  raioMm: number;
  /** Gomos verticais (plissê) ao redor (0 = liso). */
  gomos: number;
  /** Profundidade dos gomos, em mm. */
  profundidadeGomosMm: number;
}

export interface AnelEncaixe {
  externoMm: number;
  internoMm: number;
  alturaMm: number;
}

/** Espinha curva do corpo (para a malha e para a cena). */
export interface EspinhaLateral {
  deslocamentoMm: number;
  posicaoDobra: number;
  alturaMm: number;
}

const RA = ENCAIXES.baseCorpo.raioMm;
const RB = ENCAIXES.corpoDifusor.raioMm;

/** Raio mínimo de qualquer ponto do perfil (fecha o sólido sem degenerar). */
const RAIO_EIXO_MM = 0.6;

/** Posições (t) dos 5 raios de controle da silhueta livre. */
export const TS_PERFIL_LIVRE = [0.1, 0.3, 0.5, 0.7, 0.9] as const;

/**
 * Deslocamento lateral máximo da espinha para uma dada altura — derivado de
 * F4: com a dobra em S a inclinação de pico é ~1,5·d/(0,7·h), e reservamos
 * margem para a inclinação do próprio perfil. ⚑ validar impresso.
 */
export function deslocamentoMaximoMm(alturaMm: number): number {
  return Math.min(80, Math.round(0.22 * alturaMm));
}

/** Fator 0→1 da dobra em S (pontas com tangente vertical). */
function fatorEspinha(t: number, posicaoDobra: number): number {
  const u = Math.min(1, Math.max(0, t));
  const k = Math.pow(2, Math.min(1, Math.max(-1, posicaoDobra)));
  const v = Math.pow(u, k);
  return v * v * (3 - 2 * v);
}

/** Deslocamento X do eixo do corpo numa altura y, em mm. */
export function deslocamentoEspinhaMm(
  yMm: number,
  espinha: EspinhaLateral
): number {
  if (!espinha.deslocamentoMm || espinha.alturaMm <= 0) return 0;
  const d = Math.min(
    Math.abs(espinha.deslocamentoMm),
    deslocamentoMaximoMm(espinha.alturaMm)
  );
  return (
    Math.sign(espinha.deslocamentoMm) *
    d *
    fatorEspinha(yMm / espinha.alturaMm, espinha.posicaoDobra)
  );
}

/**
 * Anel macho no topo de uma peça (a face superior fica em `y`).
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
 * `comMacho` = false gera a base sem o anel central (usada na base dupla,
 * que recebe pastilhas de encaixe nas duas posições).
 */
export function perfilBase(
  p: ParametrosBase,
  escala = 1,
  comMacho = true
): Ponto2D[] {
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
  if (comMacho) pontos.push(...pontosMacho(ENCAIXES.baseCorpo.anel, h));
  else pontos.push({ x: RAIO_EIXO_MM, y: h });
  return pontos;
}

/** Catmull-Rom 1D com extremos presos, para a silhueta livre. */
function interpolarCatmull(ts: number[], vs: number[], u: number): number {
  let i = ts.length - 2;
  for (let k = 0; k < ts.length - 1; k++) {
    if (u >= ts[k] && u <= ts[k + 1]) {
      i = k;
      break;
    }
  }
  if (u < ts[0]) i = 0;
  const x = (u - ts[i]) / (ts[i + 1] - ts[i]);
  const p1 = vs[i];
  const p2 = vs[i + 1];
  const p0 = i > 0 ? vs[i - 1] : p1;
  const p3 = i + 2 < vs.length ? vs[i + 2] : p2;
  return (
    0.5 *
    (2 * p1 +
      (p2 - p0) * x +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * x * x +
      (-p0 + 3 * p1 - 3 * p2 + p3) * x * x * x)
  );
}

/**
 * Perfil do corpo. Fêmea embaixo, macho em cima. No modo silhueta livre os
 * raios de controle passam por uma CASCATA DE CLAMPS: miolo elétrico, pé da
 * canaleta e inclinação máxima F4 (reduzida quando a espinha está curvada) —
 * arrastar além do permitido só "encosta" no limite, nunca dá erro.
 */
export function perfilCorpo(
  p: ParametrosCorpo,
  folgaMm = ENCAIXES.folgaPadraoMm
): Ponto2D[] {
  const { alturaMm: h } = p;
  const anelBase = ENCAIXES.baseCorpo.anel;
  const alturaFemea = anelBase.alturaMm + ENCAIXES.folgaProfundidadeMm;
  const raioPeMm =
    anelBase.externoMm + folgaMm + REGRAS.F.paredeEstruturalMm.min;

  const n = 56;
  const livre =
    p.perfilLivre && p.perfilLivre.length === TS_PERFIL_LIVRE.length
      ? p.perfilLivre
      : null;

  const raios: number[] = [];
  if (livre) {
    const ts = [0, ...TS_PERFIL_LIVRE, 1];
    const vs = [RA, ...livre, RB];
    for (let i = 0; i <= n; i++) raios.push(interpolarCatmull(ts, vs, i / n));
  } else {
    const k = Math.pow(2, -p.posicaoBojo * 1.2);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      let rr = RA + (RB - RA) * u;
      rr += p.volumeBojoMm * Math.sin(Math.PI * Math.pow(u, k));
      rr += p.amplitudeOndaMm * Math.sin(u * p.ondulacao * Math.PI * 2);
      raios.push(rr);
    }
  }

  // Cascata de clamps (na ordem: piso físico, depois inclinação F4).
  const dY = h / n;
  const dNorm = Math.min(
    Math.abs(p.deslocamentoMm ?? 0),
    deslocamentoMaximoMm(h)
  );
  const tanMax = Math.max(
    0.25,
    Math.tan((REGRAS.F.balancoMaximoGraus * Math.PI) / 180) -
      (1.5 * dNorm) / (0.7 * h)
  );
  for (let i = 0; i <= n; i++) {
    raios[i] = Math.max(raios[i], RAIO_LIVRE_MIOLO_MM);
    if (i * dY < alturaFemea + 1) raios[i] = Math.max(raios[i], raioPeMm);
  }
  if (livre) {
    for (let i = 1; i <= n; i++) {
      raios[i] = Math.min(
        Math.max(raios[i], raios[i - 1] - tanMax * dY),
        raios[i - 1] + tanMax * dY
      );
    }
    for (let i = n - 1; i >= 0; i--) {
      raios[i] = Math.min(
        Math.max(raios[i], raios[i + 1] - tanMax * dY),
        raios[i + 1] + tanMax * dY
      );
      raios[i] = Math.max(raios[i], RAIO_LIVRE_MIOLO_MM);
      if (i * dY < alturaFemea + 1) raios[i] = Math.max(raios[i], raioPeMm);
    }
  }

  const pontos = pontosFemea(anelBase, folgaMm);
  for (let i = 0; i <= n; i++) pontos.push({ x: raios[i], y: i * dY });
  pontos.push(...pontosMacho(ENCAIXES.corpoDifusor.anel, h));
  return pontos;
}

/** Raios da silhueta atual nos 5 pontos de controle (para iniciar o editor). */
export function amostrarRaiosCorpo(p: ParametrosCorpo): number[] {
  const semLivre = { ...p, perfilLivre: undefined };
  const perfil = perfilCorpo(semLivre);
  const lateral = perfil.filter(
    (q) => q.y >= 0 && q.y <= p.alturaMm && q.x >= RAIO_LIVRE_MIOLO_MM - 0.01
  );
  return TS_PERFIL_LIVRE.map((t) => {
    const alvo = t * p.alturaMm;
    let melhor = lateral[0];
    for (const q of lateral) {
      if (Math.abs(q.y - alvo) < Math.abs(melhor.y - alvo)) melhor = q;
    }
    return Math.round(melhor.x * 2) / 2;
  });
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
