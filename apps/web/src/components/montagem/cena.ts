/**
 * Montagem v2 · F2 — o modelo de cena que pluga a UI na tangência do
 * núcleo (invariante A1: peça flutuando é inconstruível — toda operação
 * daqui devolve contatos vindos de tangencia.ts, nunca posições cruas).
 *
 * TS puro, sem React: o estado é imutável (cada operação devolve uma
 * cena nova) para o undo ser um snapshot barato.
 */

import {
  BLOCO_PADRAO,
  PONTOS_DE_LUZ_POR_OBRA,
  apoioDaForma,
  apoioPontoDeLuz,
  assentarAoEntrar,
  contatoIma,
  deslizarContato,
  fatiaDeBaseEstavel,
  grampearBloco,
  type ApoioDe,
  type BlocoNaCena,
  type FormaBloco,
  type ParametrosBloco,
} from "@per-parte/nucleo";

/**
 * Contrato F2 do ponto de luz (documentado em tipos.ts do núcleo): ele
 * NÃO é FormaBloco — a cena amplia o discriminante e o ApoioDe daqui
 * resolve apoioPontoDeLuz para esses itens (params ignorados).
 */
export const FORMA_LUZ = "ponto-de-luz" as unknown as FormaBloco;

export interface ItemCena extends BlocoNaCena {
  /** Giro em torno do próprio eixo Z, em graus — visual (a tangência é
   * radial e não muda com o giro; plantas quadradas usam a aproximação
   * documentada em tangencia.ts). */
  giroZGraus: number;
}

export interface Cena {
  itens: ItemCena[];
  proximoId: number;
}

export const CENA_VAZIA: Cena = { itens: [], proximoId: 1 };

export const ehPontoDeLuz = (item: ItemCena): boolean =>
  (item.params.forma as string) === (FORMA_LUZ as string);

export const pontosDeLuz = (cena: Cena): ItemCena[] =>
  cena.itens.filter(ehPontoDeLuz);

/** Resolve o apoio de qualquer item da cena (blocos + ponto de luz). */
export const apoioDeCena: ApoioDe = (forma) =>
  (forma as string) === (FORMA_LUZ as string)
    ? apoioPontoDeLuz
    : apoioDaForma(forma);

const paramsDaLuz = (): ParametrosBloco => ({
  ...BLOCO_PADRAO,
  forma: FORMA_LUZ,
});

/**
 * Adiciona uma forma: assenta no topo da mais alta (mesa se a cena está
 * vazia). Quem pousa NO CHÃO entra com base estável — a forma mede a
 * própria área de contato e, se ela não a sustenta, nasce com o corte que
 * sustenta (item 1 do plano de alterações: a esfera vem com pé chato). A
 * regra é do núcleo (`fatiaDeBaseEstavel`); a cena só decide QUANDO
 * aplicar: na entrada, nunca durante um arrasto — mudar a geometria de
 * alguém no meio de um gesto seria assustador.
 */
export function adicionarForma(cena: Cena, params: ParametrosBloco): Cena {
  let finais = params;
  let contato = assentarAoEntrar(finais, cena.itens, apoioDeCena);
  if (contato.sobre == null) {
    const fatia = fatiaDeBaseEstavel(finais, apoioDeCena(finais.forma));
    if (fatia) {
      finais = grampearBloco({ ...finais, fatia });
      // O corte muda a altura da peça: re-assenta com a geometria final.
      contato = assentarAoEntrar(finais, cena.itens, apoioDeCena);
    }
  }
  const item: ItemCena = {
    id: cena.proximoId,
    params: finais,
    contato,
    giroZGraus: 0,
  };
  return { itens: [...cena.itens, item], proximoId: cena.proximoId + 1 };
}

/** Adiciona o ponto de luz (clamp: máximo da espec §6 — botão desabilita). */
export function adicionarPontoDeLuz(cena: Cena): Cena {
  if (pontosDeLuz(cena).length >= PONTOS_DE_LUZ_POR_OBRA.max) return cena;
  return adicionarForma(cena, paramsDaLuz());
}

