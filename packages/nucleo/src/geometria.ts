/**
 * Geometria paramétrica do arquétipo de revolução — base, corpo e difusor.
 *
 * TypeScript puro e determinístico, sem dependência de Three.js: o mesmo
 * perfil que desenha o preview no navegador gera a malha de produção (STL).
 *
 * Toda parte é um perfil 2D (meridiano raio × altura, do eixo embaixo ao
 * eixo em cima) revolucionado. O corpo pode ainda curvar a própria ESPINHA
 * (deslocamento lateral em S, com as pontas sempre verticais) — os encaixes
 * continuam horizontais e padronizados (F5), e a inclinação da espinha fica
 * dentro do balanço imprimível (F4).
 */

import { ENCAIXES, RAIO_LIVRE_MIOLO_MM, REGRAS } from "./regras";
import { reservaTanTextura, type FamiliaTextura } from "./texturas";

export interface Ponto2D {
  /** Raio (distância ao eixo de revolução), em mm. */
  x: number;
  /** Altura, em mm. */
  y: number;
}

export type CurvaBase = "reta" | "cone" | "concava" | "degrau";
export type FormaDifusor = "globo" | "sino" | "cone" | "lanterna";

export interface ParametrosBase {
  alturaMm: number;
  raioMm: number;
  curva: CurvaBase;
}

export interface ParametrosCorpo {
  alturaMm: number;
  /** Barriga do perfil, em mm (negativo = cintura). */
  volumeBojoMm: number;
  /** Posição vertical do bojo: -1 (baixo) a +1 (alto). */
  posicaoBojo: number;
  /** Número de ondas horizontais ao longo da altura (0 = liso). */
  ondulacao: number;
  /** Profundidade da onda, em mm — limitada por F4 (balanço). */
  amplitudeOndaMm: number;
  /** Gomos verticais esculpidos ao redor (0 = liso). */
  gomos: number;
  /** Profundidade dos gomos, em mm — só esculpem para dentro. */
  profundidadeGomosMm: number;
  /** Giro dos gomos da base ao topo, em graus (espiral). */
  torcaoGraus: number;
  /** Espinha: deslocamento lateral do topo, em mm (corpo em S). */
  deslocamentoMm: number;
  /** Espinha: onde a dobra acontece, -1 (baixo) a +1 (alto). */
  posicaoDobra: number;
  /**
   * Família da textura (ausente = "gomos", o comportamento original).
   * As famílias que variam com a altura pagam o próprio balanço:
   * o perfil desconta esse custo do orçamento F4 (ver texturas.ts).
   */
  familiaTextura?: FamiliaTextura;
  /** Repetição das famílias que não são gomos. */
  repeticaoTextura?: number;
  /**
   * Silhueta livre (modo avançado): 5 raios de controle em
   * t = 0,1 / 0,3 / 0,5 / 0,7 / 0,9. Quando presente, substitui
   * bojo/posição/ondulação; gomos e espinha continuam valendo.
   */
  perfilLivre?: number[];
  /**
   * Berço (gola): parede que sobe ACIMA do plano do encaixe, com o macho
   * F5 rebaixado dentro — o difusor assenta no encaixe e a gola o abraça
   * (o gesto do Weight: cilindro de boca oblíqua com a esfera dentro).
   * O perfil não exige altura monótona, então é só polilinha.
   */
  gola?: GolaCorpo;
  /**
   * Corte da borda da GOLA (oblíquo/dentes) — só vale com gola presente:
   * sem ela, o topo do corpo é o macho F5 e não é terminação livre.
   */
  corte?: import("./terminacao").CorteBorda;
}

export interface GolaCorpo {
  /** Quanto a gola sobe acima do plano do encaixe, em mm. */
  alturaMm: number;
  /** Raio INTERNO da boca, em mm — o difusor precisa caber dentro. */
  raioMm: number;
}

/** Parede da gola, em mm (constante da v1). */
export const ESPESSURA_GOLA_MM = 2.4;

