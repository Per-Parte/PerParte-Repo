/**
 * Regra de composição dupla — auditoria de 04/08 (A2–A4) e cirurgia de
 * 05/08 (B3/B4/B8): nada ligava a SEPARAÇÃO das colunas aos RAIOS das
 * peças; a base "reta" tinha ombro e engolia o anel macho; o clamp da
 * separação no teto da pastilha vencia a regra do ar em silêncio; e o
 * raseio do difusor deixava a junta inclinada fora do próprio grampo.
 *
 * A regra, na filosofia de sempre (limite como ferramenta, nunca erro):
 * 0. em modo duplo a base é um PRATO de verdade (cilindro de topo plano) —
 *    qualquer ombro engole o anel macho da pastilha;
 * 1. a separação efetiva SOBE sozinha até as colunas terem ar entre si;
 * 2. quando o prato atual não comporta a separação necessária, a BASE
 *    ALARGA (o mesmo espírito do E2) até o teto do F1;
 * 3. se nem no F1 couber, o raio do DIFUSOR raseia — determinístico, a
 *    MESMA função no preview e no backend — e a junta inclinada é
 *    re-grampeada para o raio novo;
 * 4. se ainda faltar ar (corpo largo demais), o CORPO raseia por último
 *    (a silhueta clampa; bojo/ondas encolhem por busca determinística);
 * 5. a curva S "para dentro" para onde o ar acaba.
 */

import {
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  perfilEstrutural,
  separacaoMaximaMm,
  type CurvaBase,
  type ParametrosBase,
  type ParametrosCorpo,
  type ParametrosDifusor,
  type ParametrosEstrutural,
  type Ponto2D,
} from "./geometria";
import { alcanceLateralCabecaMm, grampearJunta } from "./junta";
import { LIMITES_CRIAR } from "./catalogo";
import { REGRAS } from "./regras";

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

/** Teto físico do raio do prato duplo: metade da mesa F1, com margem. ⚑ */
const RAIO_MAXIMO_PRATO_MM =
  REGRAS.F.volumeMaximoParteMm.largura / 2 - 2;

/**
 * Bases que já têm face de cima larga (histórico; a composição de hoje
 * impõe "prato" a todas — o ombro da "reta" também engolia o anel macho).
 */
export function curvaElegivelParaDupla(curva: CurvaBase): boolean {
  return curva === "reta" || curva === "degrau" || curva === "prato";
}

/**
 * Altura REAL da superfície da base no raio da borda externa da pastilha
 * (meiaSep + 30 mm) — é onde a pastilha de fato assenta. No prato imposto
 * pela composição isso é a própria altura da base; a varredura fica como
 * defesa (e para quem chamar com curvas de ombro).
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

/**
 * Raio do envelope radial de UMA coluna (corpo + difusor + pilha), em mm.
 * Com junta inclinada, vale o lado das COSTAS da cabeça (as cabeças
 * apontam para fora por convenção — é a nuca que encara a coluna vizinha).
 */
