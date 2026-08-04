"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BASES,
  CORPOS,
  DIFUSORES,
  ENCAIXES,
  ESTRUTURAIS,
  FACETAS,
  PALETA,
  contrapesoNecessarioG,
  estabilidade,
  estimarPreco,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  perfilEstrutural,
  separacaoMaximaMm,
  type ParametrosBase,
  type ParametrosCorpo,
  type ParametrosDifusor,
} from "@per-parte/nucleo";
import Cena3D from "./Cena3D";
import PainelMontar from "./PainelMontar";
import PainelCriar from "./PainelCriar";
import BotaoSalvar from "./BotaoSalvar";
import { codificarCriacao, decodificarCriacao } from "@/lib/criacao";

export type ParteAlvo = "base" | "corpo" | "difusor";
export type AlvoCor = "all" | ParteAlvo;
export type CoresPartes = Record<ParteAlvo, number>;

export interface EstadoCriar {
  base: ParametrosBase;
  corpo: ParametrosCorpo;
  difusor: ParametrosDifusor;
}

type Modo = "montar" | "criar";

const oDiametroCm = (raioMm: number) =>
  ((raioMm * 2) / 10).toFixed(1).replace(".", ",");

/** Seções que orbitam a luminária no desktop. */
const SECOES_MONTAR = [
  { id: "base", rotulo: "Base" },
  { id: "pilha", rotulo: "Empilhar" },
  { id: "corpo", rotulo: "Corpo" },
  { id: "difusor", rotulo: "Difusor" },
  { id: "luzes", rotulo: "Luzes" },
  { id: "cor", rotulo: "Cores" },
  { id: "regras", rotulo: "Regras" },
];
const SECOES_CRIAR = [
  { id: "base", rotulo: "Base" },
  { id: "corpo", rotulo: "Corpo" },
  { id: "silhueta", rotulo: "Silhueta" },
  { id: "curva", rotulo: "Curva S" },
  { id: "textura", rotulo: "Textura" },
  { id: "difusor", rotulo: "Difusor" },
  { id: "luzes", rotulo: "Luzes" },
  { id: "regras", rotulo: "Regras" },
  { id: "publicar", rotulo: "Publicar" },
];