/** Filhos diretos (quem assenta sobre o item). */
const dependentesDe = (itens: ItemCena[], id: number): ItemCena[] =>
  itens.filter((b) => b.contato.sobre === id);

/**
 * Re-assenta a cadeia de dependentes de um item que mudou (altura nova,
 * params novos): cada filho desliza 0 mm — o contato re-clampa e o
 * zBase re-assenta — e propaga para os filhos dele.
 */
function reassentarDependentes(itens: ItemCena[], idRaiz: number): ItemCena[] {
  let atuais = itens;
  const fila = [idRaiz];
  while (fila.length > 0) {
    const id = fila.shift()!;
    for (const filho of dependentesDe(atuais, id)) {
      const contato = deslizarContato(filho, atuais, 0, 0, apoioDeCena);
      atuais = atuais.map((b) => (b.id === filho.id ? { ...b, contato } : b));
      fila.push(filho.id);
    }
  }
  return atuais;
}

/** Move um item em planta: desliza pela superfície de apoio (snap A1). */
export function moverItem(
  cena: Cena,
  id: number,
  deltaXMm: number,
  deltaYMm: number
): Cena {
  const item = cena.itens.find((b) => b.id === id);
  if (!item) return cena;
  const contato = deslizarContato(
    item,
    cena.itens,
    deltaXMm,
    deltaYMm,
    apoioDeCena
  );
  let itens = cena.itens.map((b) => (b.id === id ? { ...b, contato } : b));
  itens = reassentarDependentes(itens, id);
  return { ...cena, itens };
}

/** Gira o item em torno do próprio eixo (mantém o contato — ver tipo). */
export function girarItem(cena: Cena, id: number, deltaGraus: number): Cena {
  return {
    ...cena,
    itens: cena.itens.map((b) =>
      b.id === id ? { ...b, giroZGraus: b.giroZGraus + deltaGraus } : b
    ),
  };
}

/**
 * Troca os params de um bloco (já passa por grampearBloco aqui — fonte
 * única) e re-assenta o próprio contato e a cadeia de quem depende dele.
 */
export function atualizarParams(
  cena: Cena,
  id: number,
  parciais: Partial<ParametrosBloco>
): Cena {
  const item = cena.itens.find((b) => b.id === id);
  if (!item || ehPontoDeLuz(item)) return cena;
  const params = grampearBloco({ ...item.params, ...parciais });
  let itens = cena.itens.map((b) => (b.id === id ? { ...b, params } : b));
  const atualizado = itens.find((b) => b.id === id)!;
  const contato = deslizarContato(atualizado, itens, 0, 0, apoioDeCena);
  itens = itens.map((b) => (b.id === id ? { ...b, contato } : b));
  itens = reassentarDependentes(itens, id);
  return { ...cena, itens };
}

/**
 * Apaga um item; dependentes re-ancoram pelo ímã no próprio (x, y) —
 * ninguém vira órfão (a mesa sempre existe) e nada flutua. Ordem de
 * baixo para cima para as cadeias re-ancorarem sobre o que restou.
 */
export function apagarItem(cena: Cena, id: number): Cena {
  const restantes = cena.itens.filter((b) => b.id !== id);
  const orfaos = restantes
    .filter((b) => b.contato.sobre === id)
    .sort((a, b) => a.contato.zBaseMm - b.contato.zBaseMm);
  let itens = restantes;
  for (const orfao of orfaos) {
    const semEle = itens.filter((b) => b.id !== orfao.id);
    const contato = contatoIma(
      orfao.params,
      semEle,
      orfao.contato.xMm,
      orfao.contato.yMm,
      apoioDeCena
    );
    itens = itens.map((b) => (b.id === orfao.id ? { ...b, contato } : b));
    itens = reassentarDependentes(itens, orfao.id);
  }
  return { ...cena, itens };
}
