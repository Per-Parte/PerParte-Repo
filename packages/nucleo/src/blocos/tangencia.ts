/**
 * Montagem v2 · F1 — a matemática do invariante A1: toda forma tangencia
 * outra forma (ou o plano da mesa).
 *
 * A F1 entrega ESTAS funções com testes; a F2 pluga a UI nelas (entrar
 * na cena, arrastar, "imã"). Nada aqui conhece React ou câmera.
 *
 * Método prescrito (espec da F1): assentamento por VARREDURA RADIAL —
 * como todo apoio expõe zSuperficieTopoMm/zSuperficieBaseMm como função
 * da distância ao eixo, a cota de assentamento entre dois blocos com
 * offset horizontal (dx, dy) é o máximo, sobre a região de sobreposição
 * em planta, de (topo de baixo em d₁) − (base de cima em d₂), amostrado
 * em passos de 1 mm ao longo da linha que liga os dois eixos (as
 * superfícies são de revolução ou platôs — o pior ponto está nessa
 * linha). Determinístico, sem solver.
 *
 * ⚑ TODO fixação física entre formas tangentes (pino, cola, encaixe
 * impresso) — decisão de produção em aberto (espec §5); não bloqueia
 * F1–F5.
 *
 * Plantas QUADRADAS entram na varredura pela aproximação radial: pouso
 * pelo disco inscrito, envelope lateral pelo circunscrito — contatos
 * diagonais exatos ficam para a F2 se o uso pedir (achados media/baixa
 * da revisão de 06/08).
 */

import type {
  ApoioBloco,
  BlocoNaCena,
  ContatoBloco,
  FormaBloco,
  ParametrosBloco,
} from "./tipos";

/**
 * Resolve o apoio de uma forma — injetado pela chamadora (o barrel
 * exporta `apoioDaForma`; receber por parâmetro evita import circular
 * e deixa a matemática testável com apoios de mentira).
 */
export type ApoioDe = (forma: FormaBloco) => ApoioBloco;

/** Passo da varredura radial, em mm (prescrito na espec da F1). */
const PASSO_VARREDURA_MM = 1;

/**
 * Teto da varredura ao procurar o alcance de uma superfície, em mm —
 * folgado para o maior bloco possível (F1: prato de 250 mm; o raio
 * circunscrito de qualquer planta fica bem abaixo disto).
 */
const TETO_VARREDURA_MM = 512;

/**
 * Maior distância radial (em passos de 1 mm) em que a superfície ainda
 * existe. Não para no primeiro null: superfícies anulares (ex.: o anel
 * da base do ponto de luz ao redor do bulbo) têm buraco no meio.
 * −1 = superfície inexistente em toda a varredura.
 */
function alcanceSuperficieMm(f: (dMm: number) => number | null): number {
  let alcance = -1;
  for (let d = 0; d <= TETO_VARREDURA_MM; d += PASSO_VARREDURA_MM) {
    if (f(d) != null) alcance = d;
  }
  return alcance;
}

/**
 * Cota Z da BASE do bloco de cima para ele TANGENCIAR o de baixo, dados
 * os centros afastados (dxMm, dyMm) em planta. null = sem sobreposição
 * em planta (não assenta — ele cai para a mesa ou para outro bloco).
 * Esfera sobre esfera com dx = 0 → toca num ponto (polo com polo).
 * Pode ser < 0 (o de cima alcançaria o de baixo só abaixo da mesa) —
 * as chamadoras tratam a mesa como piso.
 */
