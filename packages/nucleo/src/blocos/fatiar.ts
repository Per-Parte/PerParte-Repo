/**
 * Montagem v2 — ferramenta FATIAR (pedido do Davi, 06/08/2026): "o
 * usuário poderá fatiar uma forma, cortando ela no eixo que desejar".
 *
 * Um corte PLANO perpendicular a um eixo LOCAL (x, y ou z); sobrevive o
 * semi-espaço de `fatia.lado`. O resultado é um sólido ESTANQUE — a face
 * do corte é TAMPADA — reassentado com a base de volta em z = 0
 * (convenção do núcleo: nada abaixo da mesa). Onde a superfície original
 * era curva ou inclinada, a face do corte é PLANA: imprime melhor que a
 * original, nunca pior.
 *
 * RECEITA da malha (quatro etapas, nesta ordem):
 * (a) RECORTE triângulo a triângulo contra o semi-espaço
 *     (Sutherland–Hodgman: 0, 1 ou 2 triângulos por triângulo original).
 *     Os vértices de interseção são CACHEADOS por chave da aresta
 *     (min(i,j), max(i,j)) — dois triângulos vizinhos que cortam a MESMA
 *     aresta recebem o MESMO índice, e é isso que preserva a
 *     estanqueidade por índice do núcleo (nunca duplicar numa costura).
 *     Vértice a menos de EPS_PLANO_MM do plano conta como NO plano
 *     (snap): sem isso o recorte gera slivers de área ~0.
 * (b) FRONTEIRA. O contorno do corte não é procurado por coordenada, e
 *     sim pela topologia: depois do recorte, aresta direcionada SEM par
 *     oposto é buraco na casca — e todo buraco está no plano do corte,
 *     porque o resto da malha veio inteiro. Triângulos totalmente
 *     COPLANARES ao corte são descartados (a tampa os refaz com a
 *     orientação certa). As arestas de fronteira são encadeadas em LAÇOS
 *     fechados (mapa vértice → arestas saintes); vértice de PINÇA (a
 *     seção se toca num ponto) fecha o sub-laço na hora e o caminho
 *     continua pela outra aresta — cada laço sai com vértices distintos.
 * (c) TAMPA de cada laço, com a normal apontando para FORA do material
 *     que sobrou. Os laços são projetados no plano do corte (2D) com o
 *     par de eixos escolhido para que "anti-horário = normal da tampa":
 *     assim área assinada > 0 é contorno EXTERNO e < 0 é BURACO (peça
 *     OCA cortada → coroa; corte na banda dos furos → vários laços).
 *     Cada buraco é ligado ao seu externo por uma ARESTA-PONTE (o par de
 *     vértices mais próximo que não cruza nenhuma aresta) e o polígono
 *     resultante é triangulado por ear clipping. A ponte aparece nos dois
 *     sentidos no polígono: some na contabilidade de arestas, e a tampa
 *     fecha o sólido.
 * (d) COMPACTA o buffer (descarta vértices órfãos) e TRANSLADA a malha
 *     para a base voltar a z = 0. Cortes em x/y de peça de fundo plano
 *     transladam zero; corte em z do lado "maior" é o que reassenta a
 *     peça (e o corte em x/y que remove o polo de uma esfera também).
 *
 * Convenções do núcleo (malha.ts): mm; Z é a vertical de impressão (F8);
 * origem no eixo (x = y = 0) com a base em z = 0; enrolamento
 * anti-horário visto de fora (volumeAssinadoMm3 > 0).
 *
 * fatiarMalhaBloco assume params já grampeados (grampearBloco antes) —
 * é o grampeador que mantém a posição do corte dentro de limitesFatiaMm,
 * deixando material dos DOIS lados (limite como clamp, nunca erro).
 */

import type {
  ApoioBloco,
  EixoFatia,
  FatiaBloco,
  MalhaBloco,
  ParametrosBloco,
} from "./tipos";

/** Tolerância de "no plano" (mm): abaixo dela o vértice está NO corte. */
const EPS_PLANO_MM = 1e-6;

const EIXO_INDICE: Record<EixoFatia, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

/**
 * Par de eixos (u, v) da projeção 2D que faz "anti-horário = normal +eixo"
 * — o referencial destro de cada eixo do corte. Para a normal −eixo os
 * dois trocam de lugar.
 */
const PARES_2D: readonly (readonly [number, number])[] = [
  [1, 2], // corte em X → (y, z)
  [2, 0], // corte em Y → (z, x)
  [0, 1], // corte em Z → (x, y)
];

/** Laço da tampa, já projetado no plano do corte. */
interface Contorno {
  /** Índices dos vértices, na ordem em que a TAMPA os percorre. */
  ids: number[];
  u: number[];
  v: number[];
  /** Área assinada em 2D: > 0 externo, < 0 buraco. */
  area: number;
}

