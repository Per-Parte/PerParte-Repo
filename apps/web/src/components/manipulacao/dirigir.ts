/**
 * O roteador da manipulação direta (§2.1/§5.2) — a fonte única de verdade.
 *
 * Gesto nunca escreve valor cru no estado: todo pedido passa pelo MESMO
 * caminho dos sliders e do decodificarCriacao — grampear* do núcleo (ou
 * clamp de catálogo na separação, permutação na pilha) → setter registrado
 * na ponte. O ?c= não muda. Nada aqui toca packages/nucleo: só usa.
 *
 * Também mora aqui o mapa gesto→parâmetro (tabela §5.3, itens viáveis
 * hoje): planejarGesto() decide o que cada ferramenta dirige em cada parte
 * — e, sem mapeamento, devolve o hint didático (§3.5) e o arrasto cai em
 * órbita.
 */

import {
  ESTRUTURAIS,
  LIMITES_CRIAR,
  LIMITES_JUNTA,
  LIMITES_PLACA,
  grampearBase,
  grampearCorpo,
  grampearDifusor,
  grampearJunta,
  grampearPlaca,
} from "@per-parte/nucleo";
import {
  lerPonte,
  type Ferramenta,
  type MarcaParte,
  type RegistroPonte,
} from "./estado";
import { GANHO_GRAUS_POR_PX, indicePerfilLivre, regiaoCorpo } from "./gestos";

/** O parâmetro que um gesto dirige — sempre via grampear* + setter da ponte. */
export type AlvoGesto =
  | { tipo: "base"; campo: "alturaMm" | "raioMm" }
  | {
      tipo: "corpo";
      campo:
        | "alturaMm"
        | "volumeBojoMm"
        | "posicaoBojo"
        | "posicaoDobra"
        | "deslocamentoMm"
        | "torcaoGraus";
    }
  | { tipo: "perfilLivre"; indice: number }
  | { tipo: "difusor"; campo: "alturaMm" | "raioMm" }
  | { tipo: "junta"; campo: "inclinacaoGraus" | "deslocamentoMm" }
  | { tipo: "placa"; campo: "pescocoMm" | "inclinacaoGraus" | "raioMm" }
  | { tipo: "separacao" };

/** De onde vem o delta e como ele vira delta de parâmetro (§5.1). */
export interface MapeamentoGesto {
  alvo: AlvoGesto;
  /** vertical/radial/lateral = mm no plano de arrasto; pxX/pxY = pixels. */
  fonte: "vertical" | "radial" | "lateral" | "pxX" | "pxY";
  /** Multiplica o delta bruto (espelho de coluna, ganho angular, 2× da separação…). */
  escala: number;
  /** Valor do parâmetro no início do gesto — pedido = v0 + delta·escala. */
  v0: number;
}

/** O plano de um gesto: um mapeamento por eixo travado (§5.1) ou angular (Girar). */
export interface PlanoGesto {
  vertical?: MapeamentoGesto;
  horizontal?: MapeamentoGesto;
  /** Ferramenta Girar: sem trava de eixo — o delta vem do eixo da fonte. */
  angular?: MapeamentoGesto;
  /** Arrastar vertical na pilha (Montar): reordenação, não valor (§5.3). */
  pilha?: { k0: number };
}

export type ResultadoPlanejar = { plano: PlanoGesto } | { hint: string };

/** Hints didáticos de gesto sem mapeamento (§3.5) — voz 6,5–7, sem códigos. */
const HINTS = {
  redonda:
    "Essa peça é redonda — girar não muda a forma. O corpo com textura torce.",
  montar:
    "No Montar as peças vêm prontas do catálogo — para esculpir a forma de cada uma, troque para Inventar.",
  pastilha:
    "O assento acompanha as colunas — a ferramenta Mover no corpo muda a distância entre as luzes.",
  pilhaNoMontar:
    "As peças da pilha trocam de lugar no modo Montar, com a ferramenta Arrastar.",
  pilhaComArrastar:
    "É a ferramenta Arrastar que troca as peças da pilha de lugar — puxe para cima ou para baixo.",
} as const;