export function cotaAssentamentoMm(
  deCima: ParametrosBloco,
  deBaixo: ParametrosBloco,
  dxMm: number,
  dyMm: number,
  apoioDe: ApoioDe
): number | null {
  const apoioBaixo = apoioDe(deBaixo.forma);
  const apoioCima = apoioDe(deCima.forma);
  const topoDeBaixo = (dMm: number) =>
    apoioBaixo.zSuperficieTopoMm(deBaixo, dMm);
  const baseDeCima = (dMm: number) =>
    apoioCima.zSuperficieBaseMm(deCima, dMm);

  const d = Math.hypot(dxMm, dyMm);
  const alcanceBaixo = alcanceSuperficieMm(topoDeBaixo);
  const alcanceCima = alcanceSuperficieMm(baseDeCima);
  if (alcanceBaixo < 0 || alcanceCima < 0) return null;

  // t = posição na linha que liga os eixos, medida do eixo do de baixo
  // (t = 0) ao eixo do de cima (t = d). Sobreposição em planta:
  const tMin = Math.max(-alcanceBaixo, d - alcanceCima);
  const tMax = Math.min(alcanceBaixo, d + alcanceCima);
  if (tMin > tMax) return null;

  // Amostras em passos de 1 mm + os pontos exatos que decidem os casos
  // notáveis: os dois extremos e os dois eixos (esfera sobre esfera
  // coaxial toca EXATAMENTE no polo, t = 0).
  const amostras: number[] = [tMax];
  for (let t = tMin; t < tMax; t += PASSO_VARREDURA_MM) amostras.push(t);
  if (tMin <= 0 && 0 <= tMax) amostras.push(0);
  if (tMin <= d && d <= tMax) amostras.push(d);

  // …e os RAIOS NOTÁVEIS das duas superfícies (degraus: borda do bulbo
  // do ponto de luz, respiro da esfera oca) — a borda exata E os dois
  // lados do degrau (±1e-6), tudo clampado à sobreposição. Sem isto, um
  // pouso na borda penetraria sub-mm no anel real (revisão de 06/08).
  const notaveis: number[] = [];
  for (const r of apoioBaixo.raiosNotaveisMm?.(deBaixo) ?? []) {
    notaveis.push(r, -r); // topoDeBaixo é função de |t|
  }
  for (const r of apoioCima.raiosNotaveisMm?.(deCima) ?? []) {
    notaveis.push(d - r, d + r); // baseDeCima é função de |d − t|
  }
  for (const t of notaveis) {
    for (const lado of [-1e-6, 0, 1e-6]) {
      amostras.push(Math.min(tMax, Math.max(tMin, t + lado)));
    }
  }

  let cota: number | null = null;
  for (const t of amostras) {
    const zTopo = topoDeBaixo(Math.abs(t));
    if (zTopo == null) continue;
    const zBase = baseDeCima(Math.abs(d - t));
    if (zBase == null) continue;
    const candidata = zTopo - zBase;
    if (cota == null || candidata > cota) cota = candidata;
  }
  return cota;
}

/**
 * Onde um bloco NOVO assenta ao entrar na cena: no topo da forma mais
 * alta (centrado no eixo dela); cena vazia → no plano da mesa (0,0,0).
 */
export function assentarAoEntrar(
  novo: ParametrosBloco,
  cena: readonly BlocoNaCena[],
  apoioDe: ApoioDe
): ContatoBloco {
  let maisAlto: BlocoNaCena | null = null;
  let topoMaisAlto = -Infinity;
  for (const bloco of cena) {
    const topo =
      bloco.contato.zBaseMm +
      apoioDe(bloco.params.forma).alturaTopoMm(bloco.params);
    if (topo > topoMaisAlto) {
      topoMaisAlto = topo;
      maisAlto = bloco;
    }
  }
  if (maisAlto == null) {
    return { sobre: null, xMm: 0, yMm: 0, zBaseMm: 0 };
  }
  const cota = cotaAssentamentoMm(novo, maisAlto.params, 0, 0, apoioDe);
  if (cota == null) {
    // Defensivo (coaxial sempre sobrepõe nas formas da F1): o imã acha
    // o contato válido mais próximo — na mesa, EMPURRADO para fora do
    // envelope de quem está embaixo, nunca dentro dele (revisão de
    // 06/08: cair no mesmo (x, y) interpenetrava o bloco de baixo).
    return contatoIma(
      novo,
      cena,
      maisAlto.contato.xMm,
      maisAlto.contato.yMm,
      apoioDe
    );
  }
  return {
    sobre: maisAlto.id,
    xMm: maisAlto.contato.xMm,
    yMm: maisAlto.contato.yMm,
    zBaseMm: Math.max(0, maisAlto.contato.zBaseMm + cota),
  };
}

/**
 * DESLIZAR: dado o contato atual + delta em planta, o novo contato
 * VÁLIDO — o bloco escorrega pela superfície de quem o apoia (o zBaseMm
 * re-assenta a cada passo) e, se o offset sair da região de apoio
 * (raioApoioSuperiorMm de quem está embaixo), o contato clampa na borda:
 * limite como ferramenta, nunca erro. Na mesa, desliza livre pelo plano.
 */
