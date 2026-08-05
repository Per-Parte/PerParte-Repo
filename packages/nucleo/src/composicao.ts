/**
 * Regra de composição dupla — auditoria de 04/08 (achados A2–A4): nada
 * ligava a SEPARAÇÃO das colunas aos RAIOS das peças, e duas colunas de
 * luz (ou luz + refletor) podiam se atravessar; a curva S para dentro
 * trançava os corpos.
 *
 * A regra, na filosofia de sempre (limite como ferramenta, nunca erro):
 * 1. a separação efetiva SOBE sozinha até as colunas terem ar entre si;
 * 2. quando nem a separação máxima (a pastilha precisa caber no prato)
 *    dá conta, o RAIO do difusor é que raseia — determinístico, a MESMA
 *    função no preview e no backend;
 * 3. a curva S "para dentro" para onde o ar acaba.
 */

import {
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  perfilEstrutural,
  type CurvaBase,
  type ParametrosBase,
  type ParametrosCorpo,
  type ParametrosDifusor,
  type ParametrosEstrutural,
  type Ponto2D,
} from "./geometria";
import { LIMITES_CRIAR } from "./catalogo";

/** Ar mínimo entre as peças de colunas vizinhas, em mm. */
export const FOLGA_AR_MM = 6;

/**
 * Quanto o refletor (PLACA) ocupa na direção da coluna de luz, a partir do
 * próprio eixo, em mm: a saia da fêmea do pescoço (Ø ~52) domina — o disco
 * é fino em X e pende para o lado oposto.
 */
export const ENVELOPE_PLACA_X_MM = 26;

const raioMaxDe = (perfil: Ponto2D[]) =>
  perfil.reduce((r, p) => Math.max(r, p.x), 0);

/** Raio externo da pastilha de encaixe (anel 24 + borda 6), em mm. */
const RAIO_PASTILHA_MM = 30;

/**
 * Bases elegíveis para composição dupla: só as que têm PRATO — face de
 * cima larga onde as duas pastilhas assentam. "cone" e "concava" afinam
 * para o pico: no raio das pastilhas a superfície já desceu dezenas de
 * milímetros e o desnível engoliria o anel macho inteiro (auditoria
 * 05/08: colunas flutuando sobre a base Cone).
 */
export function curvaElegivelParaDupla(curva: CurvaBase): boolean {
  return curva === "reta" || curva === "degrau";
}

/**
 * Altura REAL da superfície da base no raio da borda externa da pastilha
 * (meiaSep + 30 mm) — é onde a pastilha de fato assenta. Em bases de topo
 * plano isso ≈ altura da base; no ombro arredondado da "reta", desce um
 * pouco e a pastilha afunda parcialmente (os sólidos se fundem, como o
 * afundamento de 1 mm já previa).
 */
export function alturaSuperficieBaseMm(
  base: ParametrosBase,
  escala: number,
  meiaSepMm: number
): number {
  const alvo = meiaSepMm + RAIO_PASTILHA_MM;
  const perfil = perfilBase(base, escala, false);
  // Percorre a lateral de baixo para cima e guarda o último y em que a
  // superfície ainda cobre o raio alvo.
  let y = 0;
  for (const p of perfil) {
    if (p.x >= alvo) y = Math.max(y, p.y);
  }
  return Math.min(y, base.alturaMm);
}

/** Raio do envelope radial de UMA coluna (corpo + difusor + pilha), em mm. */
export function raioEnvelopeColunaMm(
  corpo: ParametrosCorpo,
  difusor: ParametrosDifusor,
  estruturais: ParametrosEstrutural[] = []
): number {
  let r = Math.max(raioMaxDe(perfilCorpo(corpo)), raioMaxDe(perfilDifusor(difusor)));
  for (const e of estruturais) r = Math.max(r, raioMaxDe(perfilEstrutural(e)));
  return r;
}

/** Separação mínima para as colunas terem ar, em mm. */
export function separacaoNecessariaMm(
  raioColunaMm: number,
  comPlaca: boolean
): number {
  return comPlaca
    ? raioColunaMm + ENVELOPE_PLACA_X_MM + FOLGA_AR_MM
    : 2 * raioColunaMm + FOLGA_AR_MM;
}