/** Informações do ponto de pega, calculadas no pointerdown. */
export interface PontoDePega {
  /** Altura relativa dentro da parte (0 = pé, 1 = topo) — regiões do corpo. */
  t: number;
  /** Distância do ponto de pega ao eixo da parte, em mm — borda da placa. */
  distEixoMm: number;
}

/**
 * Decide o que a ferramenta dirige nesta parte (tabela §5.3). Devolve o
 * plano do gesto, ou o hint didático quando não há mapeamento (o arrasto
 * então cai em órbita), ou null quando não há nem o que explicar.
 */
export function planejarGesto(
  marca: MarcaParte,
  ferramenta: Ferramenta,
  pega: PontoDePega
): ResultadoPlanejar | null {
  const p = lerPonte();
  if (!p || ferramenta === "selecionar") return null;
  const criando = p.modo === "criar";
  const dupla = p.pontosDeLuz === 2 || !!p.placa;
  const col = "coluna" in marca ? marca.coluna : 0;
  /** Espelho da coluna girada 180° (a −X): o lateral X inverte (§5.3). */
  const colFator = col === -1 ? -1 : 1;
  const mapaSeparacao = (escala: number): MapeamentoGesto => ({
    alvo: { tipo: "separacao" },
    fonte: "lateral",
    escala,
    v0: p.separacaoMm,
  });
  // Arrastar a coluna para fora abre as duas: Δsep = 2·ΔXmm·sign(xColuna).
  const sepColuna =
    dupla && col !== 0 ? mapaSeparacao(2 * Math.sign(col)) : undefined;

  switch (marca.parte) {
    case "base": {
      if (ferramenta === "girar") return { hint: HINTS.redonda };
      if (!criando) return { hint: HINTS.montar };
      const raio: MapeamentoGesto = {
        alvo: { tipo: "base", campo: "raioMm" },
        fonte: "radial",
        escala: 1,
        v0: p.criar.base.raioMm,
      };
      if (ferramenta === "arrastar") return { plano: { horizontal: raio } };
      return {
        plano: {
          horizontal: raio,
          vertical: {
            alvo: { tipo: "base", campo: "alturaMm" },
            fonte: "vertical",
            escala: 1,
            v0: p.criar.base.alturaMm,
          },
        },
      };
    }

    case "pastilha":
      return {
        hint: ferramenta === "girar" ? HINTS.redonda : HINTS.pastilha,
      };

    case "estrutural": {
      if (ferramenta === "girar") return { hint: HINTS.redonda };
      if (ferramenta === "arrastar") {
        if (!criando) {
          return {
            plano: { pilha: { k0: marca.indice }, horizontal: sepColuna },
          };
        }
        return { hint: HINTS.pilhaNoMontar };
      }
      // Mover: nos eixos fixos só a separação faz sentido na pilha.
      if (sepColuna) return { plano: { horizontal: sepColuna } };
      return {
        hint: criando ? HINTS.pilhaNoMontar : HINTS.pilhaComArrastar,
      };
    }

    case "corpo": {
      const c = p.criar.corpo;
      if (ferramenta === "girar") {
        if (!criando) return { hint: HINTS.montar };
        const texturaAtiva =
          c.profundidadeGomosMm > 0 &&
          (c.familiaTextura ? (c.repeticaoTextura ?? 0) > 0 : c.gomos > 0);
        if (!texturaAtiva) return { hint: HINTS.redonda };
        return {
          plano: {
            angular: {
              alvo: { tipo: "corpo", campo: "torcaoGraus" },
              fonte: "pxX",
              escala: GANHO_GRAUS_POR_PX.torcao * colFator,
              v0: c.torcaoGraus,
            },
          },
        };
      }
      if (!criando) {
        if (sepColuna) return { plano: { horizontal: sepColuna } };
        return { hint: HINTS.montar };
      }
      const alturaMm = Math.max(1, p.corpoEfetivo.alturaMm);
      const altura: MapeamentoGesto = {
        alvo: { tipo: "corpo", campo: "alturaMm" },
        fonte: "vertical",
        escala: 1,
        v0: c.alturaMm,
      };
      const desloc: MapeamentoGesto = {
        alvo: { tipo: "corpo", campo: "deslocamentoMm" },
        fonte: "lateral",
        escala: colFator,
        v0: c.deslocamentoMm,
      };
      // Normalizados (§5.1): percorrer a altura leva o valor de −1 a +1.
      const normalizado = (
        campo: "posicaoBojo" | "posicaoDobra",
        v0: number
      ): MapeamentoGesto => ({
        alvo: { tipo: "corpo", campo },
        fonte: "vertical",
        escala: 2 / alturaMm,
        v0,
      });
      const radialSilhueta = (): MapeamentoGesto =>
        c.perfilLivre
          ? {
              alvo: {
                tipo: "perfilLivre",
                indice: indicePerfilLivre(pega.t),
              },
              fonte: "radial",
              escala: 1,
              v0: c.perfilLivre[indicePerfilLivre(pega.t)],
            }
          : {
              alvo: { tipo: "corpo", campo: "volumeBojoMm" },
              fonte: "radial",
              escala: 1,
              v0: c.volumeBojoMm,
            };
      if (ferramenta === "mover") {
        // Eixos fixos: altura no vertical; no horizontal, a separação (na
        // dupla) ou a espinha em S.
        return {
          plano: { vertical: altura, horizontal: sepColuna ?? desloc },
        };
      }
      // Arrastar: a pega escolhe a região (§5.3).
      const regiao = regiaoCorpo(pega.t);
      if (regiao === "topo") {
        return { plano: { vertical: altura, horizontal: desloc } };
      }
      if (regiao === "meio") {
        return {
          plano: {
            vertical: c.perfilLivre
              ? undefined
              : normalizado("posicaoBojo", c.posicaoBojo),
            horizontal: radialSilhueta(),
          },
        };
      }
      // Pé: posicaoDobra se a espinha está curvada; senão a barriga sobe/desce.
      return {
        plano: {
          vertical:
            c.deslocamentoMm !== 0
              ? normalizado("posicaoDobra", c.posicaoDobra)
              : c.perfilLivre
                ? undefined
                : normalizado("posicaoBojo", c.posicaoBojo),
          horizontal: c.perfilLivre ? radialSilhueta() : undefined,
        },
      };
    }

    case "difusor": {
      if (marca.inclinada) {
        const j = p.criar.difusor.junta;
        if (!j || !criando) return null;
        if (ferramenta === "girar") {
          return {
            plano: {
              angular: {
                alvo: { tipo: "junta", campo: "inclinacaoGraus" },
                fonte: "pxY",
                escala: GANHO_GRAUS_POR_PX.juntaInclinacao,
                v0: j.inclinacaoGraus,
              },
            },
          };
        }
        const desloc: MapeamentoGesto = {
          alvo: { tipo: "junta", campo: "deslocamentoMm" },
          fonte: "lateral",
          escala: colFator,
          v0: j.deslocamentoMm,
        };
        if (ferramenta === "arrastar") return { plano: { horizontal: desloc } };
        return { plano: { horizontal: sepColuna ?? desloc } };
      }
      if (ferramenta === "girar") {
        return { hint: criando ? HINTS.redonda : HINTS.montar };
      }
      if (!criando) {
        if (sepColuna) return { plano: { horizontal: sepColuna } };
        return { hint: HINTS.montar };
      }
      const d = p.criar.difusor;
      const raio: MapeamentoGesto = {
        alvo: { tipo: "difusor", campo: "raioMm" },
        fonte: "radial",
        escala: 1,
        v0: d.raioMm,
      };
      const altura: MapeamentoGesto = {
        alvo: { tipo: "difusor", campo: "alturaMm" },
        fonte: "vertical",
        escala: 1,
        v0: d.alturaMm,
      };
      if (ferramenta === "arrastar") {
        return { plano: { vertical: altura, horizontal: raio } };
      }
      return { plano: { vertical: altura, horizontal: sepColuna ?? raio } };
    }

    case "placa": {
      const pl = p.placa;
      if (!pl) return null;
      if (ferramenta === "girar") {
        return {
          plano: {
            angular: {
              alvo: { tipo: "placa", campo: "inclinacaoGraus" },
              fonte: "pxY",
              escala: GANHO_GRAUS_POR_PX.placaInclinacao,
              v0: pl.inclinacaoGraus,
            },
          },
        };
      }
      const pescoco: MapeamentoGesto = {
        alvo: { tipo: "placa", campo: "pescocoMm" },
        fonte: "vertical",
        escala: 1,
        v0: pl.pescocoMm,
      };
      // A placa mora em −X: afastar da luz (ΔX negativo) abre a separação.
      const separacao = mapaSeparacao(-1);
      const naBorda = pega.distEixoMm > 0.7 * pl.raioMm;
      const horizontal =
        ferramenta === "arrastar" && naBorda
          ? ({
              alvo: { tipo: "placa", campo: "raioMm" },
              fonte: "radial",
              escala: 1,
              v0: pl.raioMm,
            } as MapeamentoGesto)
          : separacao;
      return { plano: { vertical: pescoco, horizontal } };
    }
  }
}

