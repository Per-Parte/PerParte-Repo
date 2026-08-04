/**
 * Junta inclinada — a cabeça do Gio Task: o difusor inteiro gira ~20° E
 * desloca de lado, pendendo sobre o topo da coluna. A coluna fica reta.
 *
 * Os dois gestos moram na MESMA junta, pelo padrão que a PLACA abriu:
 * um pescoço vertical curto carrega a fêmea F5 (a junta física continua
 * horizontal, redonda e padronizada — F5 intocado), e a CABEÇA (o difusor
 * sem a fêmea, com face de baixo plana — a "cara de luz") é gerada pela
 * malhaRevolucao de sempre, girada e deslocada, fundida no pescoço.
 *
 * A altura do pescoço é DERIVADA, não escolhida: exatamente o necessário
 * para a borda mais baixa da cabeça inclinada nunca tocar o macho do corpo
 * (fica ≥ 8 mm acima do plano do encaixe, folga de 2 mm sobre o anel).
 * Inclinação + deslocamento maiores = pescoço mais alto, sozinho.
 *
 * Produção ⚑: imprime em pé (fêmea na mesa); as paredes da cabeça ganham
 * a inclinação como balanço extra — teto de 25° deixa folga dentro de F4
 * para as formas do catálogo; validar impresso. Nesta versão a cabeça
 * inclinada é lisa: textura, vazado, facetas e corte não se aplicam.
 */

import {
  ENCAIXES,
  RAIO_LIVRE_MIOLO_MM,
  REGRAS,
} from "./regras";
import {
  perfilDifusor,
  pontosFemea,
  type ParametrosDifusor,
  type Ponto2D,
} from "./geometria";
import {
  malhaRevolucao,
  rotacionarMalhaEmY,
  transladarMalha,
  unirMalhas,
  type Malha,
} from "./malha";

export interface JuntaInclinada {
  /** Inclinação da cabeça, em graus da vertical. */
  inclinacaoGraus: number;
  /** Deslocamento lateral do centro da cabeça, em mm (para o lado do tombo). */
  deslocamentoMm: number;
}

export const LIMITES_JUNTA = {
  inclinacaoGraus: { min: 5, max: 25, passo: 1 },
  deslocamentoMm: { min: 0, max: 40, passo: 2 },
} as const;

export const JUNTA_PADRAO: JuntaInclinada = {
  inclinacaoGraus: 20,
  deslocamentoMm: 24,
};

/** Raio do topo do pescoço — o plugue que entra na cabeça. */
const RAIO_TOPO_PESCOCO_MM = 14;
/** Quanto o topo do pescoço afunda na cabeça (funde na malha). */
const AFUNDA_MM = 6;
/** Folga da borda mais baixa da cabeça sobre o plano do encaixe. */
const FOLGA_SOBRE_ENCAIXE_MM = 8;

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

export function grampearJunta(
  v: unknown,
  raioDifusorMm: number
): JuntaInclinada | undefined {
  if (!v || typeof v !== "object") return undefined;
  const bruto = v as Partial<JuntaInclinada>;
  const inclinacaoGraus = Number(bruto.inclinacaoGraus);
  if (!Number.isFinite(inclinacaoGraus) || inclinacaoGraus <= 0) {
    return undefined;
  }
  // O deslocamento para de crescer antes de a cabeça sair de cima do
  // pescoço — o eixo da montagem precisa continuar sob a face de baixo.
  const deslocamentoMaximo = Math.min(
    LIMITES_JUNTA.deslocamentoMm.max,
    Math.max(0, raioDifusorMm - 25)
  );
  return {
    inclinacaoGraus: clamp(
      inclinacaoGraus,
      LIMITES_JUNTA.inclinacaoGraus.min,
      LIMITES_JUNTA.inclinacaoGraus.max
    ),
    deslocamentoMm: clamp(
      Number(bruto.deslocamentoMm) || 0,
      LIMITES_JUNTA.deslocamentoMm.min,
      deslocamentoMaximo
    ),
  };
}