export interface ComposicaoDupla {
  base: ParametrosBase;
  corpo: ParametrosCorpo;
  difusor: ParametrosDifusor;
  /** Separação efetiva entre as colunas, em mm. */
  separacaoMm: number;
  /** Onde a superfície da base está no raio das pastilhas (assento real). */
  superficieBaseMm: number;
  /** Teto do raio do difusor nesta composição (para o slider explicar). */
  raioDifusorTetoMm: number;
  /** Quanto a curva S ainda pode ir "para dentro", em mm (para o slider). */
  tetoInternoMm: number;
  /** O que a regra precisou ajustar (para a UI explicar). */
  ajustes: {
    separacaoSubiu: boolean;
    difusorRaseou: boolean;
    deslocamentoParou: boolean;
    /** A base afinava para o pico e virou prato (curva → reta). */
    baseVirouPrato: boolean;
  };
}

/**
 * Aplica a regra inteira. `separacaoTetoMm` é o teto físico da separação
 * (a pastilha precisa caber no prato — `separacaoMaximaMm`); usar SEMPRE a
 * mesma nos dois lados (preview e backend) para o contrato valer.
 */
export function ajustarComposicaoDupla(
  base: ParametrosBase,
  corpo: ParametrosCorpo,
  difusor: ParametrosDifusor,
  estruturais: ParametrosEstrutural[],
  opts: {
    comPlaca: boolean;
    separacaoPedidaMm: number;
    separacaoTetoMm: number;
    /** Escala E2 da base (para o assento real das pastilhas). */
    escalaBase?: number;
  }
): ComposicaoDupla {
  const teto = Math.max(LIMITES_CRIAR.luminaria.separacaoMm.min, opts.separacaoTetoMm);
  const margem = opts.comPlaca ? ENVELOPE_PLACA_X_MM + FOLGA_AR_MM : FOLGA_AR_MM;

  // 0 · a base precisa de PRATO: cone/côncava não têm onde assentar as
  // duas pastilhas (a superfície desce do pico e engole o macho).
  const baseVirouPrato = !curvaElegivelParaDupla(base.curva);
  const baseFinal = baseVirouPrato ? { ...base, curva: "reta" as const } : base;

  // 2 · o raio do difusor raseia até caber dentro do teto de separação.
  const raioPermitidoMm = Math.max(
    LIMITES_CRIAR.difusor.raioMm.min,
    opts.comPlaca ? teto - margem : (teto - margem) / 2
  );
  const difusorRaseou = difusor.raioMm > raioPermitidoMm;
  const difusorFinal = difusorRaseou
    ? { ...difusor, raioMm: raioPermitidoMm }
    : difusor;

  // 1 · a separação sobe até as colunas terem ar.
  const raioColuna = raioEnvelopeColunaMm(corpo, difusorFinal, estruturais);
  const necessaria = separacaoNecessariaMm(raioColuna, opts.comPlaca);
  const separacaoMm = Math.min(
    Math.max(opts.separacaoPedidaMm, necessaria),
    teto
  );

  // 3 · a curva S "para dentro" para onde o ar acaba (para fora é livre).
  const arDeSobra = Math.max(0, separacaoMm - necessaria);
  const tetoInternoMm = opts.comPlaca ? arDeSobra : arDeSobra / 2;
  const d = corpo.deslocamentoMm ?? 0;
  const deslocamentoParou = d < -tetoInternoMm;
  const corpoFinal = deslocamentoParou
    ? { ...corpo, deslocamentoMm: -tetoInternoMm }
    : corpo;

  // Onde a superfície da base REALMENTE está no raio das pastilhas — é o
  // assento das colunas (auditoria 05/08: no ombro da base o topo nominal
  // fica acima da superfície e as colunas flutuavam).
  const superficieBaseMm = alturaSuperficieBaseMm(
    baseFinal,
    opts.escalaBase ?? 1,
    separacaoMm / 2
  );

  return {
    base: baseFinal,
    corpo: corpoFinal,
    difusor: difusorFinal,
    separacaoMm,
    superficieBaseMm,
    raioDifusorTetoMm: raioPermitidoMm,
    tetoInternoMm,
    ajustes: {
      separacaoSubiu: separacaoMm > opts.separacaoPedidaMm + 0.5,
      difusorRaseou,
      deslocamentoParou,
      baseVirouPrato,
    },
  };
}
