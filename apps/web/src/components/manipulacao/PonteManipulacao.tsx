"use client";

/**
 * Ponte Configurador ↔ manipulação direta (§2.1): renderiza null dentro do
 * Configurador e, a cada render, registra no store o snapshot de valores +
 * setters + refs. É este registro que o §5.0 (selecionar → painel vem
 * junto) e o dirigir() da fase de gestos leem na hora do gesto — zero
 * prop-drilling entre o DOM e o Canvas.
 */

import { useEffect, useRef } from "react";
import {
  deselecionar,
  registrarPonte,
  useManipulacao,
  type RegistroPonte,
} from "./estado";

export default function PonteManipulacao(props: RegistroPonte) {
  // O snapshot mais novo entra no store depois de cada render — antes de
  // qualquer evento de ponteiro/teclado que possa lê-lo.
  useEffect(() => {
    registrarPonte(props);
  });

  const { selecao } = useManipulacao();
  const modoAnterior = useRef(props.modo);

  // Se a parte selecionada deixou de existir (trocou de modo, placa
  // removida, estrutural removido, pastilhas sem composição dupla),
  // deseleciona (§2.1/§4.1). Mudar só de coluna (1↔2 luzes) preserva a
  // seleção: a peça continua existindo — o glow ignora a coluna.
  useEffect(() => {
    const trocouModo = modoAnterior.current !== props.modo;
    modoAnterior.current = props.modo;
    if (!selecao) return;
    const dupla = props.pontosDeLuz === 2 || !!props.placa;
    const orfa =
      trocouModo ||
      (selecao.parte === "placa" && !props.placa) ||
      (selecao.parte === "estrutural" &&
        selecao.indice >= props.estruturais.length) ||
      (selecao.parte === "pastilha" && !dupla);
    if (orfa) deselecionar();
  });

  return null;
}