const MALHA_VAZIA: MalhaBloco = {
  posicoes: new Float32Array(0),
  indices: new Uint32Array(0),
};

export function fatiarMalhaBloco(
  malha: MalhaBloco,
  p: ParametrosBloco
): MalhaBloco {
  const fatia = p.fatia;
  if (!fatia) return malha;

  const eixo = EIXO_INDICE[fatia.eixo];
  const corte = fatia.posicaoMm;
  // d ≥ 0 é o lado que FICA (o snap zera a faixa do plano).
  const sinal = fatia.lado === "maior" ? 1 : -1;

  // ---- (a) recorte contra o semi-espaço ----------------------------------
  const pos: number[] = Array.from(malha.posicoes);
  const nOriginais = pos.length / 3;
  const dist: number[] = new Array(nOriginais);
  for (let i = 0; i < nOriginais; i++) {
    const d = sinal * (pos[i * 3 + eixo] - corte);
    dist[i] = Math.abs(d) <= EPS_PLANO_MM ? 0 : d;
  }

  const cacheAresta = new Map<number, number>();
  const interseccao = (a: number, b: number): number => {
    const chave = Math.min(a, b) * nOriginais + Math.max(a, b);
    const pronto = cacheAresta.get(chave);
    if (pronto !== undefined) return pronto;
    const da = dist[a];
    const db = dist[b];
    const t = da / (da - db);
    const novo = pos.length / 3;
    for (let e = 0; e < 3; e++) {
      // A coordenada do eixo é o plano EXATO — a face do corte é plana
      // por construção, não por sorte de arredondamento.
      pos.push(
        e === eixo
          ? corte
          : pos[a * 3 + e] + t * (pos[b * 3 + e] - pos[a * 3 + e])
      );
    }
    dist.push(0);
    cacheAresta.set(chave, novo);
    return novo;
  };

  const tri: number[] = [];
  const ix = malha.indices;
  const trioOriginal = [0, 0, 0];
  const poligono: number[] = [];
  for (let t = 0; t < ix.length; t += 3) {
    trioOriginal[0] = ix[t];
    trioOriginal[1] = ix[t + 1];
    trioOriginal[2] = ix[t + 2];
    const da = dist[trioOriginal[0]];
    const db = dist[trioOriginal[1]];
    const dc = dist[trioOriginal[2]];
    // Nada do lado que fica (inclui o triângulo COPLANAR: a tampa o refaz).
    if (da <= 0 && db <= 0 && dc <= 0) continue;
    if (da >= 0 && db >= 0 && dc >= 0) {
      tri.push(trioOriginal[0], trioOriginal[1], trioOriginal[2]);
      continue;
    }
    poligono.length = 0;
    for (let e = 0; e < 3; e++) {
      const i = trioOriginal[e];
      const j = trioOriginal[(e + 1) % 3];
      const di = dist[i];
      const dj = dist[j];
      if (di >= 0) poligono.push(i);
      if ((di > 0 && dj < 0) || (di < 0 && dj > 0)) {
        poligono.push(interseccao(i, j));
      }
    }
    // O recorte de um triângulo é convexo (3 ou 4 pontos): leque simples.
    for (let m = 1; m + 1 < poligono.length; m++) {
      const a = poligono[0];
      const b = poligono[m];
      const c = poligono[m + 1];
      if (a !== b && b !== c && c !== a) tri.push(a, b, c);
    }
  }

  if (tri.length === 0) return MALHA_VAZIA;

  // ---- (b) fronteira → laços --------------------------------------------
  const nVertices = pos.length / 3;
  const presentes = new Set<number>();
  const chave = (a: number, b: number) => a * nVertices + b;
  for (let t = 0; t < tri.length; t += 3) {
    presentes.add(chave(tri[t], tri[t + 1]));
    presentes.add(chave(tri[t + 1], tri[t + 2]));
    presentes.add(chave(tri[t + 2], tri[t]));
  }
  const saintes = new Map<number, number[]>();
  let arestasFronteira = 0;
  for (const k of presentes) {
    const a = Math.floor(k / nVertices);
    const b = k - a * nVertices;
    if (presentes.has(chave(b, a))) continue;
    const lista = saintes.get(a);
    if (lista) lista.push(b);
    else saintes.set(a, [b]);
    arestasFronteira++;
  }

  const lacos: number[][] = [];
  if (arestasFronteira > 0) {
    const partidas = Array.from(saintes.keys());
    let passos = 0;
    const tetoPassos = arestasFronteira * 2 + 8;
    for (const inicio of partidas) {
      while ((saintes.get(inicio)?.length ?? 0) > 0) {
        const caminho: number[] = [];
        const posicaoNoCaminho = new Map<number, number>();
        let atual = inicio;
        while (passos++ < tetoPassos) {
          const j = posicaoNoCaminho.get(atual);
          if (j !== undefined) {
            // Fechou: caminho[j..] é um laço. O vértice de pinça FICA no
            // caminho (posição j) para o passeio seguir pela outra aresta.
            const laco = caminho.slice(j);
            for (let m = j; m < caminho.length; m++) {
              posicaoNoCaminho.delete(caminho[m]);
            }
            caminho.length = j;
            if (laco.length >= 3) lacos.push(laco);
            if ((saintes.get(atual)?.length ?? 0) === 0) break;
          }
          posicaoNoCaminho.set(atual, caminho.length);
          caminho.push(atual);
          const lista = saintes.get(atual);
          const proximo = lista?.pop();
          if (proximo === undefined) {
            // ⚑ defensivo: fronteira que não fecha (só com malha de
            // entrada não-manifold). Tampa o que sobrou do caminho.
            if (caminho.length >= 3) lacos.push(caminho.slice());
            break;
          }
          atual = proximo;
        }
      }
    }
  }

  // ---- (c) tampa --------------------------------------------------------
  const par = PARES_2D[eixo];
  // A normal da tampa aponta para FORA do material: +eixo quando fica o
  // lado "menor" (a face do corte é o topo do que sobrou), −eixo no outro.
  const [iu, iv] = fatia.lado === "menor" ? par : [par[1], par[0]];

  const contornos: Contorno[] = lacos.map((laco) => {
    // A tampa percorre a fronteira ao CONTRÁRIO: cada aresta a→b da casca
    // pede o par oposto b→a para o sólido fechar.
    const ids = laco.slice().reverse();
    const u = ids.map((id) => pos[id * 3 + iu]);
    const v = ids.map((id) => pos[id * 3 + iv]);
    return { ids, u, v, area: areaAssinada(u, v) };
  });

  const externos = contornos.filter((c) => c.area > 1e-9);
  const buracos = contornos.filter((c) => c.area < -1e-9);
  // Laço de área ~0 (sliver do corte raspando a superfície): leque
  // direto — fecha a casca sem pedir orientação a um polígono
  // degenerado. ⚑
  for (const c of contornos) {
    if (c.area <= 1e-9 && c.area >= -1e-9) leque(c, tri);
  }

  const porExterno = new Map<Contorno, Contorno[]>();
  for (const externo of externos) porExterno.set(externo, []);
  for (const buraco of buracos) {
    const dono = externoQueContem(buraco, externos);
    // Buraco sem externo (orientação inesperada): tampa sozinho — a
    // contabilidade de arestas continua fechada. ⚑ defensivo.
    if (dono) porExterno.get(dono)!.push(buraco);
    else leque(buraco, tri);
  }
  for (const [externo, dele] of porExterno) {
    tamparComBuracos(externo, dele, tri);
  }

  // ---- (d) compacta + reassenta -----------------------------------------
  const remapa = new Int32Array(nVertices).fill(-1);
  let usados = 0;
  for (const id of tri) {
    if (remapa[id] < 0) remapa[id] = usados++;
  }
  // O reassentamento entra ANTES da conversão para Float32: assim o vértice
  // mais baixo cai em z = 0 exato, sem resíduo de arredondamento.
  let minZ = Infinity;
  for (let i = 0; i < nVertices; i++) {
    if (remapa[i] < 0) continue;
    if (pos[i * 3 + 2] < minZ) minZ = pos[i * 3 + 2];
  }
  const dz = Number.isFinite(minZ) ? minZ : 0;
  const posicoes = new Float32Array(usados * 3);
  for (let i = 0; i < nVertices; i++) {
    const destino = remapa[i];
    if (destino < 0) continue;
    posicoes[destino * 3] = pos[i * 3];
    posicoes[destino * 3 + 1] = pos[i * 3 + 1];
    posicoes[destino * 3 + 2] = pos[i * 3 + 2] - dz;
  }
  const indices = new Uint32Array(tri.length);
  for (let i = 0; i < tri.length; i++) indices[i] = remapa[tri[i]];
  return { posicoes, indices };
}