export function raioEnvelopeColunaMm(
  corpo: ParametrosCorpo,
  difusor: ParametrosDifusor,
  estruturais: ParametrosEstrutural[] = []
): number {
  const cabeca = difusor.junta
    ? alcanceLateralCabecaMm(difusor, difusor.junta).paraDentroMm
    : raioMaxDe(perfilDifusor(difusor));
  let r = Math.max(raioMaxDe(perfilCorpo(corpo)), cabeca);
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

/**
 * Raseia o corpo até o envelope caber em `raioTetoMm`: silhueta livre
 * clampa direto; bojo/ondas encolhem por busca binária determinística
 * (mesmos passos no preview e no backend — o contrato vale).
 */
function rasearCorpoAte(
  corpo: ParametrosCorpo,
  raioTetoMm: number
): ParametrosCorpo {
  if (raioMaxDe(perfilCorpo(corpo)) <= raioTetoMm + 0.05) return corpo;
  if (corpo.perfilLivre) {
    return {
      ...corpo,
      perfilLivre: corpo.perfilLivre.map((r) => Math.min(r, raioTetoMm)),
    };
  }
  // Presets (bojo/ondas): encolhe as duas alavancas na mesma proporção.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 12; i++) {
    const k = (lo + hi) / 2;
    const tentativa = {
      ...corpo,
      volumeBojoMm: corpo.volumeBojoMm * k,
      amplitudeOndaMm: corpo.amplitudeOndaMm * k,
    };
    if (raioMaxDe(perfilCorpo(tentativa)) > raioTetoMm) hi = k;
    else lo = k;
  }
  return {
    ...corpo,
    volumeBojoMm: corpo.volumeBojoMm * lo,
    amplitudeOndaMm: corpo.amplitudeOndaMm * lo,
  };
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
  /** Teto do raio do corpo nesta composição (para o slider explicar). */
  raioCorpoTetoMm: number;
  /** Quanto a curva S ainda pode ir "para dentro", em mm (para o slider). */
  tetoInternoMm: number;
  /** O que a regra precisou ajustar (para a UI explicar). */
  ajustes: {
    separacaoSubiu: boolean;
    difusorRaseou: boolean;
    corpoRaseou: boolean;
    deslocamentoParou: boolean;
    /** A curva pedida mudou de cara para virar o prato (cone/côncava/degrau). */
    baseVirouPrato: boolean;
    /** O prato alargou além do raio pedido para as colunas terem ar. */
    baseAlargou: boolean;
  };
}

/**
 * Aplica a regra inteira. Recebe `lados`/`expoente` (facetas/squircle da
 * luminária) porque o teto da separação depende do raio ÚTIL do prato no
 * meio da face — usar SEMPRE os mesmos argumentos no preview e no backend
 * para o contrato valer.
 */
