/**
 * Catálogo de partes oficiais e limites do modo Criar.
 *
 * As partes oficiais são apenas conjuntos de parâmetros com nome — a mesma
 * geometria paramétrica serve ao Montar (presets) e ao Criar (sliders).
 * Limites do Criar vêm das regras; nunca são digitados na UI.
 */

import type {
  ParametrosBase,
  ParametrosCorpo,
  ParametrosDifusor,
  ParametrosEstrutural,
} from "./geometria";

export interface Cor {
  nome: string;
  hex: string;
}

export const PALETA: Cor[] = [
  { nome: "Areia", hex: "#E4DCCB" },
  { nome: "Off-white", hex: "#F4F1E8" },
  { nome: "Terracota", hex: "#C96F4A" },
  { nome: "Amarelo", hex: "#D9A441" },
  { nome: "Verde", hex: "#7D8C6F" },
  { nome: "Azul", hex: "#5D7B93" },
  { nome: "Rosa", hex: "#D4A29C" },
  { nome: "Grafite", hex: "#4A4842" },
  { nome: "Cacau", hex: "#6E4B33" },
  { nome: "Céu", hex: "#A9BCC9" },
  { nome: "Vinho", hex: "#7E3B45" },
  { nome: "Oliva", hex: "#8A8A5C" },
];

export interface BaseOficial extends ParametrosBase {
  nome: string;
}

export const BASES: BaseOficial[] = [
  { nome: "Disco", alturaMm: 26, raioMm: 82, curva: "reta" },
  { nome: "Prato", alturaMm: 34, raioMm: 88, curva: "concava" },
  { nome: "Cone", alturaMm: 50, raioMm: 76, curva: "cone" },
  { nome: "Degrau", alturaMm: 42, raioMm: 78, curva: "degrau" },
];

export interface CorpoOficial extends ParametrosCorpo {
  nome: string;
}

const CORPO_LISO = {
  gomos: 0,
  profundidadeGomosMm: 0,
  torcaoGraus: 0,
  deslocamentoMm: 0,
  posicaoDobra: 0,
};

export const CORPOS: CorpoOficial[] = [
  { nome: "Coluna", alturaMm: 160, volumeBojoMm: 3, posicaoBojo: 0, ondulacao: 0, amplitudeOndaMm: 0, ...CORPO_LISO },
  { nome: "Bojo", alturaMm: 150, volumeBojoMm: 28, posicaoBojo: 0.15, ondulacao: 0, amplitudeOndaMm: 0, ...CORPO_LISO },
  { nome: "Cintura", alturaMm: 170, volumeBojoMm: -10, posicaoBojo: 0, ondulacao: 0, amplitudeOndaMm: 0, ...CORPO_LISO },
  { nome: "Ondas", alturaMm: 160, volumeBojoMm: 9, posicaoBojo: 0, ondulacao: 8, amplitudeOndaMm: 2.5, ...CORPO_LISO },
  { nome: "Torre", alturaMm: 210, volumeBojoMm: 6, posicaoBojo: -0.5, ondulacao: 0, amplitudeOndaMm: 0, ...CORPO_LISO },
  { nome: "Plissado", alturaMm: 170, volumeBojoMm: 14, posicaoBojo: 0, ondulacao: 0, amplitudeOndaMm: 0, gomos: 18, profundidadeGomosMm: 2.5, torcaoGraus: 0, deslocamentoMm: 0, posicaoDobra: 0 },
  { nome: "Espiral", alturaMm: 180, volumeBojoMm: 10, posicaoBojo: 0, ondulacao: 0, amplitudeOndaMm: 0, gomos: 12, profundidadeGomosMm: 3, torcaoGraus: 60, deslocamentoMm: 0, posicaoDobra: 0 },
  { nome: "Curva S", alturaMm: 190, volumeBojoMm: 4, posicaoBojo: 0, ondulacao: 0, amplitudeOndaMm: 0, gomos: 0, profundidadeGomosMm: 0, torcaoGraus: 0, deslocamentoMm: 40, posicaoDobra: 0.2 },
];

export interface EstruturalOficial extends ParametrosEstrutural {
  nome: string;
}

/**
 * Peças estruturais empilháveis — vivem entre a base e o corpo, fêmea e
 * macho da MESMA interface base↔corpo nas duas pontas (F5): qualquer uma
 * monta sobre qualquer outra. Hastes dão altura; anéis dão ritmo.
 */
export const ESTRUTURAIS: EstruturalOficial[] = [
  { nome: "Junco", tipo: "haste", alturaMm: 120, barrigaMm: 0 },
  { nome: "Fuso", tipo: "haste", alturaMm: 110, barrigaMm: 10 },
  { nome: "Cinta", tipo: "haste", alturaMm: 100, barrigaMm: -8 },
  { nome: "Colar", tipo: "anel", alturaMm: 24, barrigaMm: 4 },
  { nome: "Gola", tipo: "anel", alturaMm: 32, barrigaMm: 9 },
  { nome: "Aro", tipo: "anel", alturaMm: 24, barrigaMm: 0 },
  // Primitivos do modo blocos (04/08) — no FIM para preservar links ?c=.
  { nome: "Rosquinha", tipo: "anel", alturaMm: 36, barrigaMm: 14 },
  { nome: "Pílula", tipo: "haste", alturaMm: 64, barrigaMm: 12 },
];

