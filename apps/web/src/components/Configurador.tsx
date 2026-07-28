"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BASES,
  CORPOS,
  DIFUSORES,
  ENCAIXES,
  FACETAS,
  PALETA,
  estabilidade,
  estimarPreco,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  type ParametrosBase,
  type ParametrosCorpo,
  type ParametrosDifusor,
} from "@per-parte/nucleo";
import Cena3D from "./Cena3D";
import PainelMontar from "./PainelMontar";
import PainelCriar from "./PainelCriar";
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
  const [alvoCor, setAlvoCor] = useState<AlvoCor>("all");
  const [iFaceta, setIFaceta] = useState(0);
  const [luzAcesa, setLuzAcesa] = useState(true);
  const [pontosDeLuz, setPontosDeLuz] = useState<1 | 2>(1);
  const [separacaoMm, setSeparacaoMm] = useState(100);
  const [remixDe, setRemixDe] = useState("");
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
    setModo(c.modo);
    setIBase(c.iBase);
    setICorpo(c.iCorpo);
    setIDifusor(c.iDifusor);
    setCores(c.cores);
    setIFaceta(c.iFaceta);
    setLuzAcesa(c.luzAcesa);
    setPontosDeLuz(c.pontosDeLuz);
    setSeparacaoMm(c.separacaoMm);
    setCriar(c.criar);
    setRemixDe(
      c.remixDe || `${CORPOS[c.iCorpo].nome} + ${DIFUSORES[c.iDifusor].nome}`
    );
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

  const estab = useMemo(
    () => estabilidade(base, corpo, difusor, pontosDeLuz),
    [base, corpo, difusor, pontosDeLuz]
  );
  const perfis = useMemo(
    () => ({
      base: perfilBase(base, estab.escala, pontosDeLuz === 1),
      corpo: perfilCorpo(corpo),
      difusor: perfilDifusor(difusor),
    }),
    [base, corpo, difusor, estab.escala, pontosDeLuz]
  );
  const { gramas, precoBRL } = useMemo(
    () => estimarPreco(perfis.base, perfis.corpo, perfis.difusor, pontosDeLuz),
    [perfis, pontosDeLuz]
  );

  const espinhaCorpo = useMemo(
    () => ({
      deslocamentoMm: corpo.deslocamentoMm,
      posicaoDobra: corpo.posicaoDobra,
      alturaMm: corpo.alturaMm,
    }),
    [corpo]
  );
  // As colunas precisam caber sobre a base (pastilha de encaixe inteira).
  const separacaoEfetivaMm = Math.min(
    separacaoMm,
    Math.max(70, 2 * (base.raioMm * estab.escala - 34))
  );

  const segmentos = modo === "montar" ? 40 : FACETAS[iFaceta].segmentos;

  const [gerandoSTL, setGerandoSTL] = useState<ParteAlvo | null>(null);
  async function baixarSTL(parte: ParteAlvo) {
    setGerandoSTL(parte);
    try {
      const resp = await fetch("/api/stl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parte,
          base,
          corpo,
          difusor,
          segmentos,
          pontosDeLuz,
          separacaoMm,
        }),
      });
      if (!resp.ok) return;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `per-parte-${parte}.stl`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGerandoSTL(null);
    }
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[#121110] text-[#F2EDE4]">
      {/* Cena em tela cheia — o palco */}
      <div className="absolute inset-0">
        <Cena3D
          perfis={perfis}
          alturasMm={{
            base: base.alturaMm,
            corpo: corpo.alturaMm,
            difusor: difusor.alturaMm,
          }}
          coresHex={{
            base: PALETA[cores.base].hex,
            corpo: PALETA[cores.corpo].hex,
            difusor: PALETA[cores.difusor].hex,
          }}
          segmentos={segmentos}
          luzAcesa={luzAcesa}
          texturas={texturas}
          espinhaCorpo={espinhaCorpo}
          pontosDeLuz={pontosDeLuz}
          separacaoMm={separacaoEfetivaMm}
        />
      </div>

      {/* Cabeçalho flutuante */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
        <a href="/" className="pointer-events-auto block">
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
        </a>
        <button
          onClick={copiarLink}
          className={`vidro pointer-events-auto rounded-full px-4 py-2 text-[11.5px] transition-colors ${
            copiado ? "text-[#8FB07E]" : "text-[#CFC7B8] hover:text-[#F2EDE4]"
          }`}
        >
          {copiado ? "link copiado ✓" : "copiar link da criação"}
        </button>
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

      {/* Painel flutuante */}
      <aside className="vidro absolute inset-x-3 bottom-3 top-[46dvh] z-10 flex flex-col overflow-hidden rounded-3xl shadow-2xl shadow-black/40 md:inset-x-auto md:bottom-5 md:right-5 md:top-[76px] md:w-[420px]">
        <div className="px-4 pb-1 pt-4">
          <div className="flex rounded-full bg-white/[0.06] p-1">
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
              <div className="text-[22px] font-bold leading-none tabular-nums">
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
                  ? "bg-[#F3B65B] font-semibold text-[#1b1206]"
                  : "border border-white/15 bg-white/[0.05] text-[#CFC7B8]"
              }`}
            >
              {luzAcesa ? "luz acesa" : "luz apagada"}
            </button>
            <button className="rounded-full bg-[#D9772F] px-5 py-2.5 text-[13px] font-semibold text-[#1b0f05] transition-colors hover:bg-[#E8873E]">
              Encomendar
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-[#7d766a]">
            <span>STL:</span>
            {(["base", "corpo", "difusor"] as const).map((p) => (
              <button
                key={p}
                onClick={() => baixarSTL(p)}
                disabled={gerandoSTL !== null}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2] disabled:opacity-40"
              >
                {gerandoSTL === p ? "gerando…" : p}
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
          </div>
        </div>
      </aside>
    </div>
  );
}