/** Área assinada do polígono projetado (> 0 = anti-horário em (u, v)). */
function areaAssinada(u: number[], v: number[]): number {
  let dobro = 0;
  for (let i = 0, n = u.length; i < n; i++) {
    const j = (i + 1) % n;
    dobro += u[i] * v[j] - u[j] * v[i];
  }
  return dobro / 2;
}

/** Leque a partir do primeiro vértice — usa cada aresta do laço uma vez. */
function leque(c: Contorno, tri: number[]): void {
  for (let m = 1; m + 1 < c.ids.length; m++) {
    const a = c.ids[0];
    const b = c.ids[m];
    const d = c.ids[m + 1];
    if (a !== b && b !== d && d !== a) tri.push(a, b, d);
  }
}

/** O externo (mais apertado) que contém o buraco; null = nenhum. */
function externoQueContem(
  buraco: Contorno,
  externos: Contorno[]
): Contorno | null {
  let melhor: Contorno | null = null;
  for (const externo of externos) {
    if (!pontoNoPoligono(externo, buraco.u[0], buraco.v[0])) continue;
    if (melhor == null || externo.area < melhor.area) melhor = externo;
  }
  return melhor;
}

function pontoNoPoligono(c: Contorno, pu: number, pv: number): boolean {
  let dentro = false;
  const { u, v } = c;
  for (let i = 0, j = u.length - 1; i < u.length; j = i++) {
    if (
      v[i] > pv !== v[j] > pv &&
      pu < ((u[j] - u[i]) * (pv - v[i])) / (v[j] - v[i]) + u[i]
    ) {
      dentro = !dentro;
    }
  }
  return dentro;
}

