/**
 * Montagem v2 · F1 — tipos do módulo de blocos.
 *
 * O usuário monta a luminária empilhando/encostando quatro formas-base
 * (esfera, cubo, cilindro, pirâmide) mais um ponto de luz padronizado.
 * Cada bloco vira um STL estanque PRÓPRIO — oco e furos são procedurais
 * POR FORMA, sem CSG global nesta fase.
 *
 * Convenções (as mesmas do núcleo — ver malha.ts):
 * — unidades em mm; Z é a vertical de impressão (F8);
 * — origem do bloco: centro no eixo Z (x = y = 0), BASE em z = 0;
 * — enrolamento anti-horário visto de fora (normais para fora);
 * — invariante A1: todo bloco tangencia outro bloco ou o plano da mesa
 *   (a matemática mora em tangencia.ts; a UI da F2 pluga nela).
 */

import type { Malha } from "../malha";

export type FormaBloco = "esfera" | "cubo" | "cilindro" | "piramide";

export const FORMAS_BLOCO: readonly FormaBloco[] = [
  "esfera",
  "cubo",
  "cilindro",
  "piramide",
] as const;

export type FormaFuro = "circulo" | "triangulo" | "quadrado";

export const FORMAS_FURO: readonly FormaFuro[] = [
  "circulo",
  "triangulo",
  "quadrado",
] as const;

export interface FurosBloco {
  forma: FormaFuro;
  /** Quantos furos ao redor do bloco (0 = nenhum; o grampeador zera p/ null). */
  quantidade: number;
  /** Tamanho do furo (diâmetro do ○, lado do □/△), em mm. */
  tamanhoMm: number;
}

export interface ParametrosBloco {
  forma: FormaBloco;
  /**
   * Dimensão nominal, em mm — a "caixa" do bloco antes das escalas:
   * diâmetro (esfera, cilindro), aresta (cubo), lado da base = altura
   * (pirâmide). Com escalas em 1, o bloco cabe num cubo de tamanhoMm.
   */
  tamanhoMm: number;
  /** Multiplica a ALTURA (Z). 0,5 = achatada; 1,5 = esticada. */
  escalaAltura: number;
  /**
   * Multiplica largura E profundidade (X e Y juntos) — UMA escala, não
   * duas. Decisão: o requisito trata "alargada/afinada (largura/
   * profundidade)" como UM eixo de variação, e a escala única em planta
   * mantém esfera e cilindro como sólidos de revolução puros (a mesma
   * malhaRevolucao do núcleo serve, sem grade própria). Quando a v2
   * quiser seção oval/retangular, o mecanismo certo já existe no núcleo
   * (`proporcao` da máquina r(θ)) — não duplicar.
   */
  escalaLargura: number;
  /** Casca com cavidade interna (parede = espessuraParedeMm). */
  oca: boolean;
  /** Espessura da parede quando oca, em mm — nunca abaixo de F2. */
  espessuraParedeMm: number;
  /**
   * Furos passantes DE PAREDE (atravessam a casca). Coerência garantida
   * pelo grampeador: furos > 0 força oca = true (furo em massa cheia não
   * ilumina e pediria túneis compridos — não existe no catálogo).
   */
  furos: FurosBloco | null;
  /** Índice na PALETA do catálogo. */
  corIdx: number;
}

/** Mesmo formato de malha do núcleo (posicoes Float32 xyz + trios de índices). */
export type MalhaBloco = Malha;

/**
 * Onde o bloco está e sobre o quê ele assenta (invariante A1).
 * O bloco vive na própria origem (base em z = 0); o contato o coloca na cena.
 */
export interface ContatoBloco {
  /** id do bloco de baixo; null = plano da mesa. */
  sobre: number | null;
  /** Centro do bloco em planta (coordenadas da cena), em mm. */
  xMm: number;
  yMm: number;
  /** Cota Z da BASE do bloco na cena (o z = 0 local mapeia para cá). */
  zBaseMm: number;
}

export interface BlocoNaCena {
  id: number;
  params: ParametrosBloco;
  contato: ContatoBloco;
}