export function deslizarContato(
  bloco: BlocoNaCena,
  cena: readonly BlocoNaCena[],
  deltaXMm: number,
  deltaYMm: number,
  apoioDe: ApoioDe
): ContatoBloco {
  const alvoX = bloco.contato.xMm + deltaXMm;
  const alvoY = bloco.contato.yMm + deltaYMm;
  const suporte =
    bloco.contato.sobre == null
      ? undefined
      : cena.find((b) => b.id === bloco.contato.sobre && b.id !== bloco.id);
  if (suporte == null) {
    // Na mesa: desliza pelo plano — mas o contato prometido é VÁLIDO
    // aqui também: o alvo é empurrado para fora dos envelopes dos
    // OUTROS blocos (revisão de 06/08: o arrasto atravessava vizinhos).
    const alvo = empurrarParaForaMm(
      bloco.params,
      cena,
      alvoX,
      alvoY,
      bloco.id,
      apoioDe
    );
    return { sobre: null, xMm: alvo.xMm, yMm: alvo.yMm, zBaseMm: 0 };
  }

  const apoio = apoioDe(suporte.params.forma);
  const raioApoio = apoio.raioApoioSuperiorMm(suporte.params);
  let dx = alvoX - suporte.contato.xMm;
  let dy = alvoY - suporte.contato.yMm;
  const dist = Math.hypot(dx, dy);
  if (dist > raioApoio) {
    // Clamp à borda da região de apoio (raio 0 → volta a ser coaxial).
    const fator = raioApoio / dist;
    dx *= fator;
    dy *= fator;
  }

  const cota = cotaAssentamentoMm(
    bloco.params,
    suporte.params,
    dx,
    dy,
    apoioDe
  );
  const zBaseMm =
    cota == null
      ? suporte.contato.zBaseMm + apoio.alturaTopoMm(suporte.params)
      : suporte.contato.zBaseMm + cota;
  return {
    sobre: suporte.id,
    xMm: suporte.contato.xMm + dx,
    yMm: suporte.contato.yMm + dy,
    zBaseMm: Math.max(0, zBaseMm),
  };
}

/**
 * Distância entre eixos para o bloco novo (pousado na mesa) ENCOSTAR na
 * lateral de um bloco da cena: máximo, sobre as cotas z em que os dois
 * envelopes coexistem, da soma dos raios de envelope. 0 = sem
 * sobreposição de altura (não há contato lateral possível).
 */
function distanciaTangenciaLateralMm(
  novo: ParametrosBloco,
  bloco: BlocoNaCena,
  apoioDe: ApoioDe
): number {
  const apoioNovo = apoioDe(novo.forma);
  const apoioBloco = apoioDe(bloco.params.forma);
  const zIni = Math.max(0, bloco.contato.zBaseMm);
  const zFim = Math.min(
    apoioNovo.alturaTopoMm(novo),
    bloco.contato.zBaseMm + apoioBloco.alturaTopoMm(bloco.params)
  );
  if (zFim < zIni) return 0;
  const amostras: number[] = [zFim];
  for (let z = zIni; z < zFim; z += PASSO_VARREDURA_MM) amostras.push(z);
  let pior = 0;
  for (const z of amostras) {
    const soma =
      apoioNovo.raioEnvelopeMm(novo, z) +
      apoioBloco.raioEnvelopeMm(bloco.params, z - bloco.contato.zBaseMm);
    if (soma > pior) pior = soma;
  }
  return pior;
}

/**
 * Empurra um alvo em planta para FORA dos envelopes de todos os blocos
 * da cena (tangência de envelopes = distanciaTangenciaLateralMm).
 * Iterativo e determinístico: cada passo resolve a violação MAIS
 * profunda, empurrando na direção eixo→alvo do bloco violado (alvo NO
 * eixo → +X). Envelopes convexos em planta convergem em poucos passos
 * (revisão de 06/08: empurrar só para fora do bloco mais próximo
 * devolvia posição DENTRO de outro bloco da cena) ⚑; se o teto de 16
 * estourar, devolve a última posição — sempre melhor ou igual à inicial.
 */
function empurrarParaForaMm(
  params: ParametrosBloco,
  cena: readonly BlocoNaCena[],
  xMm: number,
  yMm: number,
  ignorarId: number | null,
  apoioDe: ApoioDe
): { xMm: number; yMm: number } {
  let x = xMm;
  let y = yMm;
  let anterior: BlocoNaCena | null = null;
  for (let passo = 0; passo < 16; passo++) {
    let pior: BlocoNaCena | null = null;
    let piorFalta = 1e-9;
    let piorDist = 0;
    let piorTangencia = 0;
    for (const bloco of cena) {
      if (bloco.id === ignorarId) continue;
      const tangencia = distanciaTangenciaLateralMm(params, bloco, apoioDe);
      if (tangencia <= 0) continue;
      const dist = Math.hypot(x - bloco.contato.xMm, y - bloco.contato.yMm);
      const falta = tangencia - dist;
      if (falta > piorFalta) {
        pior = bloco;
        piorFalta = falta;
        piorDist = dist;
        piorTangencia = tangencia;
      }
    }
    if (pior == null) return { xMm: x, yMm: y };

    // Pingue-pongue entre DOIS envelopes (sair de um entra no outro —
    // ex.: alvo entre dois blocos próximos): resolve a tangência DUPLA
    // exata, a interseção dos dois círculos de tangência mais próxima
    // do alvo original (empate → lado +Y, determinístico).
    if (anterior != null && anterior.id !== pior.id) {
      const dupla = tangenciaDuplaMm(params, anterior, pior, xMm, yMm, apoioDe);
      if (dupla != null) {
        x = dupla.xMm;
        y = dupla.yMm;
        anterior = null;
        continue;
      }
    }

    const ux = piorDist === 0 ? 1 : (x - pior.contato.xMm) / piorDist;
    const uy = piorDist === 0 ? 0 : (y - pior.contato.yMm) / piorDist;
    x = pior.contato.xMm + ux * piorTangencia;
    y = pior.contato.yMm + uy * piorTangencia;
    anterior = pior;
  }
  return { xMm: x, yMm: y };
}

