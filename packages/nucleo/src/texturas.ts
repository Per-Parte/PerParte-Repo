/**
 * Famílias de textura de revolução — portadas do protótipo do Caio (03/08).
 *
 * Cada família é uma função periódica sobre (u, v): u ∈ [0,1) dá a volta
 * completa na peça, v ∈ [0,1] percorre a altura; o retorno fica em [-1, 1].
 * Duas garantias de produção:
 *
 * 1. FECHA EM 360°: todas as famílias (inclusive os ruídos) são periódicas
 *    em u — a costura da revolução nunca aparece.
 * 2. SÓ ESCULPE PARA DENTRO: o deslocamento aplicado à malha mapeia o valor
 *    para [-1, 0] — a silhueta clampada pelo perfil continua sendo o
 *    envelope externo da peça (F1/F4 do perfil não são violados por fora).
 *
 * Texturas que variam com a ALTURA (corrugado, escamas…) criam balanço
 * próprio: a parede desce e volta a cada onda. Esse custo é medido por
 * `reservaTanTextura` e descontado do orçamento F4 do PERFIL — o mesmo
 * princípio do protótipo: perfil e textura dividem o mesmo orçamento de
 * balanço, e quem chega depois encontra menos espaço. ⚑ validar impresso.
 */

export type FamiliaTextura =
  | "gomos"
  | "corrugado"
  | "amortecido"
  | "batimento"
  | "dente"
  | "escamas"
  | "plissado"
  | "torneado"
  | "trama"
  | "organico"
  | "celular";

export interface InfoFamilia {
  nome: string;
  /**
   * Quanto a família varia ao longo da altura, por repetição (coeficiente
   * `a` do protótipo): 0 = sulcos puramente verticais (não geram balanço).
   */
  coefV: number;
  /** Ciclos em torno da peça por unidade de repetição (para a malha/Nyquist). */
  coefU: number;
}

export const FAMILIAS_TEXTURA: Record<FamiliaTextura, InfoFamilia> = {
  gomos: { nome: "Gomos", coefV: 0, coefU: 1 },
  corrugado: { nome: "Anéis", coefV: 1, coefU: 0 },
  amortecido: { nome: "Anéis que somem", coefV: 1, coefU: 0 },
  batimento: { nome: "Moiré", coefV: 0, coefU: 1 },
  dente: { nome: "Dente de serra", coefV: 1, coefU: 0 },
  escamas: { nome: "Escamas", coefV: 0.55, coefU: 1 },
  plissado: { nome: "Origami", coefV: 0.78, coefU: 1 },
  torneado: { nome: "Torneado", coefV: 2.2, coefU: 0 },
  trama: { nome: "Trama", coefV: 0.7, coefU: 1 },
  organico: { nome: "Orgânico", coefV: 2, coefU: 0.45 },
  celular: { nome: "Celular", coefV: 0.9, coefU: 0.4 },
};

export const NOMES_FAMILIAS = Object.keys(
  FAMILIAS_TEXTURA
) as FamiliaTextura[];

const TAU = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const s = clamp(t, 0, 1);
  return s * s * (3 - 2 * s);
};
const tri = (x: number) => 4 * Math.abs(frac(x) - 0.5) - 1;

