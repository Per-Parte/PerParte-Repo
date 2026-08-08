/**
 * Montagem v2 — MATERIAIS do bloco (item 7 do plano de alterações,
 * pedido do Davi em 08/08: as texturas de referência como opções de cor).
 *
 * Um material é COR + ACABAMENTO. A paleta antiga só tinha cor, e as
 * referências que o Davi mandou mostram claramente duas famílias de
 * superfície: quatro esferas foscas com a mesma trama fina de plástico
 * (é a cara de uma peça impressa) e uma roxa metálica com brilho e
 * partículas. Sem o acabamento no modelo, "ametista metálica" e
 * "castanho fosco" seriam o mesmo plástico com hex diferente.
 *
 * REGRA DE OURO desta lista: **os 12 primeiros índices são a PALETA do
 * catálogo, na ordem**. `corIdx` viaja no estado (e vai viajar no `?c=`
 * v2), então mexer na ordem trocaria a cor de obras já montadas. Só se
 * acrescenta no fim.
 *
 * Os hex novos foram AMOSTRADOS dos renders de referência (mediana do
 * disco, descartando sombra e brilho especular), não estimados a olho —
 * mas render não é filamento: ⚑ conferir com o carretel real antes de
 * virar catálogo de venda.
 */

import { PALETA, type Cor } from "../catalogo";

/**
 * Como a superfície se comporta na luz — e, na produção, que família de
 * filamento é. `fosco` é o PLA comum (a trama fina da impressão);
 * `metalico` é o filamento com carga metálica/glitter, que brilha e
 * cintila. ⚑ a família metálica precisa de validação de impressão: ela
 * é mais abrasiva e costuma pedir bico de aço.
 */
export type AcabamentoBloco = "fosco" | "metalico";

export interface MaterialBloco extends Cor {
  acabamento: AcabamentoBloco;
}

/** Materiais que a paleta do catálogo já oferecia — todos foscos. */
const HERDADOS: MaterialBloco[] = PALETA.map((cor) => ({
  ...cor,
  acabamento: "fosco",
}));

/**
 * As cinco referências de 08/08. Nomes no registro da paleta (uma
 * palavra, matéria ou pedra); Ametista e Ônix andam juntos de propósito.
 */
const NOVOS: MaterialBloco[] = [
  { nome: "Ametista", hex: "#8339C0", acabamento: "metalico" },
  { nome: "Castanho", hex: "#6A5746", acabamento: "fosco" },
  { nome: "Ônix", hex: "#2A2B2B", acabamento: "fosco" },
  { nome: "Névoa", hex: "#D2D4D5", acabamento: "fosco" },
  { nome: "Limão", hex: "#E2E071", acabamento: "fosco" },
];

/** A lista que `corIdx` indexa. Nunca reordenar; só acrescentar no fim. */
export const MATERIAIS_BLOCO: readonly MaterialBloco[] = [
  ...HERDADOS,
  ...NOVOS,
];

/** O material de um índice, com o primeiro como rede de segurança. */
export function materialDoBloco(corIdx: number): MaterialBloco {
  return MATERIAIS_BLOCO[corIdx] ?? MATERIAIS_BLOCO[0];
}