export interface ParametrosDifusor {
  forma: FormaDifusor;
  alturaMm: number;
  raioMm: number;
  /** Gomos verticais (plissê) ao redor (0 = liso). */
  gomos: number;
  /** Profundidade dos gomos, em mm. */
  profundidadeGomosMm: number;
  /**
   * Vazado do difusor (preview; produção aguarda booleanos ⚑ — o STL de
   * difusor vazado fica bloqueado na interface até lá).
   */
  vazado?: import("./vazados").ParametrosVazado;
  /**
   * Corte da borda livre (topo): oblíquo ou dentes — máquina z(θ).
   * Diferente do vazado, é malha pura e SAI em produção.
   */
  corte?: import("./terminacao").CorteBorda;
  /**
   * Junta inclinada (o gesto do Gio Task): a cabeça inteira gira e
   * desloca sobre um pescoço vertical que carrega a fêmea F5. Quando
   * presente, textura/vazado/facetas/corte não se aplicam à cabeça. ⚑
   */
  junta?: import("./junta").JuntaInclinada;
}

export interface AnelEncaixe {
  externoMm: number;
  internoMm: number;
  alturaMm: number;
}

/** Espinha curva do corpo (para a malha e para a cena). */
export interface EspinhaLateral {
  deslocamentoMm: number;
  posicaoDobra: number;
  alturaMm: number;
}

const RA = ENCAIXES.baseCorpo.raioMm;
const RB = ENCAIXES.corpoDifusor.raioMm;

/** Raio mínimo de qualquer ponto do perfil (fecha o sólido sem degenerar). */
const RAIO_EIXO_MM = 0.6;

/** Posições (t) dos 5 raios de controle da silhueta livre. */
export const TS_PERFIL_LIVRE = [0.1, 0.3, 0.5, 0.7, 0.9] as const;

/** Piso da inclinação que o PERFIL sempre conserva (tan), mesmo com a
 *  espinha no máximo — é o `Math.max(0.25, …)` da cascata de clamps. */
const TAN_MINIMO_PERFIL = 0.25;

/**
 * Deslocamento lateral máximo da espinha para uma dada altura — derivado de
 * F4, agora até o fim do orçamento (OFF): a dobra em S tem inclinação de
 * pico ~1,5·d/(0,7·h), e no domínio das tangentes os custos SOMAM exato
 * (deslocamentos horizontais por unidade de altura). O que a espinha pode
 * gastar é tudo que sobra do balanço depois do piso do perfil:
 *
 *     1,5·d/(0,7·h) ≤ tan(F4) − TAN_MINIMO_PERFIL  →  d ≤ 0,35·h
 *
 * (com F4 = 45°). O antigo 0,22·h reservava mais margem para o perfil;
 * quem paga o alcance extra agora é o próprio perfil, que a cascata aplaina
 * até o piso quando o corpo está debruçado — limite como ferramenta.
 * Teto em mm = 0,35 × altura máxima do Criar (240 mm). O tombo que o
 * alcance novo provoca é problema do E1/E3, não do F4. ⚑ validar impresso.
 */
export function deslocamentoMaximoMm(alturaMm: number): number {
  const fator =
    ((Math.tan((REGRAS.F.balancoMaximoGraus * Math.PI) / 180) -
      TAN_MINIMO_PERFIL) *
      0.7) /
    1.5;
  return Math.min(85, Math.round(fator * alturaMm));
}

/** Fator 0→1 da dobra em S (pontas com tangente vertical). */
function fatorEspinha(t: number, posicaoDobra: number): number {
  const u = Math.min(1, Math.max(0, t));
  const k = Math.pow(2, Math.min(1, Math.max(-1, posicaoDobra)));
  const v = Math.pow(u, k);
  return v * v * (3 - 2 * v);
}

/** Deslocamento X do eixo do corpo numa altura y, em mm. */
export function deslocamentoEspinhaMm(
  yMm: number,
  espinha: EspinhaLateral
): number {
  if (!espinha.deslocamentoMm || espinha.alturaMm <= 0) return 0;
  const d = Math.min(
    Math.abs(espinha.deslocamentoMm),
    deslocamentoMaximoMm(espinha.alturaMm)
  );
  return (
    Math.sign(espinha.deslocamentoMm) *
    d *
    fatorEspinha(yMm / espinha.alturaMm, espinha.posicaoDobra)
  );
}

/**
 * Anel macho no topo de uma peça (a face superior fica em `y`).
 */
export function pontosMacho(anel: AnelEncaixe, y: number): Ponto2D[] {
  return [
    { x: anel.externoMm, y },
    { x: anel.externoMm, y: y + anel.alturaMm },
    { x: anel.internoMm, y: y + anel.alturaMm },
    { x: anel.internoMm, y },
    { x: RAIO_EIXO_MM, y },
  ];
}

