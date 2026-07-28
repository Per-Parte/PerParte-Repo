/**
 * Regras do produto — espelho executável de `docs/regras-do-produto-v0.2.md`.
 *
 * O documento é a fonte de verdade; este módulo existe para que os limites
 * da ferramenta sejam DERIVADOS das regras, nunca digitados soltos na UI.
 * Quando o sócio validar um valor ⚑ nas impressoras reais, muda-se aqui
 * e a ferramenta inteira obedece.
 *
 * Status: "validar" (⚑) = provisório, aguarda dados reais da produção.
 *         "proposto" (▸) = para discutir.
 */

export type StatusRegra = "validar" | "proposto";

export interface Faixa {
  min: number;
  max: number;
}

export const REGRAS = {
  /** F — Fabricação */
  F: {
    /** F1 · Volume máximo por parte, em mm. ⚑ validar com as impressoras reais. */
    volumeMaximoParteMm: { largura: 250, profundidade: 250, altura: 300 },
    /** F2 · Parede mínima estrutural (base e corpo), em mm. ⚑ */
    paredeEstruturalMm: { min: 1.6, max: 2.4 } as Faixa,
    /** F3 · Parede do difusor, em mm — faixa em que o PLA fica translúcido. ⚑ */
    paredeDifusorMm: { min: 0.8, max: 1.2 } as Faixa,
    /**
     * F4 · Balanço (overhang) máximo sem suporte, em graus medidos da vertical.
     * O doc dá a faixa 45–50°; partimos do valor conservador. ⚑
     */
    balancoMaximoGraus: 45,
    /** F5 · Folga única dos encaixes, em mm — definida uma vez, nunca mais tocada. ⚑ */
    folgaEncaixeMm: { min: 0.2, max: 0.4 } as Faixa,
    /** F7 · Peso máximo por parte, em gramas. ⚑ */
    pesoMaximoParteG: 350,
  },

  /** S — Segurança e elétrica (invioláveis) */
  S: {
    /** S1 · Só LED; potência máxima em watts. Incandescente/halógena: proibidas para sempre. */
    potenciaMaximaW: 9,
    /** S2 · Distância mínima entre a lâmpada e qualquer parede impressa, em mm. ⚑ */
    distanciaMinimaLampadaParedeMm: 25,
  },

  /** E — Estabilidade */
  E: {
    /** E1 · A projeção do centro de gravidade cai no terço central do raio da base. */
    fracaoCentralDaBaseParaCG: 1 / 3,
  },
} as const;

/**
 * F5 · Encaixes padronizados — as duas interfaces fixas, em mm.
 * "Definida uma vez, testada, e nunca mais tocada."
 *
 * `raioMm` é o raio externo da peça na interface (Ø 5,2 e Ø 3,8 cm, do
 * protótipo). `anel` é o encaixe físico: um anel macho que sobe da peça de
 * baixo e entra numa canaleta fêmea na peça de cima. A fêmea abre
 * `folga` além do macho em cada superfície de contato.
 * ⚑ TODAS as medidas de anel e folga aguardam o kit de calibração impresso.
 */
export const ENCAIXES = {
  baseCorpo: {
    raioMm: 26,
    anel: { externoMm: 24, internoMm: 20, alturaMm: 6 },
  },
  corpoDifusor: {
    raioMm: 19,
    anel: { externoMm: 17, internoMm: 14, alturaMm: 5 },
  },
  /** Ponto de partida no meio da faixa F5 (0,2–0,4 mm). ⚑ */
  folgaPadraoMm: 0.3,
  /** Alívio no fundo da canaleta para o macho assentar na face, não no fundo. */
  folgaProfundidadeMm: 0.2,
} as const;

/**
 * Raio livre em torno do miolo elétrico (haste/cabo) dentro do corpo, em mm.
 * Nenhuma parede impressa entra nesse cilindro. Valor do protótipo. ⚑
 */
export const RAIO_LIVRE_MIOLO_MM = 15.5;