/**
 * Tampa um externo com seus buracos: pontes + ear clipping. Se a
 * triangulação travar (polígono numericamente degenerado), cai no leque
 * por laço — geometria redundante (membrana coincidente no plano do
 * corte), mas malha ESTANQUE e volume exato. ⚑ nunca visto no catálogo.
 */
function tamparComBuracos(
  externo: Contorno,
  buracos: Contorno[],
  tri: number[]
): void {
  const poligono = juntarBuracos(externo, buracos);
  const tampa = triangularPorOrelhas(poligono);
  if (tampa) {
    for (const id of tampa) tri.push(id);
    return;
  }
  leque(externo, tri);
  for (const buraco of buracos) leque(buraco, tri);
}

/**
 * Junta os buracos ao externo por arestas-ponte. Cada ponte entra nos
 * DOIS sentidos (…, o, h, …buraco…, h, o, …): as arestas do buraco e do
 * externo continuam aparecendo uma única vez, e o par o↔h se cancela.
 * Ordem por u decrescente (como o ear clipping clássico): a ponte de um
 * buraco nunca fica presa atrás de outro ainda não costurado.
 */
function juntarBuracos(externo: Contorno, buracos: Contorno[]): Contorno {
  const ids = externo.ids.slice();
  const u = externo.u.slice();
  const v = externo.v.slice();
  if (buracos.length === 0) return { ids, u, v, area: externo.area };

  const fila = buracos
    .map((b) => ({ b, uMax: b.u.reduce((x, y) => (y > x ? y : x), -Infinity) }))
    .sort((a, b) => b.uMax - a.uMax)
    .map((x) => x.b);

  for (let f = 0; f < fila.length; f++) {
    const buraco = fila[f];
    const ponte = acharPonte({ ids, u, v, area: 0 }, buraco, fila.slice(f + 1));
    const iBuraco = ponte.iBuraco;
    const iPoli = ponte.iPoli;
    const n = buraco.ids.length;
    const idsIn: number[] = [];
    const uIn: number[] = [];
    const vIn: number[] = [];
    for (let k = 0; k <= n; k++) {
      const m = (iBuraco + k) % n;
      idsIn.push(buraco.ids[m]);
      uIn.push(buraco.u[m]);
      vIn.push(buraco.v[m]);
    }
    // Volta ao vértice do externo: fecha a ponte.
    idsIn.push(ids[iPoli]);
    uIn.push(u[iPoli]);
    vIn.push(v[iPoli]);
    ids.splice(iPoli + 1, 0, ...idsIn);
    u.splice(iPoli + 1, 0, ...uIn);
    v.splice(iPoli + 1, 0, ...vIn);
  }
  return { ids, u, v, area: areaAssinada(u, v) };
}

/** Quantos vértices do buraco e do externo entram na busca da ponte. ⚑ */
const CANDIDATOS_BURACO = 6;
const CANDIDATOS_EXTERNO = 24;

/**
 * Par (vértice do externo, vértice do buraco) que serve de ponte: dos
 * vértices mais à DIREITA do buraco (é de lá que a ponte clássica sai),
 * o externo mais PRÓXIMO cuja ligação não cruza aresta nenhuma —
 * segmento que sai de dentro do polígono e não cruza a fronteira fica
 * inteiro dentro dele. Busca por candidatos (⚑ tetos abaixo), não
 * exaustiva: sem candidato livre devolve o par mais próximo, e a
 * triangulação ainda tem o leque como rede de segurança.
 */
