/**
 * Montagem v2 · F1 — PONTO DE LUZ padronizado.
 *
 * A única peça NÃO paramétrica do sistema de blocos: base quadrada
 * 50 × 50 mm + bulbo de 40 mm de altura (cápsula: pescoço cilíndrico
 * Ø 40 × 20 mm + semiesfera r = 20). A base abrigará o soquete.
 *
 * Para a F2/F3: o BULBO é o único emissivo (o material da cena acende
 * ele, como o difusor aceso de hoje); a base é opaca na cor do bloco.
 * Por isso gerarMalhaPontoDeLuz devolve DUAS malhas separadas — a UI
 * colore cada uma; o STL une as duas (unirMalhas) num sólido só.
 *
 * ⚑ TODO soquete/fixação (fase posterior, decisão elétrica pendente —
 * kernel E27 vs. LED integrado): cavidade do soquete na base, furo de
 * cabo e fixação ao bloco de baixo. A F1 gera o sólido CHEIO.
 */

import type { Ponto2D } from "../geometria";
import { malhaRevolucao, transladarMalha } from "../malha";
import type { ApoioBloco, MalhaBloco, ParametrosBloco } from "./tipos";

export const PONTO_DE_LUZ = {
  /** Lado da base quadrada, em mm (decisão dos sócios). */
  baseLadoMm: 50,
  /** Altura da base, em mm. ⚑ proposto — precisa caber o soquete. */
  baseAlturaMm: 12,
  /** Altura total do bulbo acima da base, em mm (decisão dos sócios). */
  bulboAlturaMm: 40,
  /** Raio do bulbo (cápsula Ø 40): pescoço 20 mm + semiesfera r = 20. */
  bulboRaioMm: 20,
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

  // Bulbo: cápsula de revolução — pescoço cilíndrico (Ø 40 × 20 mm) +
  // cúpula semiesférica (r = 20) — pelo MESMO caminho de todo o núcleo
  // (malhaRevolucao fecha fundo e topo no eixo com leques de ápice).
  const r = PONTO_DE_LUZ.bulboRaioMm;
  const alturaPescocoMm = PONTO_DE_LUZ.bulboAlturaMm - r;
  const perfil: Ponto2D[] = [
    { x: r, y: 0 },
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
 * Apoio do ponto de luz para a tangência (A1). O anel da base recebe
 * pouso ao redor do bulbo, mas quem chega POR CIMA encontra primeiro a
 * cápsula do bulbo — devolver null para d < raio do bulbo deixava um
 * bloco de fundo fechado "pousar" no anel atravessando o bulbo inteiro
 * (achado da revisão de 06/08; TODO bloco da F1 tem fundo fechado).
 * ⚑ Quando existir a abertura de encaixe (fase posterior), bloco oco
 * poderá envolver o bulbo e pousar no anel — condicionar aqui.
 * Ignora os params (peça padronizada).
 */
export const apoioPontoDeLuz: ApoioBloco = {
  alturaTopoMm: () => alturaPontoDeLuzMm(),
  raioApoioSuperiorMm: () => PONTO_DE_LUZ.baseLadoMm / 2,
  raioApoioInferiorMm: () => PONTO_DE_LUZ.baseLadoMm / 2,
  raioEnvelopeMm(_p: ParametrosBloco, zMm: number) {
    if (zMm < 0 || zMm > alturaPontoDeLuzMm()) return 0;
    if (zMm <= PONTO_DE_LUZ.baseAlturaMm) {
      return (PONTO_DE_LUZ.baseLadoMm / 2) * Math.SQRT2;
    }
    return PONTO_DE_LUZ.bulboRaioMm;
  },
  zSuperficieTopoMm(_p: ParametrosBloco, dMm: number) {
    if (dMm > PONTO_DE_LUZ.baseLadoMm / 2) return null;
    const r = PONTO_DE_LUZ.bulboRaioMm;
    if (dMm < r) {
      // Cápsula do bulbo: cúpula semiesférica sobre o pescoço.
      return (
        PONTO_DE_LUZ.baseAlturaMm +
        (PONTO_DE_LUZ.bulboAlturaMm - r) +
        Math.sqrt(Math.max(0, r * r - dMm * dMm))
      );
    }
    // Anel da base ao redor do bulbo.
    return PONTO_DE_LUZ.baseAlturaMm;
  },
  zSuperficieBaseMm(_p: ParametrosBloco, dMm: number) {
    if (dMm > PONTO_DE_LUZ.baseLadoMm / 2) return null;
    return 0;
  },
  // Degraus da superfície superior: borda do bulbo (cápsula → anel) e
  // borda da base — a varredura de tangencia.ts amostra os raios exatos.
  raiosNotaveisMm: () => [
    PONTO_DE_LUZ.bulboRaioMm,
    PONTO_DE_LUZ.baseLadoMm / 2,
  ],
};
