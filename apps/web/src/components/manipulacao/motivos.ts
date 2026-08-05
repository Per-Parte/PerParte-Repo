/**
 * Textos didáticos de limite por parâmetro (§6): cópias EXATAS dos
 * motivoMin/motivoMax dos painéis (os originais ficam lá — duplicar é
 * aditivo e barato) + os novos da tabela §5.3 onde o painel não tem texto.
 * Voz: pt-BR 6,5–7, honesto-técnico, nunca código interno.
 */

import { LIMITES_CRIAR, deslocamentoMaximoMm } from "@per-parte/nucleo";
import { lerPonte } from "./estado";
import type { AlvoGesto } from "./dirigir";

/** Toast neutro do snap do Girar na cabeça (§5.3) — não é limite, é estado. */
export const MOTIVO_SNAP_JUNTA =
  "Endireitou — a cabeça voltou a assentar reta.";

const SUPORTE_ESPINHA =
  "Mais inclinado que isso, a espinha pediria suporte. O limite cresce com a altura — um corpo mais alto pode se deslocar mais.";

const ESPIRAL =
  "A espiral vai até 90° — mais que isso a parede helicoidal pediria suporte.";

/**
 * O motivo humano de o gesto ter parado (§5.2/§6). Null = sem texto para
 * este limite (o toast simplesmente não aparece).
 */
export function motivoDoLimite(
  alvo: AlvoGesto,
  lado: "min" | "max"
): string | null {
  const p = lerPonte();

  switch (alvo.tipo) {
    case "base":
      if (alvo.campo !== "raioMm") return null;
      return lado === "max"
        ? "Mais larga não cabe no prato da impressora."
        : "Menor que isso a base não segura o conjunto em pé — e o encaixe precisa caber nela.";

    case "corpo":
      switch (alvo.campo) {
        case "alturaMm":
          return lado === "max"
            ? `A impressora vai até ${LIMITES_CRIAR.corpo.alturaMm.max / 10} cm por peça. Quer mais alta? No modo Montar, some hastes na seção Corpo — é assim que a luminária passa de meio metro.`
            : null;
        case "volumeBojoMm":
          return lado === "max"
            ? "Mais volume inclinaria a parede além do que imprime sem suporte — e suporte estraga o acabamento."
            : "Afinar mais encostaria no miolo elétrico, que precisa de folga livre por segurança.";
        case "deslocamentoMm": {
          if (lado === "max") return SUPORTE_ESPINHA;
          // "Para dentro" na dupla: o mesmo texto dinâmico do slider.
          const dMax = p
            ? deslocamentoMaximoMm(p.criar.corpo.alturaMm)
            : Infinity;
          return p?.tetoDeslocInternoMm != null &&
            p.tetoDeslocInternoMm < dMax
            ? "Para dentro só até aqui: as colunas precisam de ar entre elas. Aumente a separação — ou debruce para fora, que é livre."
            : SUPORTE_ESPINHA;
        }
        case "torcaoGraus":
          return ESPIRAL;
        // posicaoBojo/posicaoDobra: curso curto, sem motivo (§5.3).
        default:
          return null;
      }

    case "perfilLivre":
      // A silhueta livre esbarra nos mesmos muros da barriga (§5.3) — e,
      // na composição de duas colunas, no ar entre elas.
      if (lado === "max") {
        return p?.raioCorpoTetoMm != null &&
          p.raioCorpoTetoMm < LIMITES_CRIAR.corpo.perfilLivreRaioMm.max
          ? "Na composição de duas colunas, os corpos precisam de ar entre eles — aumente a separação para engordar mais."
          : "Mais volume inclinaria a parede além do que imprime sem suporte — e suporte estraga o acabamento.";
      }
      return "Afinar mais encostaria no miolo elétrico, que precisa de folga livre por segurança.";

    case "difusor":
      if (alvo.campo !== "raioMm") return null;
      if (lado === "min") {
        return "Mais fechado que isso, o difusor encostaria na lâmpada — ela precisa de folga livre por segurança.";
      }
      return p?.raioDifusorTetoMm != null &&
        p.raioDifusorTetoMm < LIMITES_CRIAR.difusor.raioMm.max
        ? "Na composição de duas colunas, os difusores precisam de ar entre eles — aumente a separação para abrir mais."
        : "Mais aberto não cabe no prato da impressora.";

    case "junta":
      if (lado !== "max") return null;
      return alvo.campo === "inclinacaoGraus"
        ? "Mais inclinada que isso, as paredes da cabeça pediriam suporte na impressão."
        : "Mais para o lado que isso, a cabeça sairia de cima do próprio pescoço.";

    case "placa":
      return alvo.campo === "inclinacaoGraus" && lado === "max"
        ? "Mais deitado que isso o peso do disco sai de cima da base."
        : null;

    case "separacao":
      return lado === "min"
        ? "ajustada para cima: as colunas precisam de ar entre elas — o mostrador mostra o valor real"
        : null;
  }
}
