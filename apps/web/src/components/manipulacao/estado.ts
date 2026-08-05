/**
 * Manipulação direta v1 — store fora do React (§2.1 da spec).
 *
 * Fonte única do estado de manipulação: ferramenta ativa, seleção, hover,
 * toast de limite e o registro da ponte (valores + setters vindos do
 * Configurador). O padrão é o de useSyncExternalStore: quem precisa reagir
 * assina via useManipulacao(); quem age (gestos, atalhos) chama as ações.
 * Zero prop-drilling entre o Configurador (DOM) e a Cena3D (Canvas).
 */

import { useSyncExternalStore } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type {
  ParametrosCorpo,
  ParametrosDifusor,
  ParametrosPlaca,
} from "@per-parte/nucleo";
import type { AlvoCor, EstadoCriar } from "../Configurador";

/** As quatro ferramentas do palco (§3). */
export type Ferramenta = "selecionar" | "arrastar" | "mover" | "girar";

/**
 * Marca que cada mesh de parte carrega em userData.pp — o contrato de
 * raycast (§2.2). Cenário/chão não têm marca: hit sem marca = "vazio".
 */
export type MarcaParte =
  | { parte: "base" }
  | { parte: "pastilha"; coluna: -1 | 1 }
  | { parte: "estrutural"; indice: number; coluna: -1 | 0 | 1 }
  | { parte: "corpo"; coluna: -1 | 0 | 1 }
  | { parte: "difusor"; coluna: -1 | 0 | 1; inclinada: boolean }
  | { parte: "placa" };

/** Toast didático de limite, ancorado ao cursor no desktop (§6). */
export interface ToastLimiteInfo {
  texto: string;
  x: number;
  y: number;
}

/**
 * O snapshot que o Configurador registra a cada render via PonteManipulacao:
 * valores atuais + setters + refs. É por aqui que todo gesto roteia
 * pedido → grampear* → setter — o MESMO caminho dos sliders (§1.1).
 */
export interface RegistroPonte {
  modo: "montar" | "criar";
  criar: EstadoCriar;
  setCriar: Dispatch<SetStateAction<EstadoCriar>>;
  estruturais: number[];
  setEstruturais: Dispatch<SetStateAction<number[]>>;
  separacaoMm: number;
  setSeparacaoMm: Dispatch<SetStateAction<number>>;
  placa: ParametrosPlaca | null;
  setPlaca: Dispatch<SetStateAction<ParametrosPlaca | null>>;
  pontosDeLuz: 1 | 2;
  /** Corpo pós-composição (gola ajustada, dupla) — o que está no palco. */
  corpoEfetivo: ParametrosCorpo;
  /** Difusor pós-composição — o que está no palco. */
  difusorEfetivo: ParametrosDifusor;
  refRolagem: RefObject<HTMLDivElement | null>;
  setAlturaSheet: Dispatch<SetStateAction<number>>;
  alturaSheet: number;
  setAlvoCor: Dispatch<SetStateAction<AlvoCor>>;
  /** Teto do raio do difusor na composição dupla — o mesmo do slider (§5.2). */
  raioDifusorTetoMm?: number;
  /** Quanto a curva S ainda pode ir "para dentro" na dupla — idem (§5.2). */
  tetoDeslocInternoMm?: number;
  /** Teto do raio do corpo na composição dupla — as colunas precisam de ar. */
  raioCorpoTetoMm?: number;
}

interface EstadoManipulacao {
  ferramenta: Ferramenta;
  selecao: MarcaParte | null;
  hover: MarcaParte | null;
  toast: ToastLimiteInfo | null;
}

let estado: EstadoManipulacao = {
  ferramenta: "selecionar",
  selecao: null,
  hover: null,
  toast: null,
};

/** Ponte imperativa com o Configurador — lida na hora do gesto, sem assinar. */
let ponte: RegistroPonte | null = null;

const ouvintes = new Set<() => void>();