/** Geometria derivada da junta (pescoço e ancoragem da cabeça). */
export function medidasJunta(difusor: ParametrosDifusor, junta: JuntaInclinada) {
  const rad = (junta.inclinacaoGraus * Math.PI) / 180;
  const d = junta.deslocamentoMm;
  const raioT = difusor.raioMm;
  // Âncora: a face de baixo da cabeça encosta no topo do pescoço na borda
  // da frente dele (x = raio do pescoço), afundando AFUNDA_MM.
  // z da face de baixo no mundo: z(x) = zCentro + tan(i)·(d − x).
  const pescocoMm = Math.ceil(
    AFUNDA_MM +
      FOLGA_SOBRE_ENCAIXE_MM +
      Math.sin(rad) * raioT +
      Math.max(0, Math.tan(rad) * (d - RAIO_TOPO_PESCOCO_MM))
  );
  const zCentroMm =
    pescocoMm - AFUNDA_MM - Math.tan(rad) * (d - RAIO_TOPO_PESCOCO_MM);
  return { rad, pescocoMm, zCentroMm };
}

/** Perfil do pescoço da junta: fêmea F5 embaixo, afunila até o plugue. */
export function perfilPescocoJunta(
  alturaMm: number,
  folgaMm = ENCAIXES.folgaPadraoMm
): Ponto2D[] {
  const anel = ENCAIXES.corpoDifusor.anel;
  const raioPeMm = anel.externoMm + folgaMm + REGRAS.F.paredeDifusorMm.min + 1;
  const alturaFemea = anel.alturaMm + ENCAIXES.folgaProfundidadeMm;
  const pontos = pontosFemea(anel, folgaMm);
  pontos.push({ x: raioPeMm, y: 0 });
  pontos.push({ x: raioPeMm, y: alturaFemea + 1.5 });
  const n = 10;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    pontos.push({
      x: raioPeMm + (RAIO_TOPO_PESCOCO_MM - raioPeMm) * Math.pow(u, 0.85),
      y: alturaFemea + 1.5 + (alturaMm - alturaFemea - 1.5) * u,
    });
  }
  pontos.push({ x: 0.6, y: alturaMm });
  return pontos;
}

/**
 * A malha completa da cabeça inclinada (pescoço + cabeça), preview e STL.
 * A cabeça pende para +X; o deslocamento vai para o mesmo lado.
 */
export function malhaCabecaInclinada(
  difusor: ParametrosDifusor,
  junta: JuntaInclinada,
  segmentos: number
): Malha {
  const { rad, pescocoMm, zCentroMm } = medidasJunta(difusor, junta);
  const cabeca = rotacionarMalhaEmY(
    malhaRevolucao(perfilDifusor(difusor, ENCAIXES.folgaPadraoMm, false), segmentos),
    rad
  );
  return unirMalhas(
    malhaRevolucao(perfilPescocoJunta(pescocoMm), segmentos),
    transladarMalha(cabeca, junta.deslocamentoMm, 0, zCentroMm)
  );
}

/**
 * Desvio lateral do centro de massa da cabeça, em mm — alimenta o E1/E3
 * (a escada da estabilidade: base alarga → contrapeso → aviso honesto).
 */
export function desvioCabecaMm(
  difusor: ParametrosDifusor,
  junta?: JuntaInclinada
): number {
  if (!junta) return 0;
  const rad = (junta.inclinacaoGraus * Math.PI) / 180;
  return junta.deslocamentoMm + Math.sin(rad) * difusor.alturaMm * 0.5;
}

/** Raio mínimo da cabeça para o miolo elétrico caber inclinado. ⚑ */
export const RAIO_MINIMO_CABECA_MM = Math.ceil(
  RAIO_LIVRE_MIOLO_MM / Math.cos((LIMITES_JUNTA.inclinacaoGraus.max * Math.PI) / 180) + 25
);