function acharPonte(
  poli: Contorno,
  buraco: Contorno,
  outros: Contorno[]
): { iPoli: number; iBuraco: number } {
  const arestas: number[][] = [];
  const juntar = (c: Contorno) => {
    for (let i = 0; i < c.ids.length; i++) {
      const j = (i + 1) % c.ids.length;
      arestas.push([c.u[i], c.v[i], c.u[j], c.v[j]]);
    }
  };
  juntar(poli);
  juntar(buraco);
  for (const o of outros) juntar(o);

  const doBuraco = buraco.u
    .map((_, i) => i)
    .sort((a, b) => buraco.u[b] - buraco.u[a])
    .slice(0, CANDIDATOS_BURACO);
  let reserva = { iPoli: 0, iBuraco: doBuraco[0], distancia: Infinity };
  for (const ib of doBuraco) {
    const hu = buraco.u[ib];
    const hv = buraco.v[ib];
    const perto = poli.u
      .map((_, i) => i)
      .sort(
        (a, b) =>
          Math.hypot(poli.u[a] - hu, poli.v[a] - hv) -
          Math.hypot(poli.u[b] - hu, poli.v[b] - hv)
      )
      .slice(0, CANDIDATOS_EXTERNO);
    for (const ip of perto) {
      const ou = poli.u[ip];
      const ov = poli.v[ip];
      const distancia = Math.hypot(ou - hu, ov - hv);
      if (distancia < reserva.distancia) {
        reserva = { iPoli: ip, iBuraco: ib, distancia };
      }
      let livre = true;
      for (const a of arestas) {
        if (cruzam(hu, hv, ou, ov, a[0], a[1], a[2], a[3])) {
          livre = false;
          break;
        }
      }
      if (livre) return { iPoli: ip, iBuraco: ib };
    }
  }
  return { iPoli: reserva.iPoli, iBuraco: reserva.iBuraco };
}

const EPS_2D = 1e-9;

function orientacao(
  au: number,
  av: number,
  bu: number,
  bv: number,
  cu: number,
  cv: number
): number {
  const d = (bu - au) * (cv - av) - (bv - av) * (cu - au);
  return Math.abs(d) < EPS_2D ? 0 : d > 0 ? 1 : -1;
}

function noSegmento(
  au: number,
  av: number,
  bu: number,
  bv: number,
  pu: number,
  pv: number
): boolean {
  return (
    pu >= Math.min(au, bu) - EPS_2D &&
    pu <= Math.max(au, bu) + EPS_2D &&
    pv >= Math.min(av, bv) - EPS_2D &&
    pv <= Math.max(av, bv) + EPS_2D
  );
}

/**
 * Os segmentos se cruzam de verdade? Pontas COINCIDENTES não contam (a
 * ponte nasce e morre em vértices da fronteira); toque em T e sobreposição
 * colinear contam — a ponte tem de ser limpa.
 */
function cruzam(
  p1u: number,
  p1v: number,
  p2u: number,
  p2v: number,
  q1u: number,
  q1v: number,
  q2u: number,
  q2v: number
): boolean {
  const mesmo = (au: number, av: number, bu: number, bv: number) =>
    Math.abs(au - bu) < EPS_2D && Math.abs(av - bv) < EPS_2D;
  if (
    mesmo(p1u, p1v, q1u, q1v) ||
    mesmo(p1u, p1v, q2u, q2v) ||
    mesmo(p2u, p2v, q1u, q1v) ||
    mesmo(p2u, p2v, q2u, q2v)
  ) {
    return false;
  }
  const d1 = orientacao(q1u, q1v, q2u, q2v, p1u, p1v);
  const d2 = orientacao(q1u, q1v, q2u, q2v, p2u, p2v);
  const d3 = orientacao(p1u, p1v, p2u, p2v, q1u, q1v);
  const d4 = orientacao(p1u, p1v, p2u, p2v, q2u, q2v);
  if (d1 * d2 < 0 && d3 * d4 < 0) return true;
  if (d1 === 0 && noSegmento(q1u, q1v, q2u, q2v, p1u, p1v)) return true;
  if (d2 === 0 && noSegmento(q1u, q1v, q2u, q2v, p2u, p2v)) return true;
  if (d3 === 0 && noSegmento(p1u, p1v, p2u, p2v, q1u, q1v)) return true;
  if (d4 === 0 && noSegmento(p1u, p1v, p2u, p2v, q2u, q2v)) return true;
  return false;
}

/**
 * Ear clipping do polígono (já com as pontes dentro). É uma operação
 * TOPOLÓGICA: cada aresta do polígono é usada uma vez e cada diagonal
 * nasce em dois sentidos — a tampa fecha o sólido mesmo com polígono
 * feio. As duas cópias de um vértice de ponte (mesmo índice) nunca entram
 * no mesmo triângulo. null = travou (a chamadora cai no leque).
 */