export interface ResultadoDirigir {
  /** O valor que realmente entrou no estado (pós-grampeio e passo). */
  efetivo: number;
  /** O pedido encostou no piso/teto — alimenta o motivo didático (§5.2). */
  limitou: "min" | "max" | null;
  /** Snap do Girar na cabeça: abaixo do mínimo a junta saiu (§5.3). */
  snap?: boolean;
}

const EPS = 1e-3;

/** Arredonda ao passo do slider correspondente (§5.1) — sem tremido. */
function arredondar(v: number, passo: number): number {
  return Math.round((Math.round(v / passo) * passo) * 1e4) / 1e4;
}

function resultado(pedido: number, efetivo: number): ResultadoDirigir {
  return {
    efetivo,
    limitou:
      pedido > efetivo + EPS ? "max" : pedido < efetivo - EPS ? "min" : null,
  };
}

/**
 * Aplica um pedido de gesto (§5.2): arredonda ao passo, grampeia pelo
 * núcleo (mais os tetos derivados que os sliders também usam) e chama o
 * MESMO setter do painel. Devolve o efetivo e se o pedido foi limitado.
 */
export function dirigir(
  alvo: AlvoGesto,
  pedido: number
): ResultadoDirigir | null {
  const p = lerPonte();
  if (!p) return null;

  switch (alvo.tipo) {
    case "base": {
      const campo = alvo.campo;
      const bruto = arredondar(pedido, LIMITES_CRIAR.base[campo].passo);
      const efetivo = grampearBase({ ...p.criar.base, [campo]: bruto })[campo];
      p.setCriar((c) => ({
        ...c,
        base: grampearBase({ ...c.base, [campo]: bruto }),
      }));
      return resultado(bruto, efetivo);
    }

    case "corpo": {
      const campo = alvo.campo;
      const bruto = arredondar(pedido, LIMITES_CRIAR.corpo[campo].passo);
      // Teto derivado da composição dupla (o mesmo do slider): a curva S
      // "para dentro" só até onde as colunas têm ar (§5.3).
      const aplicado =
        campo === "deslocamentoMm" && p.tetoDeslocInternoMm != null
          ? Math.max(bruto, -p.tetoDeslocInternoMm)
          : bruto;
      const efetivo = grampearCorpo({ ...p.criar.corpo, [campo]: aplicado })[
        campo
      ];
      p.setCriar((c) => ({
        ...c,
        corpo: grampearCorpo({ ...c.corpo, [campo]: aplicado }),
      }));
      return resultado(bruto, efetivo);
    }

    case "perfilLivre": {
      const atual = p.criar.corpo.perfilLivre;
      const i = alvo.indice;
      if (!atual || i < 0 || i >= atual.length) return null;
      const bruto = arredondar(
        pedido,
        LIMITES_CRIAR.corpo.perfilLivreRaioMm.passo
      );
      const proposto = atual.map((r, j) => (j === i ? bruto : r));
      const efetivo =
        grampearCorpo({ ...p.criar.corpo, perfilLivre: proposto })
          .perfilLivre?.[i] ?? bruto;
      p.setCriar((c) =>
        c.corpo.perfilLivre
          ? {
              ...c,
              corpo: grampearCorpo({
                ...c.corpo,
                perfilLivre: c.corpo.perfilLivre.map((r, j) =>
                  j === i ? bruto : r
                ),
              }),
            }
          : c
      );
      return resultado(bruto, efetivo);
    }

    case "difusor": {
      const campo = alvo.campo;
      const bruto = arredondar(pedido, LIMITES_CRIAR.difusor[campo].passo);
      // Teto derivado da dupla (o mesmo do slider): o raio raseia para os
      // difusores terem ar entre eles.
      const aplicado =
        campo === "raioMm" && p.raioDifusorTetoMm != null
          ? Math.min(bruto, p.raioDifusorTetoMm)
          : bruto;
      const efetivo = grampearDifusor({
        ...p.criar.difusor,
        [campo]: aplicado,
      })[campo];
      p.setCriar((c) => ({
        ...c,
        difusor: grampearDifusor({ ...c.difusor, [campo]: aplicado }),
      }));
      return resultado(bruto, efetivo);
    }

    case "junta": {
      const j = p.criar.difusor.junta;
      if (!j) return null;
      const campo = alvo.campo;
      const bruto = arredondar(pedido, LIMITES_JUNTA[campo].passo);
      // Snap (§5.3): endireitou abaixo do mínimo → a junta sai e a cabeça
      // volta a assentar reta. Nunca erro — um estado válido do catálogo.
      if (
        campo === "inclinacaoGraus" &&
        bruto < LIMITES_JUNTA.inclinacaoGraus.min
      ) {
        p.setCriar((c) =>
          c.difusor.junta
            ? { ...c, difusor: { ...c.difusor, junta: undefined } }
            : c
        );
        return { efetivo: 0, limitou: null, snap: true };
      }
      const grampeada = grampearJunta(
        { ...j, [campo]: bruto },
        p.criar.difusor.raioMm
      );
      if (!grampeada) return null;
      p.setCriar((c) =>
        c.difusor.junta
          ? {
              ...c,
              difusor: {
                ...c.difusor,
                junta: grampearJunta(
                  { ...c.difusor.junta, [campo]: bruto },
                  c.difusor.raioMm
                ),
              },
            }
          : c
      );
      return resultado(bruto, grampeada[campo]);
    }

    case "placa": {
      const pl = p.placa;
      if (!pl) return null;
      const campo = alvo.campo;
      const bruto = arredondar(pedido, LIMITES_PLACA[campo].passo);
      const efetivo = grampearPlaca({ ...pl, [campo]: bruto })[campo];
      p.setPlaca((atual) =>
        atual ? grampearPlaca({ ...atual, [campo]: bruto }) : atual
      );
      return resultado(bruto, efetivo);
    }

    case "separacao": {
      // Clamp de catálogo (§5.2): o teto físico e a separação efetiva
      // ficam com ajustarComposicaoDupla — padrão pedido × efetivo.
      const L = LIMITES_CRIAR.luminaria.separacaoMm;
      const bruto = arredondar(pedido, L.passo);
      const efetivo = Math.min(L.max, Math.max(L.min, bruto));
      p.setSeparacaoMm(efetivo);
      return resultado(bruto, efetivo);
    }
  }
}

/** Alturas reais das peças da pilha, na ordem atual (fronteiras do §5.3). */
export function alturasDaPilhaMm(p: RegistroPonte): number[] {
  return p.estruturais.map((i) => ESTRUTURAIS[i]?.alturaMm ?? 0);
}

/**
 * Reordena a pilha (§5.3): permutação do array de índices, nunca valor —
 * qualquer ordem é válida, os encaixes são os mesmos em toda peça.
 */
export function reordenarPilha(ordem0: number[], de: number, para: number) {
  const p = lerPonte();
  if (!p || de === para) return;
  if (de < 0 || de >= ordem0.length || para < 0 || para >= ordem0.length) {
    return;
  }
  const nova = [...ordem0];
  const [peca] = nova.splice(de, 1);
  nova.splice(para, 0, peca);
  p.setEstruturais(nova);
}