export function ajustarComposicaoDupla(
  base: ParametrosBase,
  corpo: ParametrosCorpo,
  difusor: ParametrosDifusor,
  estruturais: ParametrosEstrutural[],
  opts: {
    comPlaca: boolean;
    separacaoPedidaMm: number;
    /** Facetas da luminária (0/undefined = redonda). */
    lados?: number;
    expoente?: number;
  }
): ComposicaoDupla {
  const margem = opts.comPlaca ? ENVELOPE_PLACA_X_MM + FOLGA_AR_MM : FOLGA_AR_MM;
  const lados = opts.lados ?? 0;

  // 0 · em modo duplo a base é um PRATO de verdade: cilindro de topo
  // plano. Ombros (reta), degraus e picos engolem o anel macho — a
  // pastilha precisa AFLORAR para o corpo encaixar (auditoria 05/08, B3).
  const baseVirouPrato = !curvaElegivelParaDupla(base.curva) || base.curva === "degrau";
  const basePrato = { ...base, curva: "prato" as const };

  // 1 · quanto de separação as colunas pedem, com o design como veio.
  const raioColunaPedido = raioEnvelopeColunaMm(corpo, difusor, estruturais);
  const necessariaPedida = separacaoNecessariaMm(raioColunaPedido, opts.comPlaca);

  // 2 · a BASE ALARGA até o prato comportar a separação necessária
  // (espírito do E2), respeitando o teto físico do F1.
  const tetoComRaio = (raioMm: number) =>
    separacaoMaximaMm(raioMm, 1, lados, opts.expoente);
  let raioPratoMm = basePrato.raioMm;
  if (
    tetoComRaio(raioPratoMm) < necessariaPedida &&
    raioPratoMm < RAIO_MAXIMO_PRATO_MM
  ) {
    // Inverte separacaoMaximaMm: raio que faz o teto = necessária.
    let lo = raioPratoMm;
    let hi = RAIO_MAXIMO_PRATO_MM;
    for (let i = 0; i < 12; i++) {
      const meio = (lo + hi) / 2;
      if (tetoComRaio(meio) < necessariaPedida) lo = meio;
      else hi = meio;
    }
    raioPratoMm = Math.min(RAIO_MAXIMO_PRATO_MM, Math.ceil(hi * 2) / 2);
  }
  const baseAlargou = raioPratoMm > basePrato.raioMm + 0.05;
  const baseFinal = baseAlargou
    ? { ...basePrato, raioMm: raioPratoMm }
    : basePrato;
  const teto = Math.max(
    LIMITES_CRIAR.luminaria.separacaoMm.min,
    tetoComRaio(raioPratoMm)
  );

  // 3 · se nem no F1 coube, o raio do DIFUSOR raseia até o teto — e a
  // junta inclinada é re-grampeada para o raio novo (B8: o raseio não
  // pode deixar a cabeça fora do próprio grampo).
  const raioPermitidoMm = Math.max(
    LIMITES_CRIAR.difusor.raioMm.min,
    opts.comPlaca ? teto - margem : (teto - margem) / 2
  );
  const difusorRaseou = difusor.raioMm > raioPermitidoMm;
  let difusorFinal = difusorRaseou
    ? { ...difusor, raioMm: raioPermitidoMm }
    : difusor;
  if (difusorRaseou && difusorFinal.junta) {
    difusorFinal = {
      ...difusorFinal,
      junta: grampearJunta(difusorFinal.junta, difusorFinal.raioMm),
    };
  }

  // 4 · se AINDA falta ar, o corpo raseia por último (a pilha estrutural é
  // fixa de catálogo e sempre cabe: Ø máx 80 < teto mínimo de 70 + ar).
  const raioCorpoTetoMm = opts.comPlaca
    ? teto - margem
    : (teto - margem) / 2;
  const difusorSozinho = raioEnvelopeColunaMm(corpo0(), difusorFinal, []);
  const corpoAjustado = rasearCorpoAte(corpo, Math.max(raioCorpoTetoMm, difusorSozinho));
  const corpoRaseou = corpoAjustado !== corpo;

  // 1 (de novo) · a separação sobe até as colunas terem ar, já com todo
  // mundo raseado — agora a necessária SEMPRE cabe no teto.
  const raioColuna = raioEnvelopeColunaMm(corpoAjustado, difusorFinal, estruturais);
  const necessaria = separacaoNecessariaMm(raioColuna, opts.comPlaca);
  const separacaoMm = Math.min(
    Math.max(opts.separacaoPedidaMm, necessaria),
    teto
  );

  // 5 · a curva S "para dentro" para onde o ar acaba (para fora é livre).
  const arDeSobra = Math.max(0, separacaoMm - necessaria);
  const tetoInternoMm = opts.comPlaca ? arDeSobra : arDeSobra / 2;
  const d = corpoAjustado.deslocamentoMm ?? 0;
  const deslocamentoParou = d < -tetoInternoMm;
  const corpoFinal = deslocamentoParou
    ? { ...corpoAjustado, deslocamentoMm: -tetoInternoMm }
    : corpoAjustado;

  // No prato a superfície é a própria altura; a varredura fica de defesa.
  const superficieBaseMm = alturaSuperficieBaseMm(
    baseFinal,
    1,
    separacaoMm / 2
  );

  return {
    base: baseFinal,
    corpo: corpoFinal,
    difusor: difusorFinal,
    separacaoMm,
    superficieBaseMm,
    raioDifusorTetoMm: raioPermitidoMm,
    raioCorpoTetoMm,
    tetoInternoMm,
    ajustes: {
      separacaoSubiu: separacaoMm > opts.separacaoPedidaMm + 0.5,
      difusorRaseou,
      corpoRaseou,
      deslocamentoParou,
      baseVirouPrato,
      baseAlargou,
    },
  };
}

/** Corpo neutro (raio mínimo) para medir o difusor sozinho no envelope. */
function corpo0(): ParametrosCorpo {
  return {
    alturaMm: LIMITES_CRIAR.corpo.alturaMm.min,
    volumeBojoMm: 0,
    posicaoBojo: 0,
    ondulacao: 0,
    amplitudeOndaMm: 0,
    gomos: 0,
    profundidadeGomosMm: 0,
    torcaoGraus: 0,
    deslocamentoMm: 0,
    posicaoDobra: 0,
  };
}