function triangularPorOrelhas(poligono: Contorno): number[] | null {
  const ids = poligono.ids.slice();
  const u = poligono.u.slice();
  const v = poligono.v.slice();
  const saida: number[] = [];
  let n = ids.length;
  if (n < 3) return saida;
  let i = 0;
  let semSorte = 0;
  while (n > 3) {
    const ip = (i + n - 1) % n;
    const iq = (i + 1) % n;
    if (ehOrelha(ids, u, v, n, ip, i, iq)) {
      saida.push(ids[ip], ids[i], ids[iq]);
      ids.splice(i, 1);
      u.splice(i, 1);
      v.splice(i, 1);
      n--;
      if (i >= n) i = 0;
      semSorte = 0;
      continue;
    }
    i = (i + 1) % n;
    if (++semSorte <= n) continue;
    // Travou: corta a orelha de maior área entre as viáveis (⚑ defensivo,
    // mantém a contabilidade de arestas e garante progresso).
    let melhor = -1;
    let melhorArea = -Infinity;
    for (let j = 0; j < n; j++) {
      const jp = (j + n - 1) % n;
      const jq = (j + 1) % n;
      if (ids[jp] === ids[j] || ids[j] === ids[jq] || ids[jq] === ids[jp]) {
        continue;
      }
      const area =
        (u[j] - u[jp]) * (v[jq] - v[jp]) - (v[j] - v[jp]) * (u[jq] - u[jp]);
      if (area > melhorArea) {
        melhorArea = area;
        melhor = j;
      }
    }
    if (melhor < 0) return null;
    saida.push(
      ids[(melhor + n - 1) % n],
      ids[melhor],
      ids[(melhor + 1) % n]
    );
    ids.splice(melhor, 1);
    u.splice(melhor, 1);
    v.splice(melhor, 1);
    n--;
    i = 0;
    semSorte = 0;
  }
  if (ids[0] === ids[1] || ids[1] === ids[2] || ids[2] === ids[0]) return null;
  saida.push(ids[0], ids[1], ids[2]);
  return saida;
}

function ehOrelha(
  ids: number[],
  u: number[],
  v: number[],
  n: number,
  ip: number,
  i: number,
  iq: number
): boolean {
  const ia = ids[ip];
  const ib = ids[i];
  const ic = ids[iq];
  if (ia === ib || ib === ic || ic === ia) return false;
  const au = u[ip];
  const av = v[ip];
  const bu = u[i];
  const bv = v[i];
  const cu = u[iq];
  const cv = v[iq];
  const area = (bu - au) * (cv - av) - (bv - av) * (cu - au);
  if (area <= 0) return false; // reflexo ou colinear
  const uMin = Math.min(au, bu, cu);
  const uMax = Math.max(au, bu, cu);
  const vMin = Math.min(av, bv, cv);
  const vMax = Math.max(av, bv, cv);
  for (let j = 0; j < n; j++) {
    if (j === ip || j === i || j === iq) continue;
    const id = ids[j];
    if (id === ia || id === ib || id === ic) continue; // cópia da ponte
    const pu = u[j];
    const pv = v[j];
    if (pu < uMin || pu > uMax || pv < vMin || pv > vMax) continue;
    if (
      (bu - au) * (pv - av) - (bv - av) * (pu - au) >= 0 &&
      (cu - bu) * (pv - bv) - (cv - bv) * (pu - bu) >= 0 &&
      (au - cu) * (pv - cv) - (av - cv) * (pu - cu) >= 0
    ) {
      return false;
    }
  }
  return true;
}

/**
 * O que o corte LATERAL (x ou y) faz com o apoio radial — resumo caro
 * (varredura), memoizado por objeto de params.
 */
interface ResumoLateral {
  /**
   * Raio até onde o material sobrevive em TODAS as direções: a distância
   * do eixo ao plano quando o lado que fica contém o eixo; 0 quando o
   * corte removeu o próprio eixo.
   */
  raioSeguroMm: number;
  /** Existe superfície de pouso? (falso quando o eixo foi removido.) */
  pousoExiste: boolean;
  /** Quanto a peça desceu ao reassentar em z = 0. */
  deslocamentoMm: number;
  /** Cota do topo REAL da peça cortada (já reassentada). */
  alturaTopoMm: number;
}

/** Passo e teto da varredura radial — os MESMOS de tangencia.ts. */
const PASSO_VARREDURA_MM = 1;
const TETO_VARREDURA_MM = 512;

/**
 * Folga das comparações de cota (mm): a malha guarda posições em
 * Float32, então um vértice que está EXATAMENTE no topo da peça cortada
 * chega aqui a alguns 1e-5 acima dele. Sem a folga, o envelope zeraria na
 * cota do topo e um vizinho encostaria dentro da peça — A1 ao contrário.
 */
const FOLGA_COTA_MM = 1e-3;