/**
 * Canaleta fêmea no fundo de uma peça (a face inferior fica em y = 0).
 */
export function pontosFemea(anel: AnelEncaixe, folgaMm: number): Ponto2D[] {
  const profundidade = anel.alturaMm + ENCAIXES.folgaProfundidadeMm;
  return [
    { x: RAIO_EIXO_MM, y: 0 },
    { x: anel.internoMm - folgaMm, y: 0 },
    { x: anel.internoMm - folgaMm, y: profundidade },
    { x: anel.externoMm + folgaMm, y: profundidade },
    { x: anel.externoMm + folgaMm, y: 0 },
  ];
}

/**
 * Perfil da base. `escala` é o alargamento imposto pela estabilidade (E2).
 * `comMacho` = false gera a base sem o anel central (usada na base dupla,
 * que recebe pastilhas de encaixe nas duas posições).
 */
export function perfilBase(
  p: ParametrosBase,
  escala = 1,
  comMacho = true
): Ponto2D[] {
  const r = p.raioMm * escala;
  const h = p.alturaMm;
  const pontos: Ponto2D[] = [{ x: RAIO_EIXO_MM, y: 0 }];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let rr: number;
    if (p.curva === "reta") rr = r - (r - RA) * Math.pow(u, 6);
    else if (p.curva === "cone") rr = r + (RA - r) * u;
    else if (p.curva === "concava") rr = RA + (r - RA) * Math.pow(1 - u, 1.7);
    else
      rr =
        u < 0.55
          ? r
          : u < 0.63
            ? r - (r - RA) * ((u - 0.55) / 0.08)
            : RA;
    pontos.push({ x: Math.max(rr, RAIO_EIXO_MM), y: u * h });
  }
  if (comMacho) pontos.push(...pontosMacho(ENCAIXES.baseCorpo.anel, h));
  else pontos.push({ x: RAIO_EIXO_MM, y: h });
  return pontos;
}

/** Catmull-Rom 1D com extremos presos, para a silhueta livre. */
function interpolarCatmull(ts: number[], vs: number[], u: number): number {
  let i = ts.length - 2;
  for (let k = 0; k < ts.length - 1; k++) {
    if (u >= ts[k] && u <= ts[k + 1]) {
      i = k;
      break;
    }
  }
  if (u < ts[0]) i = 0;
  const x = (u - ts[i]) / (ts[i + 1] - ts[i]);
  const p1 = vs[i];
  const p2 = vs[i + 1];
  const p0 = i > 0 ? vs[i - 1] : p1;
  const p3 = i + 2 < vs.length ? vs[i + 2] : p2;
  return (
    0.5 *
    (2 * p1 +
      (p2 - p0) * x +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * x * x +
      (-p0 + 3 * p1 - 3 * p2 + p3) * x * x * x)
  );
}

/**
 * Perfil do corpo. Fêmea embaixo, macho em cima. Os raios de QUALQUER
 * caminho (bojo/ondas ou silhueta livre) passam por uma CASCATA DE CLAMPS:
 * miolo elétrico, pé da canaleta e inclinação máxima F4 (reduzida quando a
 * espinha está curvada). Sliders isolados dentro da faixa não garantem a
 * combinação — 12 ondas de 6 mm num corpo baixo passariam de 77° de
 * balanço — então arrastar além do permitido só "encosta" no limite,
 * nunca dá erro.
 */
