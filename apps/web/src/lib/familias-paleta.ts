/**
 * Famílias visuais da paleta — SÓ apresentação, só no web (§4.2).
 *
 * A PALETA do núcleo é chapada (12 cores) e os índices dela são serializados
 * no ?c= — nada aqui muda a ordem original. Este mapeamento apenas agrupa os
 * índices para o painel exibir os swatches por família de branding.
 * ⚑ provisório até a paleta v1: grupos por afinidade visual, cada cor
 * aparece numa família só.
 */
import { PALETA } from "@per-parte/nucleo";

export interface FamiliaPaleta {
  nome: string;
  /** Índices na PALETA do núcleo (ordem original intacta). */
  indices: number[];
}

export const FAMILIAS_PALETA: FamiliaPaleta[] = [
  { nome: "Marco", indices: [4, 11, 3] }, // Verde, Oliva, Amarelo
  { nome: "Brasa", indices: [2, 10, 8] }, // Terracota, Vinho, Cacau
  { nome: "Neutros", indices: [1, 0, 7] }, // Off-white, Areia, Grafite
  { nome: "Frios", indices: [5, 9, 6] }, // Azul, Céu, Rosa
];

// Guarda de desenvolvimento: cada cor da PALETA em exatamente uma família.
if (process.env.NODE_ENV !== "production") {
  const todos = FAMILIAS_PALETA.flatMap((f) => f.indices);
  if (todos.length !== PALETA.length || new Set(todos).size !== PALETA.length) {
    console.warn("familias-paleta: o agrupamento não cobre a PALETA 1:1");
  }
}