/**
 * Apoio (A1) de um bloco FATIADO — delega ao apoio da forma quando não há
 * fatia e conta a verdade sobre a peça cortada quando há: peça flutuando
 * ou atravessando é estado impossível.
 *
 * Corte em Z, lado "menor" (o topo sai): o topo passa a ser o plano do
 * corte, e a superfície de pouso é o PLATÔ da seção (raioPlatoMm da
 * forma) — mais a superfície original onde ela já estava ABAIXO do corte
 * (o piso da cavidade de uma casca continua sendo onde algo pequeno
 * assenta). ⚑ sem raioPlatoMm o platô é ZERO: só o eixo apoia. É uma
 * promessa a MENOS (o bloco vai para a mesa em vez de pousar), nunca a
 * mais — e a forma que ganhar raioPlatoMm passa a apoiar a seção inteira
 * sem mudar este arquivo.
 *
 * Corte em Z, lado "maior" (a base sai e a peça reassenta): a altura cai
 * para H − zc, as cotas do topo e do envelope deslocam −zc e a base vira
 * plana em 0 (a seção do corte é a nova área de contato com a mesa).
 *
 * Corte em X ou Y: ⚑ o modelo de apoio do núcleo é RADIAL (recebe
 * distância ao eixo, não direção), e um corte lateral é assimétrico por
 * natureza. A escolha é ser CONSERVADORA e honesta:
 * — a superfície de POUSO só existe até `raioSeguroMm`, o raio em que o
 *   material sobrevive em todas as direções; além dele, null (nada pousa
 *   ali; a chamadora manda o bloco para a mesa, que é sempre válido);
 * — o ENVELOPE lateral fica INALTERADO (não descontamos o lado que saiu):
 *   envelope maior nunca interpenetra — conservador do lado certo;
 * — quando o corte remove o próprio EIXO, a peça reassenta mais alto na
 *   superfície de baixo: a altura do topo cai junto (varredura radial do
 *   que sobrou) e não há pouso nenhum.
 * Contato DIRECIONAL exato (saber que o material sobrou só para −x) fica
 * para quando o uso pedir: pede um apoio com direção, não um raio — a
 * mesma fronteira já registrada em tipos.ts para plantas quadradas.
 */
