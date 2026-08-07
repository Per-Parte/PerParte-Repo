/**
 * Montagem v2 — PONTO DE LUZ padronizado (dimensões do item 3 do plano
 * de alterações, pedido do Davi de 06/08: altura 4 cm, largura 2 cm,
 * profundidade 2 cm).
 *
 * A única peça NÃO paramétrica do sistema: uma COLUNA quadrada de
 * 20 × 20 × 40 mm (a base, que abrigará o soquete e — quando o item 3b
 * do plano destravar — vai penetrar na forma hospedeira) com o bulbo em
 * cima. Entre a coluna de 20 e o bulbo de Ø 40 existe um OMBRO CÔNICO a
 * 45°: sem ele, a barriga do bulbo pousaria em balanço de 90° sobre a
 * coluna fina e pediria suporte na impressão. ⚑ o ombro é decisão de
 * engenharia proposta (as alternativas eram afinar o bulbo ou aceitar
 * suporte) — validar com Davi + Caio no impresso.
 *
 * Para a F2/F3: o BULBO é o único emissivo (o material da cena acende
 * ele, como o difusor aceso de hoje); a base é opaca na cor do bloco.
 * Por isso gerarMalhaPontoDeLuz devolve DUAS malhas separadas — a UI
 * colore cada uma; o STL une as duas (unirMalhas) num sólido só.
 *
 * ⚑ TODO soquete/fixação (fase posterior, decisão elétrica pendente —
 * kernel E27 vs. LED integrado): cavidade do soquete na coluna, furo de
 * cabo e a penetração do item 3b. Por ora o sólido é CHEIO.
 */

import type { Ponto2D } from "../geometria";
import { malhaRevolucao, transladarMalha } from "../malha";
import type { ApoioBloco, MalhaBloco, ParametrosBloco } from "./tipos";

export const PONTO_DE_LUZ = {
  /** Lado da coluna quadrada, em mm (decisão do Davi, item 3 do plano). */
  baseLadoMm: 20,
  /** Altura da coluna, em mm (decisão do Davi, item 3 do plano). */
  baseAlturaMm: 40,
  /**
   * Altura do conjunto luminoso acima da coluna, em mm: ombro cônico
   * (10) + pescoço (10) + cúpula (20). ⚑ derivado do ombro a 45°.
   */
  bulboAlturaMm: 40,
  /** Raio do bulbo, em mm (o Ø 40 dos sócios, preservado). */
  bulboRaioMm: 20,
  /** Altura do ombro cônico coluna→bulbo, em mm (45° exatos: 10→20). ⚑ */
  ombroAlturaMm: 10,
} as const;

/** Altura total do ponto de luz (base + bulbo), em mm. */
export function alturaPontoDeLuzMm(): number {
  return PONTO_DE_LUZ.baseAlturaMm + PONTO_DE_LUZ.bulboAlturaMm;
}

/**
 * Quantos pontos de luz uma obra pode ter (espec §6: "ao menos 1 ponto
 * de luz por obra para concluir; máximo nesta fase: 2" — clamp, não
 * erro). ⚑ teto provisório. A cena da F2 consome DAQUI — regra do
 * produto mora no núcleo, nunca vira número mágico no apps/web.
 */
export const PONTOS_DE_LUZ_POR_OBRA = { min: 1, max: 2 } as const;

export interface MalhaPontoDeLuz {
  /** Base quadrada — opaca, cor do bloco. */
  base: MalhaBloco;
  /** Bulbo — EMISSIVO na cena (dado para a F2/F3). */
  bulbo: MalhaBloco;
}

/** Mesmo piso de raio no eixo do resto do núcleo (geometria.ts). */
const RAIO_EIXO_MM = 0.6;

/**
 * Caixa fechada centrada no eixo, base em z = 0 — 8 vértices
 * COMPARTILHADOS nas arestas (cada aresta direcionada fecha o par:
 * estanque por construção), 12 triângulos com normais para fora.
 */
function malhaCaixa(ladoMm: number, alturaMm: number): MalhaBloco {
  const h = ladoMm / 2;
  // 0–3 = fundo (z = 0), 4–7 = topo, em sentido anti-horário visto de +Z.
  const posicoes = new Float32Array([
    -h, -h, 0,
    h, -h, 0,
    h, h, 0,
    -h, h, 0,
    -h, -h, alturaMm,
    h, -h, alturaMm,
    h, h, alturaMm,
    -h, h, alturaMm,
  ]);
  const indices = Uint32Array.from([
    0, 2, 1, 0, 3, 2, // fundo (normal −Z)
    4, 5, 6, 4, 6, 7, // topo (+Z)
    0, 1, 5, 0, 5, 4, // frente (−Y)
    1, 2, 6, 1, 6, 5, // direita (+X)
    2, 3, 7, 2, 7, 6, // trás (+Y)
    3, 0, 4, 3, 4, 7, // esquerda (−X)
  ]);
  return { posicoes, indices };
}

