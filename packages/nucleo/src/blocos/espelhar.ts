/**
 * Montagem v2 — ferramenta ESPELHAR (item 6 do plano de alterações do
 * Davi, 06/08/2026): "inverter a orientação da forma — pirâmide com
 * concavidade para baixo, ao inverter, a concavidade fica pra cima".
 * Decisão registrada: só a inversão VERTICAL nesta fase — o espelho
 * horizontal só muda algo em peça fatiada e fica para quando o uso
 * pedir ⚑.
 *
 * A inversão é PÓS-PROCESSO, como a fatia: os primitivos ignoram
 * `p.invertido` (cada um sabe fazer o bloco em pé, com bordas e furos
 * em coordenadas locais normais), e o espelho é uniforme para as
 * quatro formas. Ordem no pipeline do barrel: primitivo → ESPELHAR →
 * fatiar — a malha chega aqui INTEIRA e a fatia corta DEPOIS, em
 * coordenadas da peça já invertida (`p.fatia` não é tratado aqui, de
 * propósito).
 *
 * Geometria: z' = H − z para todo vértice e enrolamento de cada
 * triângulo INVERTIDO (b ↔ c) — o espelho troca a orientação, e sem a
 * troca as normais apontariam para DENTRO (volume assinado negativo).
 * H é o topo REAL da peça: alturaBrutaMm em cubo, cilindro, pirâmide e
 * esfera pura (a borda encurvada nunca muda a ALTURA do bloco), e a
 * borda do respiro na esfera OCA (o respiro trunca o polo). Espelhar
 * pelo maxZ da própria malha é a MESMA conta que "espelhar por
 * alturaBruta e reassentar" — feita numa passada só, a base volta a
 * z = 0 POR CONSTRUÇÃO, sem resíduo de arredondamento. Convenções do
 * núcleo intactas (malha.ts): mm; Z é a vertical de impressão (F8);
 * origem no eixo com base em z = 0; anti-horário visto de fora.
 */

import type { ApoioBloco, MalhaBloco, ParametrosBloco } from "./tipos";

/**
 * A malha do bloco de ponta-cabeça. Sem `p.invertido`, devolve a MESMA
 * malha (sem cópia — o caminho quente do preview não paga nada).
 */
export function espelharMalhaBloco(
  malha: MalhaBloco,
  p: ParametrosBloco
): MalhaBloco {
  if (!p.invertido) return malha;

  // O pivô do espelho é o topo real da malha (ver cabeçalho): maxZ − z
  // devolve a base a z = 0 exato mesmo quando o topo não chega a
  // alturaBruta (esfera oca) ou quando H não é representável em Float32.
  const n = malha.posicoes.length;
  let maxZ = 0;
  for (let i = 2; i < n; i += 3) {
    if (malha.posicoes[i] > maxZ) maxZ = malha.posicoes[i];
  }

  const posicoes = new Float32Array(n);
  for (let i = 0; i < n; i += 3) {
    posicoes[i] = malha.posicoes[i];
    posicoes[i + 1] = malha.posicoes[i + 1];
    posicoes[i + 2] = maxZ - malha.posicoes[i + 2];
  }

  // O espelho troca a orientação dos triângulos: inverte o enrolamento
  // (b ↔ c) para as normais continuarem para FORA — sem isso o volume
  // assinado fica negativo e o STL sai do avesso.
  const indices = new Uint32Array(malha.indices.length);
  for (let t = 0; t < malha.indices.length; t += 3) {
    indices[t] = malha.indices[t];
    indices[t + 1] = malha.indices[t + 2];
    indices[t + 2] = malha.indices[t + 1];
  }

  return { posicoes, indices };
}

/**
 * Apoio (A1) de um bloco ESPELHADO — delega quando `!p.invertido` e,
 * quando invertido, espelha as respostas com o MESMO H da malha
 * (alturaTopoMm da forma, o topo real da peça — a inversão mapeia
 * [0, H] em [0, H], então a altura não muda): topo e fundo TROCAM de
 * papel, envelope e platô leem a cota espelhada, e os raios em planta
 * ficam como estão. O apoio continua dizendo a verdade sobre a malha
 * REAL — peça flutuando ou atravessando é estado impossível.
 *
 * Dentro do invólucro a base é chamada com os MESMOS params (o
 * `invertido` segue true neles, mas a base não o lê — os primitivos
 * ignoram o campo: a inversão é pós-processo, documentado em tipos.ts).
 */
export function apoioEspelhado(base: ApoioBloco): ApoioBloco {
  /** O H do espelho — o mesmo da malha (topo real da peça em pé). */
  const H = (p: ParametrosBloco) => base.alturaTopoMm(p);

  const apoio: ApoioBloco = {
    // z' = H − z mapeia [0, H] em [0, H]: a altura do topo não muda.
    alturaTopoMm: (p) => base.alturaTopoMm(p),

    // Topo e fundo trocam: o platô que apoiava algo em cima vira a área
    // de contato com o que está embaixo, e vice-versa (a pirâmide
    // invertida apoia num PONTO na mesa e oferece a base larga em cima).
    raioApoioSuperiorMm: (p) =>
      p.invertido ? base.raioApoioInferiorMm(p) : base.raioApoioSuperiorMm(p),
    raioApoioInferiorMm: (p) =>
      p.invertido ? base.raioApoioSuperiorMm(p) : base.raioApoioInferiorMm(p),

    // O envelope em planta na cota z é o da peça em pé na cota espelhada.
    raioEnvelopeMm: (p, zMm) =>
      p.invertido
        ? base.raioEnvelopeMm(p, H(p) - zMm)
        : base.raioEnvelopeMm(p, zMm),

    zSuperficieTopoMm(p, dMm) {
      if (!p.invertido) return base.zSuperficieTopoMm(p, dMm);
      // O fundo de antes virou o topo (null propaga: fora do envelope
      // continua fora do envelope).
      const fundo = base.zSuperficieBaseMm(p, dMm);
      return fundo == null ? null : H(p) - fundo;
    },

    zSuperficieBaseMm(p, dMm) {
      if (!p.invertido) return base.zSuperficieBaseMm(p, dMm);
      const topo = base.zSuperficieTopoMm(p, dMm);
      return topo == null ? null : H(p) - topo;
    },

    // Raios em planta não mudam com a inversão: os degraus continuam
    // nos MESMOS raios, só que na superfície oposta.
    raiosNotaveisMm: (p) => base.raiosNotaveisMm?.(p) ?? [],
  };

  // O platô inscrito acompanha a forma: presente sempre que a base o
  // tem (mesma regra de apoioComFatia — quem não sabe dizer não promete).
  if (base.raioPlatoMm) {
    const platoBase = base.raioPlatoMm.bind(base);
    apoio.raioPlatoMm = (p, zMm) =>
      p.invertido ? platoBase(p, H(p) - zMm) : platoBase(p, zMm);
  }

  return apoio;
}