export function perfilCorpo(
  p: ParametrosCorpo,
  folgaMm = ENCAIXES.folgaPadraoMm
): Ponto2D[] {
  const { alturaMm: h } = p;
  const anelBase = ENCAIXES.baseCorpo.anel;
  const alturaFemea = anelBase.alturaMm + ENCAIXES.folgaProfundidadeMm;
  const raioPeMm =
    anelBase.externoMm + folgaMm + REGRAS.F.paredeEstruturalMm.min;

  const n = 56;
  const livre =
    p.perfilLivre && p.perfilLivre.length === TS_PERFIL_LIVRE.length
      ? p.perfilLivre
      : null;

  const raios: number[] = [];
  if (livre) {
    const ts = [0, ...TS_PERFIL_LIVRE, 1];
    const vs = [RA, ...livre, RB];
    for (let i = 0; i <= n; i++) raios.push(interpolarCatmull(ts, vs, i / n));
  } else {
    const k = Math.pow(2, -p.posicaoBojo * 1.2);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      let rr = RA + (RB - RA) * u;
      rr += p.volumeBojoMm * Math.sin(Math.PI * Math.pow(u, k));
      rr += p.amplitudeOndaMm * Math.sin(u * p.ondulacao * Math.PI * 2);
      raios.push(rr);
    }
  }

  // Cascata de clamps (na ordem: piso físico, depois inclinação F4).
  // A textura paga o próprio balanço aqui: o perfil aplaina o que ela gasta.
  const dY = h / n;
  const dNorm = Math.min(
    Math.abs(p.deslocamentoMm ?? 0),
    deslocamentoMaximoMm(h)
  );
  const reservaTextura = reservaTanTextura({
    familia: p.familiaTextura,
    gomos: p.gomos,
    profundidadeMm: p.profundidadeGomosMm,
    repeticao: p.repeticaoTextura,
    alturaMm: h,
  });
  const tanMax = Math.max(
    TAN_MINIMO_PERFIL,
    Math.tan((REGRAS.F.balancoMaximoGraus * Math.PI) / 180) -
      (1.5 * dNorm) / (0.7 * h) -
      reservaTextura
  );
  // Com gola, o topo da lateral precisa chegar na parede externa dela —
  // mesmo mecanismo do pé da fêmea, só que na outra ponta.
  const gola = p.gola;
  const raioGolaExtMm = gola ? gola.raioMm + ESPESSURA_GOLA_MM : 0;
  const pisoDe = (i: number) => {
    let r = RAIO_LIVRE_MIOLO_MM;
    if (i * dY < alturaFemea + 1) r = Math.max(r, raioPeMm);
    if (gola && i * dY > h - 6) r = Math.max(r, raioGolaExtMm);
    return r;
  };
  for (let i = 0; i <= n; i++) {
    raios[i] = Math.max(raios[i], pisoDe(i));
  }
  for (let i = 1; i <= n; i++) {
    raios[i] = Math.min(
      Math.max(raios[i], raios[i - 1] - tanMax * dY),
      raios[i - 1] + tanMax * dY
    );
  }
  for (let i = n - 1; i >= 0; i--) {
    raios[i] = Math.min(
      Math.max(raios[i], raios[i + 1] - tanMax * dY),
      raios[i + 1] + tanMax * dY
    );
    raios[i] = Math.max(raios[i], pisoDe(i));
  }

  const pontos = pontosFemea(anelBase, folgaMm);
  for (let i = 0; i <= n; i++) pontos.push({ x: raios[i], y: i * dY });
  if (gola) {
    // A gola sobe acima do plano do encaixe e desce por dentro até a
    // prateleira; o macho fica rebaixado no fundo. Parede interna
    // vertical: imprime limpa, e o corte z(θ) da borda só a alcança
    // acima do assento do macho.
    pontos.push({ x: raioGolaExtMm, y: h + gola.alturaMm });
    pontos.push({ x: gola.raioMm, y: h + gola.alturaMm });
    pontos.push({ x: gola.raioMm, y: h + 1 });
  }
  pontos.push(...pontosMacho(ENCAIXES.corpoDifusor.anel, h));
  return pontos;
}

/**
 * Altura máxima da gola para um dado difusor: a parede interna nunca
 * encosta na peça que assenta dentro dela (folga radial de 2 mm). O
 * difusor alarga subindo, então a gola só pode subir enquanto couber.
 */
export function golaMaximaMm(
  perfilDoDifusor: Ponto2D[],
  raioGolaMm: number
): number {
  let teto = Infinity;
  for (const q of perfilDoDifusor) {
    if (q.y > 0 && q.x + 2 > raioGolaMm) {
      teto = Math.min(teto, q.y - 1);
    }
  }
  return Math.max(0, Math.min(teto, 60));
}

export type TipoEstrutural = "haste" | "anel";

export interface ParametrosEstrutural {
  tipo: TipoEstrutural;
  alturaMm: number;
  /** Barriga do perfil, em mm (negativo = cintura). */
  barrigaMm: number;
}

