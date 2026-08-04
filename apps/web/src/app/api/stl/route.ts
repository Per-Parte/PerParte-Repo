import {
  ajustarGolaAoDifusor,
  ENCAIXES,
  estabilidade,
  facetasParaBase,
  facetasParaCorpo,
  facetasParaDifusor,
  facetasParaEstrutural,
  gerarSTLBinario,
  grampearBase,
  grampearCorpo,
  grampearDifusor,
  grampearEstruturais,
  grampearExpoente,
  grampearLuminaria,
  grampearPlaca,
  grampearSegmentos,
  malhaCabecaInclinada,
  malhaPlaca,
  malhaRevolucao,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  perfilEstrutural,
  perfilPastilhaMacho,
  separacaoMaximaMm,
  transladarMalha,
  unirMalhas,
  type EspinhaLateral,
  type TexturaRevolucao,
} from "@per-parte/nucleo";

const PARTES = ["base", "corpo", "difusor", "estrutural", "placa"] as const;
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
  const difusor = grampearDifusor(dados.difusor ?? {});
  // Gola × difusor: a mesma verificação de interferência do preview.
  const corpo = ajustarGolaAoDifusor(grampearCorpo(dados.corpo ?? {}), difusor);
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

  // Acabamento por θ (facetas ≤16 OU squircle): vale para a LUMINÁRIA
  // inteira — base e pilha modulam junto com corpo e difusor (fase 2 do
  // EXT). 192 é múltiplo de 4/6/8/12/16, então as arestas caem exatamente
  // nos vértices do polígono; a superelipse é suave e só pede malha fina.
  const lados = segmentos <= 16 ? segmentos : 0;
  const expoente = grampearExpoente(dados.expoente);
  const comTheta = lados > 0 || !!expoente;
  // Refletor (PLACA): presença no request = composição luz + refletor.
  const comPlaca = dados.placa != null;

  if (parte === "placa") {
    const malhaRefletor = malhaPlaca(grampearPlaca(dados.placa), 128);
    const stlPlaca = gerarSTLBinario(malhaRefletor, "placa");
    return new Response(new Blob([stlPlaca.buffer as ArrayBuffer]), {
      headers: {
        "Content-Type": "model/stl",
        "Content-Disposition": `attachment; filename="per-parte-refletor.stl"`,
      },
    });
  }

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
      comTheta ? SEGMENTOS_PRODUCAO_GOMOS : SEGMENTOS_PRODUCAO_LISO,
      undefined,
      undefined,
      comTheta
        ? facetasParaEstrutural(lados, estruturais[indice].alturaMm, expoente)
        : undefined
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
    if (luminaria.pontosDeLuz === 2 || comPlaca) {
      // Base dupla: prato sem o anel central + uma pastilha de encaixe por
      // coluna, afundada 1 mm na face (os sólidos se unem no fatiamento).
      const meiaSep =
        Math.min(
          luminaria.separacaoMm,
          separacaoMaximaMm(base.raioMm, est.escala, lados, expoente)
        ) / 2;
      // O prato modula; as pastilhas são encaixe puro e ficam sempre redondas.
      const prato = malhaRevolucao(
        perfilBase(base, est.escala, false),
        comTheta ? SEGMENTOS_PRODUCAO_GOMOS : SEGMENTOS_PRODUCAO_LISO,
        undefined,
        undefined,
        comTheta ? facetasParaBase(lados, base.alturaMm, expoente) : undefined
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
        comTheta ? SEGMENTOS_PRODUCAO_GOMOS : SEGMENTOS_PRODUCAO_LISO,
        undefined,
        undefined,
        comTheta ? facetasParaBase(lados, base.alturaMm, expoente) : undefined
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
      // Cabeça inclinada (junta do Gio Task): malha própria do núcleo —
      // pescoço vertical com a fêmea + cabeça girada/deslocada. Lisa. ⚑
      if (difusor.junta) {
        const malhaCabeca = malhaCabecaInclinada(
          difusor,
          difusor.junta,
          SEGMENTOS_PRODUCAO_LISO
        );
        const stlCabeca = gerarSTLBinario(malhaCabeca, "difusor");
        return new Response(new Blob([stlCabeca.buffer as ArrayBuffer]), {
          headers: {
            "Content-Type": "model/stl",
            "Content-Disposition": `attachment; filename="per-parte-difusor.stl"`,
          },
        });
      }
      // Difusor vazado: preview existe, produção aguarda booleanos no
      // núcleo (manifold) — bloquear aqui é o backend não confiando na UI.
      if (difusor.vazado) {
        return Response.json(
          {
            erro: "difusor vazado ainda não tem STL de produção (⚑ booleanos) — remova o vazado para gerar",
          },
          { status: 422 }
        );
      }
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
    // Modulado por θ: a lateral vira prisma/superelipse com encaixes
    // REDONDOS — o ajuste F5 não depende do acabamento.
    const facetas = comTheta
      ? parte === "corpo"
        ? facetasParaCorpo(lados, corpo.alturaMm, expoente)
        : facetasParaDifusor(lados, difusor.alturaMm, expoente)
      : undefined;
    const segmentosParte = comTheta
      ? SEGMENTOS_PRODUCAO_GOMOS
      : comTextura
        ? SEGMENTOS_PRODUCAO_GOMOS
        : SEGMENTOS_PRODUCAO_LISO;
    // Corte de borda (z(θ)) é malha pura e SAI em produção — no difusor
    // (topo livre) e na GOLA do corpo (o macho fica rebaixado, fora do
    // alcance do corte por grampeamento).
    malha = malhaRevolucao(
      perfil,
      segmentosParte,
      comTheta ? undefined : textura,
      espinha,
      facetas,
      parte === "difusor" ? difusor.corte : corpo.gola ? corpo.corte : undefined
    );
  }

  const stl = gerarSTLBinario(malha, parte);

  return new Response(new Blob([stl.buffer as ArrayBuffer]), {
    headers: {
      "Content-Type": "model/stl",
      "Content-Disposition": `attachment; filename="per-parte-${parte}.stl"`,
    },
  });
}