/** Máximo de peças estruturais na pilha (entre a base e o corpo). */
export const MAX_ESTRUTURAIS = 3;

export interface DifusorOficial extends ParametrosDifusor {
  nome: string;
}

const DIFUSOR_LISO = { gomos: 0, profundidadeGomosMm: 0 };

export const DIFUSORES: DifusorOficial[] = [
  { nome: "Globo", forma: "globo", alturaMm: 100, raioMm: 65, ...DIFUSOR_LISO },
  { nome: "Sino", forma: "sino", alturaMm: 90, raioMm: 75, ...DIFUSOR_LISO },
  { nome: "Cone", forma: "cone", alturaMm: 85, raioMm: 70, ...DIFUSOR_LISO },
  { nome: "Lanterna", forma: "lanterna", alturaMm: 110, raioMm: 55, ...DIFUSOR_LISO },
  { nome: "Plissê", forma: "sino", alturaMm: 95, raioMm: 72, gomos: 20, profundidadeGomosMm: 2 },
];

export interface Faceta {
  nome: string;
  segmentos: number;
  /** Superelipse (squircle): expoente da curva; a malha fica fina. */
  expoente?: number;
}

export const FACETAS: Faceta[] = [
  { nome: "Liso", segmentos: 40 },
  { nome: "6 facetas", segmentos: 6 },
  { nome: "8 facetas", segmentos: 8 },
  { nome: "12 facetas", segmentos: 12 },
  { nome: "16 facetas", segmentos: 16 },
  // Novos no fim para não mudar o significado dos links ?c= antigos (iFaceta).
  { nome: "4 facetas", segmentos: 4 },
  { nome: "Squircle", segmentos: 40, expoente: 4 },
];

/**
 * Limites dos controles do modo Criar (mm).
 * - Altura do corpo: teto de 240 mm do protótipo (F1 permitiria 300).
 * - Amplitude da onda: teto de 6 mm para o balanço não passar de F4.
 * - Gomos: profundidade só esculpe para dentro (nunca aumenta a silhueta) e
 *   a torção fica em ±90° — com sulcos ≤ 4 mm a inclinação resultante fica
 *   folgada dentro de F4 nas alturas permitidas. ⚑ validar impresso.
 */
export const LIMITES_CRIAR = {
  base: {
    alturaMm: { min: 20, max: 60, passo: 2 },
    raioMm: { min: 60, max: 110, passo: 2.5 },
  },
  corpo: {
    alturaMm: { min: 100, max: 240, passo: 5 },
    volumeBojoMm: { min: -12, max: 35, passo: 1 },
    posicaoBojo: { min: -1, max: 1, passo: 0.05 },
    ondulacao: { min: 0, max: 12, passo: 1 },
    amplitudeOndaMm: { min: 0, max: 6, passo: 0.5 },
    gomos: { min: 0, max: 24, passo: 2 },
    profundidadeGomosMm: { min: 0, max: 4, passo: 0.5 },
    torcaoGraus: { min: -90, max: 90, passo: 5 },
    /** Repetição das famílias de textura que não são gomos. */
    repeticaoTextura: { min: 3, max: 24, passo: 1 },
    /** Teto absoluto; o teto real depende da altura (deslocamentoMaximoMm). */
    deslocamentoMm: { min: -85, max: 85, passo: 5 },
    posicaoDobra: { min: -1, max: 1, passo: 0.1 },
    /** Faixa dos raios de controle da silhueta livre. */
    perfilLivreRaioMm: { min: 16, max: 60, passo: 0.5 },
    /** Berço (gola): teto real da altura depende do difusor (golaMaximaMm). */
    golaAlturaMm: { min: 12, max: 60, passo: 2 },
    golaRaioMm: { min: 40, max: 60, passo: 1 },
  },
  difusor: {
    alturaMm: { min: 60, max: 130, passo: 5 },
    raioMm: { min: 40, max: 90, passo: 2.5 },
    gomos: { min: 0, max: 24, passo: 2 },
    profundidadeGomosMm: { min: 0, max: 3, passo: 0.5 },
  },
  estrutural: {
    alturaMm: { min: 20, max: 160, passo: 2 },
    barrigaMm: { min: -10, max: 14, passo: 1 },
  },
  luminaria: {
    /** Distância entre as duas colunas no modo de dois pontos de luz. */
    separacaoMm: { min: 70, max: 160, passo: 5 },
  },
  /**
   * ESTICAR — proporção entre os semi-eixos da seção (1 = redonda).
   * Piso em 0,55: abaixo disso o eixo curto de um corpo comum encostaria
   * no pé da canaleta/miolo e a peça viraria lâmina. ⚑ validar impresso.
   */
  proporcao: { min: 0.55, max: 1, passo: 0.05 },
} as const;