export function gerarMalhaPontoDeLuz(segmentos = 48): MalhaPontoDeLuz {
  const base = malhaCaixa(PONTO_DE_LUZ.baseLadoMm, PONTO_DE_LUZ.baseAlturaMm);

  // Conjunto luminoso, por revolução (o MESMO caminho de todo o núcleo;
  // malhaRevolucao fecha fundo e topo no eixo com leques de ápice):
  // OMBRO cônico a 45° (raio da coluna → raio do bulbo — sem ele a
  // barriga do bulbo pousaria em balanço de 90° sobre a coluna fina) +
  // pescoço cilíndrico curto + cúpula semiesférica.
  const r = PONTO_DE_LUZ.bulboRaioMm;
  const rColuna = PONTO_DE_LUZ.baseLadoMm / 2;
  const ombro = PONTO_DE_LUZ.ombroAlturaMm;
  const alturaPescocoMm = PONTO_DE_LUZ.bulboAlturaMm - r;
  const perfil: Ponto2D[] = [
    { x: rColuna, y: 0 },
    { x: r, y: ombro },
    { x: r, y: alturaPescocoMm },
  ];
  const passosCupula = 12;
  for (let k = 1; k <= passosCupula; k++) {
    const ang = (k / passosCupula) * (Math.PI / 2);
    // Piso RAIO_EIXO no último anel: o ápice fecha a cúpula na cota
    // EXATA de bulboAlturaMm sem anel de vértices coincidentes no polo.
    perfil.push({
      x: Math.max(RAIO_EIXO_MM, r * Math.cos(ang)),
      y: alturaPescocoMm + r * Math.sin(ang),
    });
  }
  const bulbo = transladarMalha(
    malhaRevolucao(perfil, segmentos),
    0,
    0,
    PONTO_DE_LUZ.baseAlturaMm
  );

  return { base, bulbo };
}

/**
 * Apoio do ponto de luz para a tangência (A1), com a geometria nova:
 * o BULBO (Ø 40) é mais largo que a coluna (20 × 20) — o anel de pouso
 * da base antiga deixou de existir. Quem chega por cima encontra a
 * cúpula do bulbo (devolver null ali deixaria um bloco de fundo fechado
 * atravessá-lo — a classe de mentira que a revisão de 06/08 pegou);
 * pousar sobre a cúpula só é estável coaxial, então o raio de apoio
 * superior é 0, como na esfera. Ignora os params (peça padronizada).
 */
export const apoioPontoDeLuz: ApoioBloco = {
  alturaTopoMm: () => alturaPontoDeLuzMm(),
  // Cúpula: qualquer pouso com offset escorrega — só o coaxial fica.
  raioApoioSuperiorMm: () => 0,
  raioApoioInferiorMm: () => PONTO_DE_LUZ.baseLadoMm / 2,
  raioEnvelopeMm(_p: ParametrosBloco, zMm: number) {
    const colunaMm = PONTO_DE_LUZ.baseAlturaMm;
    const r = PONTO_DE_LUZ.bulboRaioMm;
    const rColuna = PONTO_DE_LUZ.baseLadoMm / 2;
    const ombroMm = PONTO_DE_LUZ.ombroAlturaMm;
    const pescocoTopoMm =
      colunaMm + PONTO_DE_LUZ.bulboAlturaMm - r;
    if (zMm < 0 || zMm > alturaPontoDeLuzMm()) return 0;
    // Coluna quadrada: circunscrito (convenção das plantas quadradas).
    if (zMm <= colunaMm) return rColuna * Math.SQRT2;
    // Ombro cônico 45°: o raio cresce 1:1 com a cota.
    if (zMm <= colunaMm + ombroMm) return rColuna + (zMm - colunaMm);
    // Pescoço cilíndrico.
    if (zMm <= pescocoTopoMm) return r;
    // Cúpula semiesférica.
    const acima = zMm - pescocoTopoMm;
    return Math.sqrt(Math.max(0, r * r - acima * acima));
  },
  zSuperficieTopoMm(_p: ParametrosBloco, dMm: number) {
    const r = PONTO_DE_LUZ.bulboRaioMm;
    // O bulbo é a silhueta de cima inteira: além dele, nada pousa.
    if (dMm > r) return null;
    return (
      PONTO_DE_LUZ.baseAlturaMm +
      (PONTO_DE_LUZ.bulboAlturaMm - r) +
      Math.sqrt(Math.max(0, r * r - dMm * dMm))
    );
  },
  zSuperficieBaseMm(_p: ParametrosBloco, dMm: number) {
    if (dMm > PONTO_DE_LUZ.baseLadoMm / 2) return null;
    return 0;
  },
  // Degrau da superfície superior: a borda do bulbo (cúpula → nada) —
  // a varredura de tangencia.ts amostra o raio exato.
  raiosNotaveisMm: () => [PONTO_DE_LUZ.bulboRaioMm],
};