export function apoioComFatia(base: ApoioBloco): ApoioBloco {
  // Memo por OBJETO de params (eles são imutáveis no núcleo): a varredura
  // radial do corte lateral é caríssima para rodar a cada amostra da
  // varredura de tangencia.ts.
  const memo = new WeakMap<ParametrosBloco, ResumoLateral>();

  const lateral = (p: ParametrosBloco, fatia: FatiaBloco): ResumoLateral => {
    const pronto = memo.get(p);
    if (pronto) return pronto;
    const c = fatia.posicaoMm;
    const eixoFica = fatia.lado === "menor" ? c >= 0 : c <= 0;
    let resumo: ResumoLateral;
    if (eixoFica) {
      resumo = {
        raioSeguroMm: Math.abs(c),
        pousoExiste: true,
        deslocamentoMm: Math.max(0, base.zSuperficieBaseMm(p, 0) ?? 0),
        alturaTopoMm: base.alturaTopoMm(p),
      };
    } else {
      // O eixo saiu: a peça só existe a partir de |c| do eixo. A base dos
      // primitivos da F1 é plana ou calota que SOBE com a distância, então
      // o ponto mais baixo do que sobrou está em |c| ⚑.
      const dMin = Math.abs(c);
      const deslocamentoMm = Math.max(0, base.zSuperficieBaseMm(p, dMin) ?? 0);
      let topo = -Infinity;
      const amostras = [dMin];
      for (
        let d = Math.ceil(dMin);
        d <= TETO_VARREDURA_MM;
        d += PASSO_VARREDURA_MM
      ) {
        amostras.push(d);
      }
      for (const r of base.raiosNotaveisMm?.(p) ?? []) {
        if (r >= dMin) amostras.push(r);
      }
      for (const d of amostras) {
        const z = base.zSuperficieTopoMm(p, d);
        if (z != null && z > topo) topo = z;
      }
      if (!Number.isFinite(topo)) topo = base.alturaTopoMm(p);
      resumo = {
        raioSeguroMm: 0,
        pousoExiste: false,
        deslocamentoMm,
        alturaTopoMm: Math.max(0, topo - deslocamentoMm),
      };
    }
    memo.set(p, resumo);
    return resumo;
  };

  /** Platô da seção do corte em Z (0 = a forma não sabe dizer ⚑). */
  const plato = (p: ParametrosBloco, zMm: number): number =>
    Math.max(0, base.raioPlatoMm?.(p, zMm) ?? 0);

  /** Cota do topo da peça JÁ cortada e reassentada. */
  const alturaTopoDe = (p: ParametrosBloco): number => {
    const fatia = p.fatia;
    if (!fatia) return base.alturaTopoMm(p);
    if (fatia.eixo === "z") {
      return fatia.lado === "menor"
        ? Math.min(base.alturaTopoMm(p), fatia.posicaoMm)
        : Math.max(0, base.alturaTopoMm(p) - fatia.posicaoMm);
    }
    return lateral(p, fatia).alturaTopoMm;
  };

  /** Quanto a cota local subiu na peça INTEIRA (o reassentamento). */
  const deslocamentoDe = (p: ParametrosBloco, fatia: FatiaBloco): number =>
    fatia.eixo === "z"
      ? fatia.lado === "maior"
        ? fatia.posicaoMm
        : 0
      : lateral(p, fatia).deslocamentoMm;

  const apoio: ApoioBloco = {
    alturaTopoMm: alturaTopoDe,

    raioApoioSuperiorMm(p) {
      const fatia = p.fatia;
      if (!fatia) return base.raioApoioSuperiorMm(p);
      if (fatia.eixo === "z") {
        if (fatia.lado === "maior") return base.raioApoioSuperiorMm(p);
        // Corte acima do material: nada muda (defensivo).
        if (fatia.posicaoMm >= base.alturaTopoMm(p)) {
          return base.raioApoioSuperiorMm(p);
        }
        return plato(p, fatia.posicaoMm);
      }
      const r = lateral(p, fatia);
      return r.pousoExiste
        ? Math.min(base.raioApoioSuperiorMm(p), r.raioSeguroMm)
        : 0;
    },

    raioApoioInferiorMm(p) {
      const fatia = p.fatia;
      if (!fatia) return base.raioApoioInferiorMm(p);
      if (fatia.eixo === "z") {
        return fatia.lado === "menor"
          ? base.raioApoioInferiorMm(p)
          : plato(p, fatia.posicaoMm);
      }
      const r = lateral(p, fatia);
      return r.pousoExiste
        ? Math.min(base.raioApoioInferiorMm(p), r.raioSeguroMm)
        : 0;
    },

    raioEnvelopeMm(p, zMm) {
      const fatia = p.fatia;
      if (!fatia) return base.raioEnvelopeMm(p, zMm);
      // Acima do topo REAL da peça cortada não há envelope; abaixo dele, o
      // envelope é o da peça inteira na cota equivalente — o corte lateral
      // NÃO desconta o lado que saiu (envelope maior nunca interpenetra).
      if (zMm < -FOLGA_COTA_MM) return 0;
      if (zMm > alturaTopoDe(p) + FOLGA_COTA_MM) return 0;
      const cota = Math.max(0, zMm) + deslocamentoDe(p, fatia);
      return base.raioEnvelopeMm(p, Math.min(cota, base.alturaTopoMm(p)));
    },

    zSuperficieTopoMm(p, dMm) {
      const fatia = p.fatia;
      if (!fatia) return base.zSuperficieTopoMm(p, dMm);
      const original = base.zSuperficieTopoMm(p, dMm);
      if (fatia.eixo === "z") {
        const zc = fatia.posicaoMm;
        if (fatia.lado === "menor") {
          // A superfície original sobrevive onde já estava abaixo do corte
          // (piso da cavidade, calota que desce); no resto, o platô plano.
          if (original != null && original <= zc) return original;
          return dMm <= plato(p, zc) ? zc : null;
        }
        // Lado "maior": o que ficou abaixo do corte foi removido — ali a
        // peça é passante (o bloco desce até a mesa), então null.
        return original != null && original >= zc ? original - zc : null;
      }
      const r = lateral(p, fatia);
      if (!r.pousoExiste || dMm > r.raioSeguroMm) return null;
      return original == null ? null : Math.max(0, original - r.deslocamentoMm);
    },

    zSuperficieBaseMm(p, dMm) {
      const fatia = p.fatia;
      if (!fatia) return base.zSuperficieBaseMm(p, dMm);
      const original = base.zSuperficieBaseMm(p, dMm);
      if (fatia.eixo === "z") {
        if (fatia.lado === "menor") return original;
        const zc = fatia.posicaoMm;
        if (original != null && original >= zc) return original - zc;
        return dMm <= plato(p, zc) ? 0 : null;
      }
      const r = lateral(p, fatia);
      if (!r.pousoExiste || dMm > r.raioSeguroMm) return null;
      return original == null ? null : Math.max(0, original - r.deslocamentoMm);
    },

    raiosNotaveisMm(p) {
      const fatia = p.fatia;
      const daForma = base.raiosNotaveisMm?.(p) ?? [];
      if (!fatia) return daForma;
      // A borda do platô do corte (e o raio seguro do corte lateral) é
      // degrau na superfície de pouso: a varredura de tangencia.ts precisa
      // amostrar o raio EXATO, senão o pouso na borda penetra sub-mm.
      const novo =
        fatia.eixo === "z"
          ? plato(p, fatia.posicaoMm)
          : lateral(p, fatia).raioSeguroMm;
      return novo > 0 ? [...daForma, novo] : daForma;
    },
  };

  if (base.raioPlatoMm) {
    const platoBase = base.raioPlatoMm.bind(base);
    apoio.raioPlatoMm = (p, zMm) => {
      const fatia = p.fatia;
      if (!fatia) return platoBase(p, zMm);
      if (fatia.eixo !== "z") {
        // Seção lateral: conservador — o platô nunca passa do raio seguro.
        const r = lateral(p, fatia);
        return Math.min(
          platoBase(p, zMm + r.deslocamentoMm),
          r.raioSeguroMm
        );
      }
      if (fatia.lado === "menor") {
        return zMm > fatia.posicaoMm ? 0 : platoBase(p, zMm);
      }
      return platoBase(p, zMm + fatia.posicaoMm);
    };
  }

  return apoio;
}
