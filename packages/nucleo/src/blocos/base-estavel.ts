/**
 * Montagem v2 — BASE ESTÁVEL NO CHÃO (item 1 do plano de alterações,
 * pedido do Davi em 06/08/2026).
 *
 * "Sempre que o usuário adicionar a primeira parte da luminária, a forma
 * deverá ter uma área de contato com o chão que sustente a forma" — o
 * exemplo é a esfera, que precisa nascer com a parte de baixo fatiada.
 *
 * Está implementado como REGRA GERAL, não como caso especial da esfera:
 * a peça mede a própria área de contato (`raioPlatoMm` — o raio inscrito
 * da seção horizontal, que já existia por causa da ferramenta Fatiar) e,
 * se ela for pequena demais, devolve o corte que a torna estável. Cubo,
 * cilindro e pirâmide em pé já têm base cheia: a conta reconhece e não
 * corta nada. E quando existirem a borda de fundo (item 2) e o espelhar
 * (item 6), a peça que perder o pé vai cair aqui sozinha — foi para isso
 * que a regra ficou geral.
 *
 * O corte é a própria fatia (`FatiaBloco` no eixo Z, guardando o lado de
 * cima): nenhum mecanismo novo, e o usuário pode removê-lo no painel da
 * ferramenta Fatiar — limite vira controle, nunca imposição.
 */

import type { ApoioBloco, FatiaBloco, ParametrosBloco } from "./tipos";
import { alturaBrutaMm, larguraBrutaMm, limitesFatiaMm } from "./limites";

/**
 * Fração da largura da peça que a base plana precisa ter de raio para a
 * peça se sustentar. ⚑ proposto: numa esfera de 100 mm dá um pé chato de
 * 50 mm de diâmetro — lê-se como intencional e a primeira camada da
 * impressão adere de verdade (é argumento de fabricação, não de estética).
 * Validar impresso com o Davi.
 */
export const BASE_ESTAVEL_FRACAO = 0.25;

/** Piso absoluto do raio da base plana, em mm ⚑ (peças pequenas). */
export const BASE_ESTAVEL_MINIMO_MM = 8;

/**
 * Quanto da altura o corte pode consumir, no máximo ⚑ — freio defensivo:
 * antes de esmagar a peça para dar um pé, é melhor deixá-la como está e
 * a estabilidade virar assunto do usuário. Nunca dispara dentro dos
 * clamps atuais (medido: o pior caso come ~10% da altura).
 */
export const BASE_ESTAVEL_ALTURA_MAX_FRACAO = 0.25;

/** Passo da varredura de cotas, em mm — casa com o slider (passo 1 mm). */
const PASSO_VARREDURA_MM = 0.5;

/** Raio que a base plana precisa ter para sustentar a peça, em mm. */
export function raioBaseEstavelMm(p: ParametrosBloco): number {
  return Math.max(
    BASE_ESTAVEL_MINIMO_MM,
    BASE_ESTAVEL_FRACAO * larguraBrutaMm(p)
  );
}

/**
 * O corte que dá pé à peça, ou null quando não é preciso (ela já apoia
 * numa área que a sustenta), quando a peça já tem um corte próprio (a
 * escolha do usuário vence) ou quando nem cortando dá — casos em que
 * mexer seria pior que não mexer.
 *
 * Recebe o apoio da forma para medir a seção; passe o apoio já composto
 * (o do barrel), para a conta ver a peça como ela realmente é.
 */
export function fatiaDeBaseEstavel(
  p: ParametrosBloco,
  apoio: ApoioBloco
): FatiaBloco | null {
  // Corte do usuário manda: não sobrescreve escolha dele.
  if (p.fatia) return null;
  // Forma que não declara a seção fica intocada (o ponto de luz, por
  // exemplo: a base dele já é chata por construção).
  const platoEm = apoio.raioPlatoMm;
  if (!platoEm) return null;

  const alvoMm = raioBaseEstavelMm(p);
  // A área de contato REAL da peça: a seção inscrita na cota do chão.
  if (platoEm(p, 0) >= alvoMm) return null;

  const faixa = limitesFatiaMm(p, "z");
  if (faixa.min > faixa.max) return null;
  const teto = Math.min(
    faixa.max,
    alturaBrutaMm(p) * BASE_ESTAVEL_ALTURA_MAX_FRACAO
  );
  for (let z = faixa.min; z <= teto + 1e-9; z += PASSO_VARREDURA_MM) {
    if (platoEm(p, z) >= alvoMm) {
      // Guarda o lado de CIMA: o corte remove a ponta de baixo e a malha
      // é reassentada em z = 0 (convenção do núcleo).
      return { eixo: "z", posicaoMm: z, lado: "maior" };
    }
  }
  // O alvo cheio não coube no orçamento de altura (a pirâmide de
  // ponta-cabeça precisaria perder METADE para ter pé de 25% da
  // largura). Fallback honesto: o MELHOR pé que o orçamento permite,
  // desde que atinja o mínimo absoluto — um pé pequeno sustenta; ápice
  // no chão não sustenta nada.
  if (platoEm(p, teto) >= BASE_ESTAVEL_MINIMO_MM) {
    return { eixo: "z", posicaoMm: teto, lado: "maior" };
  }
  return null;
}
