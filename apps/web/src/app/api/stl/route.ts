import {
  BASES,
  estabilidade,
  gerarSTLBinario,
  grampearCorpo,
  grampearDifusor,
  grampearSegmentos,
  malhaRevolucao,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
} from "@per-parte/nucleo";

const PARTES = ["base", "corpo", "difusor"] as const;
type Parte = (typeof PARTES)[number];

/** Acabamento "Liso" sobe para resolução de produção; facetas são design e ficam exatas. */
const SEGMENTOS_PRODUCAO_LISO = 128;

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
  const base = BASES[Number(dados.iBase)] ?? BASES[0];
  const corpo = grampearCorpo(dados.corpo ?? {});
  const difusor = grampearDifusor(dados.difusor ?? {});
  const segmentos = grampearSegmentos(dados.segmentos);

  const est = estabilidade(base, corpo, difusor);

  const perfil =
    parte === "base"
      ? perfilBase(base, est.escala)
      : parte === "corpo"
        ? perfilCorpo(corpo)
        : perfilDifusor(difusor);

  const segmentosParte =
    parte === "base" || segmentos === 40 ? SEGMENTOS_PRODUCAO_LISO : segmentos;

  const stl = gerarSTLBinario(malhaRevolucao(perfil, segmentosParte), parte);

  return new Response(new Blob([stl.buffer as ArrayBuffer]), {
    headers: {
      "Content-Type": "model/stl",
      "Content-Disposition": `attachment; filename="per-parte-${parte}.stl"`,
    },
  });
}