export default function Configurador() {
  const [modo, setModo] = useState<Modo>("montar");
  const [iBase, setIBase] = useState(0);
  const [iCorpo, setICorpo] = useState(0);
  const [iDifusor, setIDifusor] = useState(0);
  const [cores, setCores] = useState<CoresPartes>({
    base: 0,
    corpo: 0,
    difusor: 1,
  });
  /** Pilha de estruturais entre a base e o corpo (índices, de baixo para cima). */
  const [estruturais, setEstruturais] = useState<number[]>([]);
  const [alvoCor, setAlvoCor] = useState<AlvoCor>("all");
  const [iFaceta, setIFaceta] = useState(0);
  const [luzAcesa, setLuzAcesa] = useState(true);
  const [pontosDeLuz, setPontosDeLuz] = useState<1 | 2>(1);
  const [separacaoMm, setSeparacaoMm] = useState(100);
  const [remixDe, setRemixDe] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState("corpo");
  const [criar, setCriar] = useState<EstadoCriar>({
    base: { ...BASES[0] },
    corpo: { ...CORPOS[0] },
    difusor: { ...DIFUSORES[0] },
  });

  // Carrega a criação do link (?c=...) uma única vez, ao abrir.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("c");
    if (!param) return;
    const c = decodificarCriacao(param);
    if (!c) return;
    /* eslint-disable react-hooks/set-state-in-effect -- sincronização única
       URL→estado na montagem: a URL é o sistema externo aqui, e o estado só
       pode ser lido no cliente (window). */
    setModo(c.modo);
    setIBase(c.iBase);
    setICorpo(c.iCorpo);
    setIDifusor(c.iDifusor);
    setCores(c.cores);
    setEstruturais(c.estruturais);
    setIFaceta(c.iFaceta);
    setLuzAcesa(c.luzAcesa);
    setPontosDeLuz(c.pontosDeLuz);
    setSeparacaoMm(c.separacaoMm);
    setCriar(c.criar);
    setRemixDe(
      c.remixDe || `${CORPOS[c.iCorpo].nome} + ${DIFUSORES[c.iDifusor].nome}`
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Espelha a criação atual na URL — o endereço da página é sempre o link dela.
  useEffect(() => {
    const t = setTimeout(() => {
      const codigo = codificarCriacao({
        v: 1,
        modo,
        iBase,
        iCorpo,
        iDifusor,
        cores,
        estruturais,
        iFaceta,
        luzAcesa,
        pontosDeLuz,
        separacaoMm,
        criar,
        remixDe,
      });
      window.history.replaceState(null, "", `?c=${codigo}`);
    }, 300);
    return () => clearTimeout(t);
  }, [
    modo,
    iBase,
    iCorpo,
    iDifusor,
    cores,
    estruturais,
    iFaceta,
    luzAcesa,
    pontosDeLuz,
    separacaoMm,
    criar,
    remixDe,
  ]);

  const [copiado, setCopiado] = useState(false);
  async function copiarLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function trocarModo(m: Modo) {
    if (m === "criar" && modo !== "criar") {
      setCriar({
        base: { ...BASES[iBase] },
        corpo: { ...CORPOS[iCorpo] },
        difusor: { ...DIFUSORES[iDifusor] },
      });
      setRemixDe(`${CORPOS[iCorpo].nome} + ${DIFUSORES[iDifusor].nome}`);
    }
    setSecaoAtiva("corpo");
    setModo(m);
  }

  function escolherCor(i: number) {
    if (alvoCor === "all") setCores({ base: i, corpo: i, difusor: i });
    else setCores({ ...cores, [alvoCor]: i });
  }

  const base = modo === "montar" ? BASES[iBase] : criar.base;
  const corpo = modo === "montar" ? CORPOS[iCorpo] : criar.corpo;
  const difusor = modo === "montar" ? DIFUSORES[iDifusor] : criar.difusor;

  const texturas = useMemo(
    () => ({
      corpo: {
        gomos: corpo.gomos,
        profundidadeMm: corpo.profundidadeGomosMm,
        torcaoGraus: corpo.torcaoGraus,
        alturaMm: corpo.alturaMm,
        familia: corpo.familiaTextura,
        repeticao: corpo.repeticaoTextura,
      },
      difusor: {
        gomos: difusor.gomos,
        profundidadeMm: difusor.profundidadeGomosMm,
        torcaoGraus: 0,
        alturaMm: difusor.alturaMm,
      },
    }),
    [corpo, difusor]
  );

  // A pilha de estruturais sobe o corpo e o difusor: para a física (CG,
  // alargamento E2) o efeito é o de um corpo mais alto na mesma coluna.
  const pecasEstruturais = useMemo(
    () => estruturais.map((i) => ESTRUTURAIS[i]),
    [estruturais]
  );
  const alturaEstruturaisMm = pecasEstruturais.reduce(
    (s, p) => s + p.alturaMm,
    0
  );
  const corpoParaFisica = useMemo(
    () =>
      alturaEstruturaisMm > 0
        ? { ...corpo, alturaMm: corpo.alturaMm + alturaEstruturaisMm }
        : corpo,
    [corpo, alturaEstruturaisMm]
  );

  const estab = useMemo(
    () => estabilidade(base, corpoParaFisica, difusor, pontosDeLuz),
    [base, corpoParaFisica, difusor, pontosDeLuz]
  );
  const perfis = useMemo(
    () => ({
      base: perfilBase(base, estab.escala, pontosDeLuz === 1),
      corpo: perfilCorpo(corpo),
      difusor: perfilDifusor(difusor),
      estruturais: pecasEstruturais.map((p) => perfilEstrutural(p)),
    }),
    [base, corpo, difusor, estab.escala, pontosDeLuz, pecasEstruturais]
  );
  const { gramas, precoBRL } = useMemo(
    () =>
      estimarPreco(
        perfis.base,
        perfis.corpo,
        perfis.difusor,
        pontosDeLuz,
        perfis.estruturais
      ),
    [perfis, pontosDeLuz]
  );
  // E3: corpo debruçado além do que a base alargada segura pede um inserto
  // de peso na base — item de produção, o STL não muda.
  const contrapesoG = useMemo(
    () => contrapesoNecessarioG(estab, base.raioMm, gramas),
    [estab, base.raioMm, gramas]
  );

  const espinhaCorpo = useMemo(
    () => ({
      deslocamentoMm: corpo.deslocamentoMm,
      posicaoDobra: corpo.posicaoDobra,
      alturaMm: corpo.alturaMm,
    }),
    [corpo]
  );
  const segmentos = modo === "montar" ? 40 : FACETAS[iFaceta].segmentos;
  const expoente = modo === "montar" ? undefined : FACETAS[iFaceta].expoente;

  // As colunas precisam caber sobre a base (pastilha de encaixe inteira) —
  // e numa base facetada/squircle o raio útil cai para o do meio da face.
  const separacaoEfetivaMm = Math.min(
    separacaoMm,
    separacaoMaximaMm(
      base.raioMm,
      estab.escala,
      segmentos <= 16 ? segmentos : 0,
      expoente
    )
  );

  const [gerandoSTL, setGerandoSTL] = useState<string | null>(null);
  async function baixarSTL(parte: ParteAlvo | "estrutural", indice = 0) {
    const chave = parte === "estrutural" ? `estrutural-${indice}` : parte;
    setGerandoSTL(chave);
    try {
      const resp = await fetch("/api/stl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parte,
          indice,
          base,
          corpo,
          difusor,
          estruturais: pecasEstruturais,
          segmentos,
          expoente,
          pontosDeLuz,
          separacaoMm,
        }),
      });
      if (!resp.ok) return;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        parte === "estrutural"
          ? `per-parte-peca-${indice + 1}.stl`
          : `per-parte-${parte}.stl`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGerandoSTL(null);
    }
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[#121110] text-[#F2EDE4]">
      {/* Cena em tela cheia — o palco, com a luminária no centro da órbita */}
      <div className="absolute inset-0">
        <Cena3D
          perfis={perfis}
          alturasMm={{
            base: base.alturaMm,
            corpo: corpo.alturaMm,
            difusor: difusor.alturaMm,
            estruturais: pecasEstruturais.map((p) => p.alturaMm),
          }}
          coresHex={{
            base: PALETA[cores.base].hex,
            corpo: PALETA[cores.corpo].hex,
            difusor: PALETA[cores.difusor].hex,
            estruturais: pecasEstruturais.map(() => PALETA[cores.corpo].hex),
          }}
          segmentos={segmentos}
          expoente={expoente}
          luzAcesa={luzAcesa}
          texturas={texturas}
          espinhaCorpo={espinhaCorpo}
          pontosDeLuz={pontosDeLuz}
          separacaoMm={separacaoEfetivaMm}
          vazadoDifusor={difusor.vazado}
        />
      </div>

      {/* Cabeçalho flutuante */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
        <Link href="/" className="pointer-events-auto block">
          <div className="text-[19px] font-extrabold tracking-[0.16em]">
            PER P
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: "1.1px #F2EDE4",
              }}
            >
              A
            </span>
            RTE
          </div>
          <div className="text-[11px] text-[#A69D8D]">
            monte por partes. crie cada parte.
          </div>
        </Link>
      </header>

      {/* Rodapé informativo da cena */}
      <div className="absolute bottom-5 left-5 z-10 hidden flex-col items-start gap-2 md:flex">
        <div className="vidro rounded-full px-3.5 py-1.5 text-[11px] text-[#A69D8D]">
          encaixes fixos{" "}
          <b className="font-semibold text-[#F2EDE4]">
            Ø{oDiametroCm(ENCAIXES.baseCorpo.raioMm)}
          </b>{" "}
          e{" "}
          <b className="font-semibold text-[#F2EDE4]">
            Ø{oDiametroCm(ENCAIXES.corpoDifusor.raioMm)} cm
          </b>{" "}
          · partes livres
        </div>
        <div className="pl-1 text-[10.5px] text-[#7d766a]">
          arraste para girar · role para aproximar
        </div>
      </div>

      {/* Mobile: cartela deslizante */}
      <aside className="vidro absolute inset-x-3 bottom-3 top-[46dvh] z-10 flex flex-col overflow-hidden rounded-3xl shadow-2xl shadow-black/50 md:hidden">
        <div className="px-4 pb-1 pt-4">
          <div className="mx-auto flex w-full max-w-[280px] rounded-full bg-white/[0.06] p-1">
            {(
              [
                ["montar", "Montar"],
                ["criar", "Criar"],
              ] as const
            ).map(([id, titulo]) => (
              <button
                key={id}
                onClick={() => trocarModo(id)}
                className={`flex-1 rounded-full py-2 text-[13px] transition-all ${
                  modo === id
                    ? "bg-[#F2EDE4] font-semibold text-[#161412]"
                    : "text-[#A69D8D] hover:text-[#E7E0D2]"
                }`}
              >
                {titulo}
              </button>
            ))}
          </div>
        </div>

        <div className="rolagem min-h-0 flex-1 overflow-y-auto">
          {modo === "montar" ? (
            <PainelMontar
              iBase={iBase}
              iCorpo={iCorpo}
              iDifusor={iDifusor}
              escolherBase={setIBase}
              escolherCorpo={setICorpo}
              escolherDifusor={setIDifusor}
              estruturais={estruturais}
              setEstruturais={setEstruturais}
              cores={cores}
              alvoCor={alvoCor}
              setAlvoCor={setAlvoCor}
              escolherCor={escolherCor}
              pontosDeLuz={pontosDeLuz}
              separacaoMm={separacaoMm}
              setPontosDeLuz={setPontosDeLuz}
              setSeparacaoMm={setSeparacaoMm}
            />
          ) : (
            <PainelCriar
              criar={criar}
              aoMudar={setCriar}
              remixDe={remixDe}
              iFaceta={iFaceta}
              setIFaceta={setIFaceta}
              estab={estab}
              contrapesoG={contrapesoG}
              pontosDeLuz={pontosDeLuz}
              separacaoMm={separacaoMm}
              setPontosDeLuz={setPontosDeLuz}
              setSeparacaoMm={setSeparacaoMm}
            />
          )}
        </div>

        <div className="border-t border-white/[0.08] px-5 pb-4 pt-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex-1">
              <div className="font-serif text-[25px] font-medium leading-none tabular-nums">
                R$ {precoBRL.toLocaleString("pt-BR")}
              </div>
              <div className="mt-1 text-[10px] text-[#7d766a]">
                ~{Math.round(gramas)} g de PLA · módulo elétrico certificado
              </div>
            </div>
            <button
              onClick={() => setLuzAcesa(!luzAcesa)}
              className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] transition-all ${
                luzAcesa
                  ? "bg-[#D3AC6C] font-semibold text-[#1b1206]"
                  : "border border-white/15 bg-white/[0.05] text-[#CFC7B8]"
              }`}
            >
              {luzAcesa ? "luz acesa" : "luz apagada"}
            </button>
            <button className="rounded-full bg-[#F2EDE4] px-5 py-2.5 text-[13px] font-semibold text-[#161412] transition-colors hover:bg-white">
              Encomendar
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-[#7d766a]">
            <span>STL:</span>
            {(["base", "corpo", "difusor"] as const).map((p) => {
              const travadoPorVazado = p === "difusor" && !!difusor.vazado;
              return (
                <button
                  key={p}
                  onClick={() => baixarSTL(p)}
                  disabled={gerandoSTL !== null || travadoPorVazado}
                  title={
                    travadoPorVazado
                      ? "difusor vazado: preview pronto, produção em preparação — tire o vazado para gerar o STL"
                      : undefined
                  }
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2] disabled:opacity-40"
                >
                  {gerandoSTL === p ? "gerando…" : travadoPorVazado ? "difusor ⚑" : p}
                </button>
              );
            })}
            {pecasEstruturais.map((p, k) => (
              <button
                key={`estrutural-${k}`}
                onClick={() => baixarSTL("estrutural", k)}
                disabled={gerandoSTL !== null}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2] disabled:opacity-40"
              >
                {gerandoSTL === `estrutural-${k}`
                  ? "gerando…"
                  : p.nome.toLowerCase()}
              </button>
            ))}
            <span className="ml-1.5">kit F5:</span>
            {[0.2, 0.3, 0.4].map((f) => (
              <a
                key={f}
                href={`/api/calibracao?folgaMm=${f}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2]"
              >
                {String(f).replace(".", ",")}
              </a>
            ))}
            <span className="ml-auto">
              <BotaoSalvar />
            </span>
            <button
              onClick={copiarLink}
              className={`rounded-full border px-2.5 py-1 transition-colors ${
                copiado
                  ? "border-[#8FB07E]/40 text-[#8FB07E]"
                  : "border-white/10 bg-white/[0.04] text-[#A69D8D] hover:border-white/25 hover:text-[#E7E0D2]"
              }`}
            >
              {copiado ? "link copiado ✓" : "copiar link"}
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop: órbita em volta da luminária */}
      <div className="hidden md:block">
        {/* Abas */}
        <div className="vidro absolute left-1/2 top-5 z-20 flex w-[280px] -translate-x-1/2 rounded-full p-1">
          {(
            [
              ["montar", "Montar"],
              ["criar", "Criar"],
            ] as const
          ).map(([id, titulo]) => (
            <button
              key={id}
              onClick={() => trocarModo(id)}
              className={`flex-1 rounded-full py-2 text-[13px] transition-all ${
                modo === id
                  ? "bg-[#F2EDE4] font-semibold text-[#161412]"
                  : "text-[#A69D8D] hover:text-[#E7E0D2]"
              }`}
            >
              {titulo}
            </button>
          ))}
        </div>

        {/* Arco de seções */}
        {(modo === "montar" ? SECOES_MONTAR : SECOES_CRIAR).map((s, i, arr) => {
          const n = arr.length;
          const max = n <= 6 ? 52 : 76;
          const phi = ((-max + (i * 2 * max) / (n - 1)) * Math.PI) / 180;
          const cos = Math.cos(phi).toFixed(4);
          const sin = Math.sin(phi).toFixed(4);
          return (
            <button
              key={s.id}
              onClick={() => setSecaoAtiva(s.id)}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-3.5 py-2 text-[12px] transition-all ${
                secaoAtiva === s.id
                  ? "bg-[#F2EDE4] font-semibold text-[#161412] shadow-lg shadow-black/40"
                  : "vidro text-[#CFC7B8] hover:scale-105 hover:text-[#F2EDE4]"
              }`}
              style={{
                left: `calc(50% + ${cos} * min(34vh, 23vw))`,
                top: `calc(47% + ${sin} * min(34vh, 23vw))`,
              }}
            >
              {s.rotulo}
            </button>
          );
        })}

        {/* Cartão da seção ativa */}
        <div className="vidro rolagem absolute left-6 top-1/2 z-20 max-h-[calc(100dvh-190px)] w-[400px] -translate-y-1/2 overflow-y-auto rounded-3xl pb-2 pt-1 shadow-2xl shadow-black/50 xl:w-[440px]">
          {modo === "montar" ? (
            <PainelMontar
              iBase={iBase}
              iCorpo={iCorpo}
              iDifusor={iDifusor}
              escolherBase={setIBase}
              escolherCorpo={setICorpo}
              escolherDifusor={setIDifusor}
              estruturais={estruturais}
              setEstruturais={setEstruturais}
              cores={cores}
              alvoCor={alvoCor}
              setAlvoCor={setAlvoCor}
              escolherCor={escolherCor}
              pontosDeLuz={pontosDeLuz}
              separacaoMm={separacaoMm}
              setPontosDeLuz={setPontosDeLuz}
              setSeparacaoMm={setSeparacaoMm}
              apenasSecao={secaoAtiva}
            />
          ) : (
            <PainelCriar
              criar={criar}
              aoMudar={setCriar}
              remixDe={remixDe}
              iFaceta={iFaceta}
              setIFaceta={setIFaceta}
              estab={estab}
              contrapesoG={contrapesoG}
              pontosDeLuz={pontosDeLuz}
              separacaoMm={separacaoMm}
              setPontosDeLuz={setPontosDeLuz}
              setSeparacaoMm={setSeparacaoMm}
              apenasSecao={secaoAtiva}
            />
          )}
        </div>

        {/* Barra inferior central */}
        <div className="vidro absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-3xl px-6 py-3 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3">
            <div className="pr-2">
              <div className="font-serif text-[22px] font-medium leading-none tabular-nums">
                R$ {precoBRL.toLocaleString("pt-BR")}
              </div>
              <div className="mt-1 whitespace-nowrap text-[10px] text-[#7d766a]">
                ~{Math.round(gramas)} g de PLA · módulo elétrico certificado
              </div>
            </div>
            <button
              onClick={() => setLuzAcesa(!luzAcesa)}
              className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] transition-all ${
                luzAcesa
                  ? "bg-[#D3AC6C] font-semibold text-[#1b1206]"
                  : "border border-white/15 bg-white/[0.05] text-[#CFC7B8]"
              }`}
            >
              {luzAcesa ? "luz acesa" : "luz apagada"}
            </button>
            <button className="rounded-full bg-[#F2EDE4] px-5 py-2.5 text-[13px] font-semibold text-[#161412] transition-colors hover:bg-white">
              Encomendar
            </button>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-[#7d766a]">
            <span>STL:</span>
            {(["base", "corpo", "difusor"] as const).map((p) => {
              const travadoPorVazado = p === "difusor" && !!difusor.vazado;
              return (
                <button
                  key={p}
                  onClick={() => baixarSTL(p)}
                  disabled={gerandoSTL !== null || travadoPorVazado}
                  title={
                    travadoPorVazado
                      ? "difusor vazado: preview pronto, produção em preparação — tire o vazado para gerar o STL"
                      : undefined
                  }
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2] disabled:opacity-40"
                >
                  {gerandoSTL === p ? "gerando…" : travadoPorVazado ? "difusor ⚑" : p}
                </button>
              );
            })}
            {pecasEstruturais.map((p, k) => (
              <button
                key={`estrutural-${k}`}
                onClick={() => baixarSTL("estrutural", k)}
                disabled={gerandoSTL !== null}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2] disabled:opacity-40"
              >
                {gerandoSTL === `estrutural-${k}`
                  ? "gerando…"
                  : p.nome.toLowerCase()}
              </button>
            ))}
            <span className="ml-1.5">kit F5:</span>
            {[0.2, 0.3, 0.4].map((f) => (
              <a
                key={f}
                href={`/api/calibracao?folgaMm=${f}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2]"
              >
                {String(f).replace(".", ",")}
              </a>
            ))}
            <span className="ml-1.5">
              <BotaoSalvar />
            </span>
            <button
              onClick={copiarLink}
              className={`ml-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                copiado
                  ? "border-[#8FB07E]/40 text-[#8FB07E]"
                  : "border-white/10 bg-white/[0.04] text-[#A69D8D] hover:border-white/25 hover:text-[#E7E0D2]"
              }`}
            >
              {copiado ? "link copiado ✓" : "copiar link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
