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

export const CORPOS: CorpoOficial[] = [
  { nome: "Coluna", alturaMm: 160, volumeBojoMm: 3, posicaoBojo: 0, ondulacao: 0, amplitudeOndaMm: 0 },
  { nome: "Bojo", alturaMm: 150, volumeBojoMm: 28, posicaoBojo: 0.15, ondulacao: 0, amplitudeOndaMm: 0 },
  { nome: "Cintura", alturaMm: 170, volumeBojoMm: -10, posicaoBojo: 0, ondulacao: 0, amplitudeOndaMm: 0 },
  { nome: "Ondas", alturaMm: 160, volumeBojoMm: 9, posicaoBojo: 0, ondulacao: 8, amplitudeOndaMm: 2.5 },
  { nome: "Torre", alturaMm: 210, volumeBojoMm: 6, posicaoBojo: -0.5, ondulacao: 0, amplitudeOndaMm: 0 },
];

export interface DifusorOficial extends ParametrosDifusor {
  nome: string;
}

export const DIFUSORES: DifusorOficial[] = [
  { nome: "Globo", forma: "globo", alturaMm: 100, raioMm: 65 },
  { nome: "Sino", forma: "sino", alturaMm: 90, raioMm: 75 },
  { nome: "Cone", forma: "cone", alturaMm: 85, raioMm: 70 },
  { nome: "Lanterna", forma: "lanterna", alturaMm: 110, raioMm: 55 },
];

export interface Faceta {
  nome: string;
  segmentos: number;
}

export const FACETAS: Faceta[] = [
  { nome: "Liso", segmentos: 40 },
  { nome: "6 facetas", segmentos: 6 },
  { nome: "8 facetas", segmentos: 8 },
  { nome: "12 facetas", segmentos: 12 },
  { nome: "16 facetas", segmentos: 16 },
];

/**
 * Limites dos controles do modo Criar (mm).
 * Altura do corpo: teto de 240 mm do protótipo (F1 permitiria 300 — decidir
 * ao validar as impressoras). Amplitude da onda: teto de 6 mm para o balanço
 * não passar de F4. Raio do difusor: exibido como Ø na UI.
 */
export const LIMITES_CRIAR = {
  corpo: {
    alturaMm: { min: 100, max: 240, passo: 5 },
    volumeBojoMm: { min: -12, max: 35, passo: 1 },
    posicaoBojo: { min: -1, max: 1, passo: 0.05 },
    ondulacao: { min: 0, max: 12, passo: 1 },
    amplitudeOndaMm: { min: 0, max: 6, passo: 0.5 },
  },
  difusor: {
    alturaMm: { min: 60, max: 130, passo: 5 },
    raioMm: { min: 40, max: 90, passo: 2.5 },
  },
} as const;