/**
 * Perfil de uma peça estrutural empilhável (haste ou anel) — vive entre a
 * base e o corpo. Fêmea base↔corpo embaixo e macho base↔corpo em cima: é a
 * MESMA interface nas duas pontas, então qualquer estrutural monta sobre
 * qualquer outra, em qualquer ordem e quantidade (F5) — é assim que uma
 * luminária de 480 mm cabe numa impressora de 300. As pontas ficam presas
 * em RA; a barriga passa pela mesma cascata de clamps do corpo (miolo
 * elétrico, pé da canaleta, inclinação F4).
 */
export function perfilEstrutural(
  p: ParametrosEstrutural,
  folgaMm = ENCAIXES.folgaPadraoMm
): Ponto2D[] {
  const h = p.alturaMm;
  const anel = ENCAIXES.baseCorpo.anel;
  const alturaFemea = anel.alturaMm + ENCAIXES.folgaProfundidadeMm;
  const raioPeMm = anel.externoMm + folgaMm + REGRAS.F.paredeEstruturalMm.min;

  const n = 40;
  const dY = h / n;
  const raios: number[] = [];
  for (let i = 0; i <= n; i++) {
    raios.push(RA + p.barrigaMm * Math.sin(Math.PI * (i / n)));
  }

  // Cascata de clamps — piso físico, depois inclinação F4 (como no corpo).
  // No topo o assento do macho exige a parede de volta em RA; o piso do
  // macho é simétrico ao do pé da fêmea.
  const tanMax = Math.tan((REGRAS.F.balancoMaximoGraus * Math.PI) / 180);
  const piso = (i: number) => {
    const y = i * dY;
    let r = RAIO_LIVRE_MIOLO_MM;
    if (y < alturaFemea + 1 || y > h - anel.alturaMm - 1) {
      r = Math.max(r, raioPeMm);
    }
    return r;
  };
  for (let i = 0; i <= n; i++) raios[i] = Math.max(raios[i], piso(i));
  for (let i = 1; i <= n; i++) {
    raios[i] = Math.min(
      Math.max(raios[i], raios[i - 1] - tanMax * dY),
      raios[i - 1] + tanMax * dY
    );
  }
  for (let i = n - 1; i >= 0; i--) {
    raios[i] = Math.min(
      Math.max(raios[i], raios[i + 1] - tanMax * dY),
      raios[i + 1] + tanMax * dY
    );
    raios[i] = Math.max(raios[i], piso(i));
  }

  const pontos = pontosFemea(anel, folgaMm);
  for (let i = 0; i <= n; i++) pontos.push({ x: raios[i], y: i * dY });
  pontos.push(...pontosMacho(anel, h));
  return pontos;
}

/**
 * Facetas de revolução — o caminho do prisma extrudado (EXT).
 *
 * Em vez de girar o perfil em poucos segmentos (o que facetaria TAMBÉM os
 * anéis de encaixe e quebraria o ajuste F5 — a fêmea poligonal interfere no
 * macho redondo), a malha continua fina e o RAIO é modulado pela equação do
 * polígono regular apenas numa janela vertical: a lateral vira prisma de N
 * faces, e as zonas de encaixe ficam sempre circulares, com transição suave
 * entre as duas (a rampa fica dentro do balanço F4).
 *
 * Os vértices do polígono ficam NO raio do perfil (polígono inscrito): a
 * silhueta continua sendo o envelope externo da peça. `pisoMm` impede que o
 * meio da face mergulhe além do piso físico (miolo elétrico, no corpo).
 */
export interface FacetasRevolucao {
  /** Número de faces planas (4 = caixa/pirâmide; 0 quando superelipse). */
  lados: number;
  /**
   * Expoente da superelipse (squircle) — quando presente, substitui a
   * equação do polígono: mesma máquina r(θ), outra função. n = 4 é o
   * squircle clássico; a curva é inscrita como o polígono (as diagonais
   * tocam o raio do perfil, as faces mergulham para dentro).
   */
  expoente?: number;
  /** Início da zona facetada, em mm (abaixo disso: redondo). */
  yMinMm: number;
  /** Fim da zona facetada, em mm (acima disso: redondo). */
  yMaxMm: number;
  /** Comprimento da rampa redondo↔facetado, em mm. */
  transicaoMm?: number;
  /** Piso físico do raio dentro da zona facetada (miolo, eixo). */
  pisoMm?: number;
}

/** A parte tem modulação lateral por θ (polígono OU superelipse)? */
export function modulaPorTheta(f?: FacetasRevolucao): boolean {
  return !!f && (f.lados >= 3 || (f.expoente ?? 0) > 2);
}