function notificar() {
  for (const avisar of ouvintes) avisar();
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

/** Leitura imperativa (event handlers, useFrame) — sem assinar. */
export function lerEstado(): EstadoManipulacao {
  return estado;
}

export function lerPonte(): RegistroPonte | null {
  return ponte;
}

export function registrarPonte(p: RegistroPonte) {
  ponte = p;
}

/** Assinatura reativa para componentes React. */
export function useManipulacao(): EstadoManipulacao {
  return useSyncExternalStore(assinar, lerEstado, lerEstado);
}

/** Igualdade estrita de marcas — deduplicação de hover/seleção. */
export function mesmaMarca(a: MarcaParte | null, b: MarcaParte | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.parte !== b.parte) return false;
  const ca = a as { coluna?: number; indice?: number; inclinada?: boolean };
  const cb = b as { coluna?: number; indice?: number; inclinada?: boolean };
  return (
    ca.coluna === cb.coluna &&
    ca.indice === cb.indice &&
    ca.inclinada === cb.inclinada
  );
}

/**
 * Mesma PARTE lógica, ignorando coluna e variante: em obra dupla o
 * corpo/difusor/estrutural existem 2× — as duas colunas brilham juntas,
 * porque é a mesma peça (§4.2).
 */
export function mesmaParte(a: MarcaParte, b: MarcaParte): boolean {
  if (a.parte !== b.parte) return false;
  if (a.parte === "estrutural" && b.parte === "estrutural") {
    return a.indice === b.indice;
  }
  return true;
}

export function setFerramenta(f: Ferramenta) {
  if (estado.ferramenta === f) return;
  estado = { ...estado, ferramenta: f };
  notificar();
}

/** Qual seção do painel corresponde a cada parte (§5.0). */
const SECAO_POR_PARTE: Record<MarcaParte["parte"], string> = {
  base: "base",
  pastilha: "base",
  estrutural: "corpo",
  corpo: "corpo",
  difusor: "difusor",
  placa: "luz", // PontosDeLuzCtl mora na seção Luz
};

/**
 * §5.0 — selecionar no palco traz o painel junto: abre e rola a seção da
 * parte. O resto é de graça: o scroll dispara o onScroll do contêiner (o
 * rig re-sincroniza) e o IntersectionObserver elege a seção → a câmera já
 * enquadra a parte. Zero mudança no mecanismo existente. O inverso não
 * existe: abrir/rolar seção nunca seleciona.
 */
function sincronizarPainel(marca: MarcaParte) {
  const p = ponte;
  if (!p || typeof window === "undefined") return;
  const secao = SECAO_POR_PARTE[marca.parte];
  const el = p.refRolagem.current?.querySelector<HTMLDetailsElement>(
    `[data-secao="${secao}"]`
  );
  if (el) {
    const reduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    el.open = true;
    el.scrollIntoView({
      behavior: reduzido ? "auto" : "smooth",
      block: "start",
    });
  }
  // No <md, o sheet sai do pico para o painel aparecer (§5.0).
  if (window.innerWidth < 768 && p.alturaSheet === 15) p.setAlturaSheet(45);
  // base/corpo/difusor apontam o alvo de cor; estrutural/placa/pastilha não.
  if (
    marca.parte === "base" ||
    marca.parte === "corpo" ||
    marca.parte === "difusor"
  ) {
    p.setAlvoCor(marca.parte);
  }
}

export function selecionar(marca: MarcaParte) {
  estado = { ...estado, selecao: marca };
  notificar();
  sincronizarPainel(marca);
}

/**
 * Atualiza a marca selecionada SEM a sincronia do painel (§5.0) — usada
 * quando a própria peça muda de índice no meio de um gesto (reordenar a
 * pilha): o painel já está na seção certa, rolar de novo brigaria com o dedo.
 */
export function atualizarSelecao(marca: MarcaParte) {
  estado = { ...estado, selecao: marca };
  notificar();
}

/** Deselecionar nunca rola o painel de volta (§5.0). */
export function deselecionar() {
  if (!estado.selecao) return;
  estado = { ...estado, selecao: null };
  notificar();
}

export function pairar(marca: MarcaParte | null) {
  if (mesmaMarca(estado.hover, marca)) return;
  estado = { ...estado, hover: marca };
  notificar();
}

let timerToast: ReturnType<typeof setTimeout> | null = null;

/** Toast didático (§6): um por vez, some em 4 s; re-empurrar o limite renova o texto sem repiscar. */
export function mostrarToast(texto: string, x: number, y: number) {
  estado = { ...estado, toast: { texto, x, y } };
  notificar();
  if (timerToast) clearTimeout(timerToast);
  timerToast = setTimeout(() => {
    timerToast = null;
    estado = { ...estado, toast: null };
    notificar();
  }, 4000);
}
