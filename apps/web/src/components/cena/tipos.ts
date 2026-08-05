/**
 * Tipos e constantes da troca de cena — módulo LEVE de propósito: o
 * Configurador importa daqui (e do ToggleCena) sem puxar three/drei para o
 * bundle inicial; a parte pesada mora em Cena.tsx, dentro do chunk dinâmico
 * da Cena3D.
 */

/** Cenários registrados (§4.4 — slot de cenários). */
export type CenaId = "estudio" | "quarto";

/** Chave da preferência no localStorage — a escolha NÃO entra no ?c=. */
export const CHAVE_CENA = "pp-cena";

/** Valida um valor vindo de fora (localStorage) sem confiar nele. */
export function cenaValida(v: unknown): CenaId | null {
  return v === "estudio" || v === "quarto" ? v : null;
}

/** Props que todo cenário registrado recebe. */
export interface PropsCenario {
  /** 1 = ambiente aceso · 0,3 = seção Luz (parcial) · 0 = apagado (§4.4). */
  intensidade: number;
  /** Este cenário é o alvo visível? O peso do crossfade (~300 ms) persegue isso. */
  ativo: boolean;
  /** prefers-reduced-motion: transições viram cortes secos (§6). */
  reduzido: boolean;
  /** Avisa que o cenário terminou de carregar — a troca só consuma aqui. */
  aoPronto?: () => void;
}