/** Hash determinístico — mesma peça, mesma textura, em qualquer máquina. */
function hash2(i: number, j: number): number {
  let n = (i | 0) * 374761393 + (j | 0) * 668265263;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/** Ruído de valor com u periódico — essencial: a peça fecha em 360°. */
function vnoise(x: number, y: number, per: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = smooth(x - i);
  const fy = smooth(y - j);
  const w = (n: number) => ((n % per) + per) % per;
  const a = hash2(w(i), j);
  const b = hash2(w(i + 1), j);
  const c = hash2(w(i), j + 1);
  const d = hash2(w(i + 1), j + 1);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

function fbm(x: number, y: number, per: number): number {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  let p = per;
  for (let o = 0; o < 3; o++) {
    s += amp * vnoise(x * f, y * f, Math.max(2, Math.round(p)));
    amp *= 0.5;
    f *= 2;
    p *= 2;
  }
  return s * 2 - 1;
}

function worley(x: number, y: number, per: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  let best = 9;
  const w = (n: number) => ((n % per) + per) % per;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const ci = i + di;
      const cj = j + dj;
      const px = ci + hash2(w(ci), cj) * 0.9 + 0.05;
      const py = cj + hash2(w(ci) + 911, cj + 37) * 0.9 + 0.05;
      let dx = x - px;
      const dy = y - py;
      if (dx > per / 2) dx -= per;
      if (dx < -per / 2) dx += per;
      const d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
  }
  return clamp(Math.sqrt(best) * 1.9, 0, 1) * 2 - 1;
}

/**
 * Valor da família em (u, v), em [-1, 1]. `f` é a repetição.
 * (O deslocamento físico mapeia depois para [-1, 0]: só esculpe para dentro.)
 */
export function valorTextura(
  familia: FamiliaTextura,
  u: number,
  v: number,
  f: number
): number {
  switch (familia) {
    case "gomos":
      return Math.cos(TAU * Math.max(1, Math.round(f)) * u);
    case "corrugado":
      return Math.sin(TAU * f * v);
    case "amortecido":
      return Math.sin(TAU * f * v) * Math.pow(1 - clamp(v, 0, 1), 1.25);
    case "batimento": {
      const n = Math.max(1, Math.round(f));
      return 0.5 * (Math.sin(TAU * n * u) + Math.sin(TAU * (n + 3) * u));
    }
    case "dente": {
      const s = frac(f * v);
      return Math.pow(s, 0.65) * 2 - 1;
    }
    case "escamas": {
      const cols = Math.max(3, Math.round(f));
      const rows = Math.max(2, Math.round(f * 0.55));
      const r = Math.floor(clamp(v, 0, 0.9999) * rows);
      const off = r & 1 ? 0.5 : 0;
      const cu = frac(u * cols + off) - 0.5;
      const cv = frac(v * rows) - 0.5;
      const d = Math.min(1, Math.sqrt(cu * cu * 1.1 + cv * cv * 2.4) * 2);
      return Math.cos(Math.PI * d) * 0.95;
    }
    case "plissado": {
      const cols = Math.max(3, Math.round(f));
      const rows = Math.max(1, Math.round(f / 4));
      const rf = clamp(v, 0, 0.9999) * rows;
      const r0 = Math.floor(rf);
      const t = smooth((frac(rf) - 0.34) / 0.32);
      return lerp(tri(u * cols + 0.5 * r0), tri(u * cols + 0.5 * (r0 + 1)), t);
    }
    case "torneado":
      return Math.sin(TAU * (f * 2.2 * v + u));
    case "trama":
      return (
        0.5 *
        (Math.sin(TAU * Math.max(1, Math.round(f)) * u) +
          Math.sin(TAU * Math.max(2, f * 0.7) * v))
      );
    case "organico": {
      const per = Math.max(3, Math.round(f * 0.45));
      return fbm(u * per, v * Math.max(3, f * 0.5), per);
    }
    case "celular": {
      const per = Math.max(3, Math.round(f * 0.4));
      return worley(u * per, v * Math.max(3, f * 0.45), per);
    }
  }
}

export interface TexturaParaOrcamento {
  familia?: FamiliaTextura;
  gomos: number;
  profundidadeMm: number;
  repeticao?: number;
  alturaMm: number;
}

/**
 * Orçamento próprio da textura: a inclinação que ELA cria (parede desce e
 * volta a cada onda) não passa deste teto — 30° ⚑. O que passar disso é
 * profundidade que simplesmente não entra: regra como ferramenta.
 */
export const TAN_MAX_TEXTURA = Math.tan((30 * Math.PI) / 180);

/**
 * Profundidade que realmente entra na peça, em mm. Para famílias que variam
 * com a altura, o teto vem do orçamento acima:
 * tan ≈ (profundidade/2) · 2π · coefV · repetição / altura.
 */
export function profundidadeEfetivaTexturaMm(t: TexturaParaOrcamento): number {
  const familia = t.familia ?? "gomos";
  const info = FAMILIAS_TEXTURA[familia];
  if (!info || info.coefV === 0 || t.alturaMm <= 0) {
    return Math.max(0, t.profundidadeMm);
  }
  const f = Math.max(1, t.repeticao ?? t.gomos);
  const teto = (2 * TAN_MAX_TEXTURA * t.alturaMm) / (TAU * info.coefV * f);
  return Math.max(0, Math.min(t.profundidadeMm, teto));
}

/**
 * Quanto de inclinação (tangente) a textura acrescenta à parede — o custo
 * F4 dela, já com a profundidade efetiva. O perfil desconta esse valor do
 * próprio orçamento de balanço: perfil e textura dividem o mesmo F4.
 */
export function reservaTanTextura(t: TexturaParaOrcamento): number {
  const familia = t.familia ?? "gomos";
  const info = FAMILIAS_TEXTURA[familia];
  if (!info || info.coefV === 0) return 0;
  const f = Math.max(1, t.repeticao ?? t.gomos);
  const p = profundidadeEfetivaTexturaMm(t);
  if (p <= 0 || t.alturaMm <= 0) return 0;
  return ((p / 2) * TAU * info.coefV * f) / t.alturaMm;
}

/** Ciclos em torno da peça (para a malha dar ≥ 2,6 amostras por ciclo). */
export function ciclosURepeticao(
  familia: FamiliaTextura,
  repeticao: number
): number {
  return FAMILIAS_TEXTURA[familia].coefU * repeticao;
}