/** Janela de facetas do corpo: poupa a fêmea de baixo e o assento do macho. */
export function facetasParaCorpo(
  lados: number,
  alturaMm: number,
  expoente?: number
): FacetasRevolucao {
  const anelBase = ENCAIXES.baseCorpo.anel;
  return {
    lados,
    ...(expoente ? { expoente } : {}),
    yMinMm: anelBase.alturaMm + ENCAIXES.folgaProfundidadeMm + 2,
    yMaxMm: alturaMm - ENCAIXES.corpoDifusor.anel.alturaMm - 2,
    transicaoMm: 8,
    pisoMm: RAIO_LIVRE_MIOLO_MM,
  };
}

/**
 * Piso do raio nas partes que carregam a interface F5 na TERMINAÇÃO — a
 * parede que sobra em volta do anel quando o meio da face afunda o máximo.
 */
const RAIO_PISO_JUNTA_MM =
  ENCAIXES.baseCorpo.anel.externoMm +
  ENCAIXES.folgaPadraoMm +
  REGRAS.F.paredeEstruturalMm.min;

/**
 * Facetas de uma parte cujas DUAS pontas são encaixe: a base (face de apoio
 * embaixo, macho em cima) e as estruturais (fêmea embaixo, macho em cima).
 *
 * Aqui não existe janela vertical — a peça faceta inteira e é o PISO que
 * arredonda. Como o meio da face vale
 *     f(r) = max(r·cos(π/N), min(r, piso))
 * todo ponto do perfil com r ≤ piso sai exatamente circular (canaleta, anel
 * macho, eixo) e o pescoço, onde o raio já desceu para o da interface, fica
 * redondo sozinho.
 *
 * Isso paga duas dívidas de uma vez. F5: o encaixe é redondo sem depender do
 * número de faces. F4: f é monótona e 1-Lipschitz em r, então o balanço da
 * peça facetada nunca é pior que o da peça lisa — não há rampa para orçar.
 *
 * Preço honesto: parte esbelta faceta pouco ou nada. Uma haste reta no raio
 * da interface não tem material para facetar sem furar o próprio encaixe —
 * limite físico, não escolha de interface.
 */
function facetasComPescocoRedondo(
  lados: number,
  alturaTotalMm: number,
  expoente?: number
): FacetasRevolucao {
  const transicaoMm = 8;
  return {
    lados,
    ...(expoente ? { expoente } : {}),
    yMinMm: -transicaoMm,
    yMaxMm: alturaTotalMm + transicaoMm,
    transicaoMm,
    pisoMm: RAIO_PISO_JUNTA_MM,
  };
}

/**
 * Facetas da base — é ela que dá a silhueta quadrada apoiada na mesa (o
 * gesto do Zen). O pescoço do macho arredonda pelo piso, sem rampa.
 */
export function facetasParaBase(
  lados: number,
  alturaMm: number,
  expoente?: number
): FacetasRevolucao {
  return facetasComPescocoRedondo(
    lados,
    alturaMm + ENCAIXES.baseCorpo.anel.alturaMm,
    expoente
  );
}

/**
 * Facetas de uma peça estrutural da pilha. Sem isto, um corpo facetado sobre
 * uma haste redonda seria um meio-estado que o cliente encontra sozinho e lê
 * como defeito.
 */
export function facetasParaEstrutural(
  lados: number,
  alturaMm: number,
  expoente?: number
): FacetasRevolucao {
  return facetasComPescocoRedondo(
    lados,
    alturaMm + ENCAIXES.baseCorpo.anel.alturaMm,
    expoente
  );
}

/**
 * Quanto o MEIO DA FACE mergulha em relação ao raio do perfil (fator ≤ 1):
 * cos(π/N) no polígono; 2^-((n-2)/(2n)) na superelipse inscrita.
 */
export function fatorMeioDaFace(lados = 0, expoente?: number): number {
  if (expoente && expoente > 2) {
    return Math.pow(2, -(expoente - 2) / (2 * expoente));
  }
  return lados >= 3 ? Math.cos(Math.PI / lados) : 1;
}

/**
 * Separação máxima entre as duas colunas da base dupla, em mm. A pastilha de
 * encaixe (mais margem) precisa caber INTEIRA sobre a face da base — e numa
 * base facetada o raio útil, no meio da face, cai para r·fatorMeioDaFace.
 * Limite de controle, não erro: o slider encolhe junto com o acabamento.
 */