/*
 * Contrato da F2 para o PONTO DE LUZ na cena (decisão registrada aqui
 * para a F2 não improvisar): ponto de luz NÃO é FormaBloco — a cena da
 * F2 amplia o discriminante (ex.: ItemDaCena = BlocoNaCena |
 * PontoDeLuzNaCena) e o seu ApoioDe resolve apoioPontoDeLuz
 * (ponto-de-luz.ts) para esses itens; os params são ignorados (peça
 * padronizada). A matemática de tangencia.ts já aceita qualquer
 * ApoioBloco — nada aqui muda na F2.
 */

/**
 * Funções de contato de UMA forma — a matemática que tangencia.ts consome.
 * Tudo em coordenadas LOCAIS do bloco (base em z = 0, eixo em x = y = 0).
 * Projetadas pensando na esfera, que apoia num PONTO: as regiões de apoio
 * têm raio 0 quando o contato é pontual, e as superfícies são funções
 * z(d) da distância radial ao eixo — quem pousa com offset assenta onde
 * as duas superfícies se tocam (tangencia.ts faz a varredura).
 */
export interface ApoioBloco {
  /** Cota Z do ponto mais alto do bloco. */
  alturaTopoMm(p: ParametrosBloco): number;
  /**
   * Raio da região de apoio no TOPO — até onde algo pousa em cima sem
   * escorregar (0 = ponto: esfera e pirâmide; platô: cubo e cilindro).
   */
  raioApoioSuperiorMm(p: ParametrosBloco): number;
  /** Raio da região de apoio na BASE (0 = ponto: esfera). */
  raioApoioInferiorMm(p: ParametrosBloco): number;
  /**
   * Raio do envelope em planta numa cota z, para tangência LATERAL
   * (blocos encostados). Formas de planta quadrada usam o raio
   * CIRCUNSCRITO (nunca interpenetra visualmente; contato face-a-face
   * fino fica para a F2 ⚑). Fora de [0, topo] → 0.
   */
  raioEnvelopeMm(p: ParametrosBloco, zMm: number): number;
  /**
   * Cota Z da superfície SUPERIOR a uma distância radial d do eixo —
   * a função de assentamento. Esfera: calota; cubo/cilindro: platô;
   * pirâmide: rampa ao ápice (aproximada pelo cone inscrito).
   * null = não há superfície nessa distância (d além do envelope).
   */
  zSuperficieTopoMm(p: ParametrosBloco, dMm: number): number | null;
  /**
   * Elevação da superfície INFERIOR a uma distância radial d do eixo
   * (esfera: calota de baixo sobe conforme d cresce; planos: 0).
   * null = fora do envelope da base.
   */
  zSuperficieBaseMm(p: ParametrosBloco, dMm: number): number | null;
  /**
   * Raios onde a superfície SUPERIOR é descontínua (borda do respiro da
   * esfera oca, borda da abertura de uma casca, raio do bulbo do ponto
   * de luz). A varredura radial de tangencia.ts amostra em passos de
   * 1 mm E nestes raios exatos — sem isto, um pouso na borda penetraria
   * sub-mm no anel real. Opcional: ausente = superfície sem degraus.
   */
  raiosNotaveisMm?(p: ParametrosBloco): number[];
}

/**
 * O contrato que cada primitivo (esfera.ts, cubo.ts, cilindro.ts,
 * piramide.ts) exporta. As implementações seguem a receita de topologia
 * da espec da F1 — não inventam a própria.
 */
export interface PrimitivoBloco {
  forma: FormaBloco;
  /**
   * Malha ESTANQUE do bloco (verificarEstanque + volume > 0 de
   * test/apoio.ts passam para TODAS as variações). Espera params já
   * grampeados; chame grampearBloco antes.
   */
  gerarMalha(p: ParametrosBloco, segmentos?: number): MalhaBloco;
  /** Clampa aos limites fabricáveis desta forma. Idempotente. */
  grampear(p: unknown): ParametrosBloco;
  apoio: ApoioBloco;
}