/**
 * Interseção dos círculos de tangência de dois blocos (o ponto onde o
 * bloco novo encosta nos DOIS ao mesmo tempo), do lado mais próximo do
 * alvo. null = um envelope engole o outro (o empurrão radial resolve).
 */
function tangenciaDuplaMm(
  params: ParametrosBloco,
  a: BlocoNaCena,
  b: BlocoNaCena,
  alvoXMm: number,
  alvoYMm: number,
  apoioDe: ApoioDe
): { xMm: number; yMm: number } | null {
  const ra = distanciaTangenciaLateralMm(params, a, apoioDe);
  const rb = distanciaTangenciaLateralMm(params, b, apoioDe);
  const dx = b.contato.xMm - a.contato.xMm;
  const dy = b.contato.yMm - a.contato.yMm;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return null;
  const ao = (ra * ra - rb * rb + d * d) / (2 * d);
  const h2 = ra * ra - ao * ao;
  if (h2 < 0) return null;
  const h = Math.sqrt(h2);
  const mx = a.contato.xMm + (ao * dx) / d;
  const my = a.contato.yMm + (ao * dy) / d;
  const px = (-dy / d) * h;
  const py = (dx / d) * h;
  const lado1 = { xMm: mx + px, yMm: my + py };
  const lado2 = { xMm: mx - px, yMm: my - py };
  const d1 = Math.hypot(lado1.xMm - alvoXMm, lado1.yMm - alvoYMm);
  const d2 = Math.hypot(lado2.xMm - alvoXMm, lado2.yMm - alvoYMm);
  if (Math.abs(d1 - d2) < 1e-9) {
    return lado1.yMm >= lado2.yMm ? lado1 : lado2;
  }
  return d1 <= d2 ? lado1 : lado2;
}

/**
 * "IMÃ": dado um alvo solto em planta (o mouse largou o bloco ali), o
 * contato VÁLIDO mais próximo — topo de um bloco cuja região de apoio
 * alcança o alvo, senão a mesa com o alvo EMPURRADO para fora de todos
 * os envelopes (tangência lateral; alvo já livre fica onde está).
 */
export function contatoIma(
  params: ParametrosBloco,
  cena: readonly BlocoNaCena[],
  alvoXMm: number,
  alvoYMm: number,
  apoioDe: ApoioDe
): ContatoBloco {
  // 1) Topo alcançável: a região de apoio de alguém cobre o alvo.
  //    Empate/pilha: vence a superfície mais ALTA (é nela que se pousa).
  let melhorTopo: ContatoBloco | null = null;
  let zMelhorTopo = -Infinity;
  for (const bloco of cena) {
    const apoio = apoioDe(bloco.params.forma);
    const dx = alvoXMm - bloco.contato.xMm;
    const dy = alvoYMm - bloco.contato.yMm;
    if (Math.hypot(dx, dy) > apoio.raioApoioSuperiorMm(bloco.params)) {
      continue;
    }
    const cota = cotaAssentamentoMm(params, bloco.params, dx, dy, apoioDe);
    if (cota == null) continue;
    const zBaseMm = Math.max(0, bloco.contato.zBaseMm + cota);
    if (zBaseMm > zMelhorTopo) {
      zMelhorTopo = zBaseMm;
      melhorTopo = { sobre: bloco.id, xMm: alvoXMm, yMm: alvoYMm, zBaseMm };
    }
  }
  if (melhorTopo) return melhorTopo;

  // 2) Mesa, com o alvo empurrado para fora de TODOS os envelopes
  //    (alvo livre fica no próprio (x, y)) — A1 com o plano de base.
  const alvo = empurrarParaForaMm(
    params,
    cena,
    alvoXMm,
    alvoYMm,
    null,
    apoioDe
  );
  return { sobre: null, xMm: alvo.xMm, yMm: alvo.yMm, zBaseMm: 0 };
}