export function separacaoMaximaMm(
  raioBaseMm: number,
  escala = 1,
  lados = 0,
  expoente?: number
): number {
  const raioUtil = fatorMeioDaFace(lados, expoente) * raioBaseMm * escala;
  return Math.max(70, 2 * (raioUtil - 34));
}

/** Janela de facetas do difusor: poupa a fêmea; o topo é livre até o ápice. */
export function facetasParaDifusor(
  lados: number,
  alturaMm: number,
  expoente?: number
): FacetasRevolucao {
  const anel = ENCAIXES.corpoDifusor.anel;
  return {
    lados,
    ...(expoente ? { expoente } : {}),
    yMinMm: anel.alturaMm + ENCAIXES.folgaProfundidadeMm + 2,
    yMaxMm: alturaMm + 8,
    transicaoMm: 8,
    pisoMm: RAIO_EIXO_MM,
  };
}

/** Raios da silhueta atual nos 5 pontos de controle (para iniciar o editor). */
export function amostrarRaiosCorpo(p: ParametrosCorpo): number[] {
  const semLivre = { ...p, perfilLivre: undefined };
  const perfil = perfilCorpo(semLivre);
  const lateral = perfil.filter(
    (q) => q.y >= 0 && q.y <= p.alturaMm && q.x >= RAIO_LIVRE_MIOLO_MM - 0.01
  );
  return TS_PERFIL_LIVRE.map((t) => {
    const alvo = t * p.alturaMm;
    let melhor = lateral[0];
    for (const q of lateral) {
      if (Math.abs(q.y - alvo) < Math.abs(melhor.y - alvo)) melhor = q;
    }
    return Math.round(melhor.x * 2) / 2;
  });
}

/**
 * Perfil do difusor. Fêmea embaixo (encaixa no topo do corpo);
 * `comFemea = false` gera só a CABEÇA, com face de baixo plana — é o que
 * a junta inclinada gira (a fêmea fica no pescoço vertical).
 */
export function perfilDifusor(
  p: ParametrosDifusor,
  folgaMm = ENCAIXES.folgaPadraoMm,
  comFemea = true
): Ponto2D[] {
  const { forma, alturaMm: dh, raioMm: dr } = p;
  const pontos = comFemea
    ? pontosFemea(ENCAIXES.corpoDifusor.anel, folgaMm)
    : [{ x: RAIO_EIXO_MM, y: 0 }];
  const n = 34;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let rr: number;
    if (forma === "globo") {
      if (u >= 1) {
        pontos.push({ x: RAIO_EIXO_MM, y: dh });
        continue;
      }
      rr = RB + (dr - RB) * Math.sin(Math.PI * Math.pow(u, 0.9));
    } else if (forma === "sino") {
      rr = RB + (dr - RB) * Math.pow(u, 1.6);
    } else if (forma === "cone") {
      rr = RB + (dr - RB) * u;
    } else {
      rr = RB + (dr - RB) * Math.min(1, u * 3.2);
      if (u > 0.92) rr -= (u - 0.92) * (dr - RB);
    }
    pontos.push({ x: Math.max(rr, RAIO_EIXO_MM), y: u * dh });
  }
  return pontos;
}

/** Área lateral do sólido de revolução, em mm² (insumo do peso/preço). */
export function areaLateralMm2(perfil: Ponto2D[]): number {
  let area = 0;
  for (let i = 1; i < perfil.length; i++) {
    const r = (perfil[i].x + perfil[i - 1].x) / 2;
    const ds = Math.hypot(
      perfil[i].x - perfil[i - 1].x,
      perfil[i].y - perfil[i - 1].y
    );
    area += 2 * Math.PI * r * ds;
  }
  return area;
}

/**
 * Maior ângulo de balanço do perfil, em graus da vertical.
 */
export function anguloBalancoMaximoGraus(perfil: Ponto2D[]): number {
  let pior = 0;
  for (let i = 1; i < perfil.length; i++) {
    const dx = Math.abs(perfil[i].x - perfil[i - 1].x);
    const dy = perfil[i].y - perfil[i - 1].y;
    if (dy <= 0) continue;
    pior = Math.max(pior, (Math.atan2(dx, dy) * 180) / Math.PI);
  }
  return pior;
}
