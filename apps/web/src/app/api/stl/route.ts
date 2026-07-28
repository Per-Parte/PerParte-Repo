import {
  estabilidade,
  gerarSTLBinario,
  grampearBase,
  grampearCorpo,
  grampearDifusor,
  grampearSegmentos,
  malhaRevolucao,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  type TexturaRevolucao,
} from "@per-parte/nucleo";

const PARTES = ["base", "corpo", "difusor"] as const;
type Parte = (typeof PARTES)[number];

/** Acabamento "Liso" sobe para resolução de produção; facetas são design e ficam exatas. */
const SEGMENTOS_PRODUCAO_LISO = 128;
/** Com gomos, a malha sobe mais para os sulcos saírem redondos. */
const SEGMENTOS_PRODUCAO_GOMOS = 192;

export async function POST(req: Request) {
  const dados = await req.json().catch(() => null);
  if (!dados || !PARTES.includes(dados.parte)) {
    return Response.json(
      { erro: "informe parte: base | corpo | difusor" },
      { status: 400 }
    );
  }
  const parte: Parte = dados.parte;

  // Backend não confia na Ferramenta: grampeia tudo de novo (regra mestra).
  const base = grampearBase(dados.base ?? {});
  const corpo = grampearCorpo(dados.corpo ?? {});
  const difusor = grampearDifusor(dados.difusor ?? {});
  const segmentos = grampearSegmentos(dados.segmentos);

  const est = estabilidade(base, corpo, difusor);

  let perfil;
  let textura: TexturaRevolucao | undefined;
  if (parte === "base") {
    perfil = perfilBase(base, est.escala);
  } else if (parte === "corpo") {
    perfil = perfilCorpo(corpo);
    textura = {
      gomos: corpo.gomos,
      profundidadeMm: corpo.profundidadeGomosMm,
      torcaoGraus: corpo.torcaoGraus,
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

  const comGomos = !!textura && textura.gomos > 0 && textura.profundidadeMm > 0;
  const segmentosParte =
    parte === "base"
      ? SEGMENTOS_PRODUCAO_LISO
      : segmentos === 40
        ? comGomos
          ? SEGMENTOS_PRODUCAO_GOMOS
          : SEGMENTOS_PRODUCAO_LISO
        : segmentos;

  const stl = gerarSTLBinario(
    malhaRevolucao(perfil, segmentosParte, textura),
    parte
  );

  return new Response(new Blob([stl.buffer as ArrayBuffer]), {
    headers: {
      "Content-Type": "model/stl",
      "Content-Disposition": `attachment; filename="per-parte-${parte}.stl"`,
    },
  });
}
