import {
  ENCAIXES,
  estabilidade,
  gerarSTLBinario,
  grampearBase,
  grampearCorpo,
  grampearDifusor,
  grampearEstruturais,
  grampearLuminaria,
  grampearSegmentos,
  malhaRevolucao,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  perfilEstrutural,
  perfilPastilhaMacho,
  transladarMalha,
  unirMalhas,
  type EspinhaLateral,
  type TexturaRevolucao,
} from "@per-parte/nucleo";

const PARTES = ["base", "corpo", "difusor", "estrutural"] as const;
type Parte = (typeof PARTES)[number];

/** Acabamento "Liso" sobe para resolução de produção; facetas são design e ficam exatas. */
const SEGMENTOS_PRODUCAO_LISO = 128;
/** Com gomos, a malha sobe mais para os sulcos saírem redondos. */
const SEGMENTOS_PRODUCAO_GOMOS = 192;

export async function POST(req: Request) {
  const dados = await req.json().catch(() => null);
  if (!dados || !PARTES.includes(dados.parte)) {
    return Response.json(
      { erro: "informe parte: base | corpo | difusor | estrutural" },
      { status: 400 }
    );
  }
  const parte: Parte = dados.parte;

  // Backend não confia na Ferramenta: grampeia tudo de novo (regra mestra).
  const base = grampearBase(dados.base ?? {});
  const corpo = grampearCorpo(dados.corpo ?? {});
  const difusor = grampearDifusor(dados.difusor ?? {});
  const estruturais = grampearEstruturais(dados.estruturais);
  const segmentos = grampearSegmentos(dados.segmentos);
  const luminaria = grampearLuminaria(dados);

  // A pilha sobe corpo e difusor: para o alargamento da base (E2) o efeito
  // é o de um corpo mais alto — mesmo cálculo da Ferramenta.
  const alturaEstruturaisMm = estruturais.reduce((s, p) => s + p.alturaMm, 0);
  const corpoParaFisica =
    alturaEstruturaisMm > 0
      ? { ...corpo, alturaMm: corpo.alturaMm + alturaEstruturaisMm }
      : corpo;
  const est = estabilidade(
    base,
    corpoParaFisica,
    difusor,
    luminaria.pontosDeLuz
  );

  if (parte === "estrutural") {
    const indice = Math.min(
      Math.max(0, Math.trunc(Number(dados.indice) || 0)),
      Math.max(0, estruturais.length - 1)
    );
    if (!estruturais.length) {
      return Response.json(
        { erro: "a pilha está vazia — envie estruturais" },
        { status: 400 }
      );
    }
    const malhaEstrutural = malhaRevolucao(
      perfilEstrutural(estruturais[indice]),
      SEGMENTOS_PRODUCAO_LISO
    );
    const stlEstrutural = gerarSTLBinario(
      malhaEstrutural,
      `estrutural-${indice + 1}`
    );
    return new Response(new Blob([stlEstrutural.buffer as ArrayBuffer]), {
      headers: {
        "Content-Type": "model/stl",
        "Content-Disposition": `attachment; filename="per-parte-peca-${indice + 1}.stl"`,
      },
    });
  }

  let malha;
  if (parte === "base") {
    if (luminaria.pontosDeLuz === 2) {
      // Base dupla: prato sem o anel central + uma pastilha de encaixe por
      // coluna, afundada 1 mm na face (os sólidos se unem no fatiamento).
      const meiaSep =
        Math.min(
          luminaria.separacaoMm,
          Math.max(70, 2 * (base.raioMm * est.escala - 34))
        ) / 2;
      const prato = malhaRevolucao(
        perfilBase(base, est.escala, false),
        SEGMENTOS_PRODUCAO_LISO
      );
      const pastilha = malhaRevolucao(
        perfilPastilhaMacho(ENCAIXES.baseCorpo.anel),
        SEGMENTOS_PRODUCAO_LISO
      );
      malha = unirMalhas(
        prato,
        transladarMalha(pastilha, -meiaSep, 0, base.alturaMm - 1),
        transladarMalha(pastilha, meiaSep, 0, base.alturaMm - 1)
      );
    } else {
      malha = malhaRevolucao(
        perfilBase(base, est.escala),
        SEGMENTOS_PRODUCAO_LISO
      );
    }
  } else {
    let perfil;
    let textura: TexturaRevolucao;
    let espinha: EspinhaLateral | undefined;
    if (parte === "corpo") {
      perfil = perfilCorpo(corpo);
      textura = {
        gomos: corpo.gomos,
        profundidadeMm: corpo.profundidadeGomosMm,
        torcaoGraus: corpo.torcaoGraus,
        alturaMm: corpo.alturaMm,
        familia: corpo.familiaTextura,
        repeticao: corpo.repeticaoTextura,
      };
      espinha = {
        deslocamentoMm: corpo.deslocamentoMm,
        posicaoDobra: corpo.posicaoDobra,
        alturaMm: corpo.alturaMm,
      };
    } else {
      perfil = perfilDifusor(difusor);
      textura = {
        gomos: difusor.gomos,
        profundidadeMm: difusor.profundidadeGomosMm,
        torcaoGraus: 0,
        alturaMm: difusor.alturaMm,
      };
    }
    const comTextura =
      textura.profundidadeMm > 0 &&
      (textura.gomos > 0 ||
        (!!textura.familia &&
          textura.familia !== "gomos" &&
          (textura.repeticao ?? 0) > 0));
    const segmentosParte =
      segmentos === 40
        ? comTextura
          ? SEGMENTOS_PRODUCAO_GOMOS
          : SEGMENTOS_PRODUCAO_LISO
        : segmentos;
    malha = malhaRevolucao(perfil, segmentosParte, textura, espinha);
  }

  const stl = gerarSTLBinario(malha, parte);

  return new Response(new Blob([stl.buffer as ArrayBuffer]), {
    headers: {
      "Content-Type": "model/stl",
      "Content-Disposition": `attachment; filename="per-parte-${parte}.stl"`,
    },
  });
}
