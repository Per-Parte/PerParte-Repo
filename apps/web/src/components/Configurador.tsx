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
  const [remixDe, setRemixDe] = useState("");
  const [criar, setCriar] = useState<EstadoCriar>({
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
        criar,
        remixDe,
      });
      window.history.replaceState(null, "", `?c=${codigo}`);
    }, 300);
    return () => clearTimeout(t);
  }, [modo, iBase, iCorpo, iDifusor, cores, iFaceta, luzAcesa, criar, remixDe]);

  const [copiado, setCopiado] = useState(false);
  async function copiarLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function trocarModo(m: Modo) {
    if (m === "criar" && modo !== "criar") {
      setCriar({
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

  const base = BASES[iBase];
  const corpo = modo === "montar" ? CORPOS[iCorpo] : criar.corpo;
  const difusor = modo === "montar" ? DIFUSORES[iDifusor] : criar.difusor;

  const estab = useMemo(
    () => estabilidade(base, corpo, difusor),
    [base, corpo, difusor]
  );
  const perfis = useMemo(
    () => ({
      base: perfilBase(base, estab.escala),
      corpo: perfilCorpo(corpo),
      difusor: perfilDifusor(difusor),
    }),
    [base, corpo, difusor, estab.escala]
  );
  const { gramas, precoBRL } = useMemo(
    () => estimarPreco(perfis.base, perfis.corpo, perfis.difusor),
    [perfis]
  );

  const segmentos = modo === "montar" ? 40 : FACETAS[iFaceta].segmentos;

  const [gerandoSTL, setGerandoSTL] = useState<ParteAlvo | null>(null);
  async function baixarSTL(parte: ParteAlvo) {
    setGerandoSTL(parte);
    try {
      const resp = await fetch("/api/stl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parte, iBase, corpo, difusor, segmentos }),
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
    <div className="flex h-dvh flex-col bg-[#F2EFE9] text-[#26241F]">
      <header className="flex items-baseline justify-between border-b border-[#DDD8CC] px-7 pb-3.5 pt-4">
        <div>
          <div className="text-[22px] font-extrabold tracking-[0.14em]">
            PER P
            <span
              style={{ color: "transparent", WebkitTextStroke: "1.2px #26241F" }}
            >
              A
            </span>
            RTE
          </div>
          <div className="text-[12.5px] text-[#6E695E]">
            monte por partes. crie cada parte.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copiarLink}
            className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
              copiado
                ? "border-[#5F7A52] text-[#5F7A52]"
                : "border-[#DDD8CC] text-[#6E695E] hover:border-[#6E695E]"
            }`}
          >
            {copiado ? "link copiado ✓" : "copiar link da criação"}
          </button>
          <div className="rounded-full border border-[#DDD8CC] px-2.5 py-1 text-[11px] text-[#6E695E]">
            configurador v0.2
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative h-[44vh] min-w-0 md:h-auto md:flex-[1.25]">
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
          />
          <div className="absolute left-6 top-4 rounded-lg border border-[#DDD8CC] bg-[#FBFAF7]/80 px-2.5 py-1.5 text-[11.5px] text-[#6E695E]">
            encaixes fixos{" "}
            <b className="font-semibold text-[#26241F]">
              Ø{oDiametroCm(ENCAIXES.baseCorpo.raioMm)}
            </b>{" "}
            e{" "}
            <b className="font-semibold text-[#26241F]">
              Ø{oDiametroCm(ENCAIXES.corpoDifusor.raioMm)} cm
            </b>{" "}
            · partes livres
          </div>
          <div className="absolute bottom-4 left-6 text-[11.5px] text-[#6E695E]">
            arraste para girar
          </div>
        </div>

        <aside className="flex min-h-0 w-full flex-1 flex-col border-t border-[#DDD8CC] bg-[#FBFAF7] md:w-[390px] md:max-w-[44vw] md:flex-none md:border-l md:border-t-0">
          <div className="flex border-b border-[#DDD8CC]">
            {(
              [
                ["montar", "Montar", "combine partes prontas"],
                ["criar", "Criar", "esculpa a sua parte"],
              ] as const
            ).map(([id, titulo, sub]) => (
              <button
                key={id}
                onClick={() => trocarModo(id)}
                className={`flex-1 border-b-2 pb-3 pt-3.5 text-center text-[13.5px] ${
                  modo === id
                    ? "border-[#26241F] font-semibold text-[#26241F]"
                    : "border-transparent text-[#6E695E]"
                }`}
              >
                {titulo}
                <small className="block text-[10.5px] font-normal tracking-[0.03em]">
                  {sub}
                </small>
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
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
              />
            ) : (
              <PainelCriar
                criar={criar}
                aoMudar={setCriar}
                remixDe={remixDe}
                iFaceta={iFaceta}
                setIFaceta={setIFaceta}
                estab={estab}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#DDD8CC] px-5 py-2 text-[11px] text-[#6E695E]">
            <span>STL de produção (teste):</span>
            {(["base", "corpo", "difusor"] as const).map((p) => (
              <button
                key={p}
                onClick={() => baixarSTL(p)}
                disabled={gerandoSTL !== null}
                className="rounded-md border border-[#DDD8CC] bg-white px-2 py-1 hover:border-[#6E695E] disabled:opacity-50"
              >
                {gerandoSTL === p ? "gerando…" : p}
              </button>
            ))}
            <span className="ml-1">· kit de encaixe F5:</span>
            {[0.2, 0.3, 0.4].map((f) => (
              <a
                key={f}
                href={`/api/calibracao?folgaMm=${f}`}
                className="rounded-md border border-[#DDD8CC] bg-white px-2 py-1 hover:border-[#6E695E]"
              >
                {String(f).replace(".", ",")}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3.5 border-t border-[#DDD8CC] bg-[#FBFAF7] px-5 py-3.5">
            <div className="flex-1">
              <div className="text-xl font-bold tabular-nums">
                R$ {precoBRL.toLocaleString("pt-BR")}
              </div>
              <div className="text-[10.5px] text-[#6E695E]">
                ~{Math.round(gramas)} g de PLA · inclui módulo elétrico
                certificado
              </div>
            </div>
            <button
              onClick={() => setLuzAcesa(!luzAcesa)}
              className={`whitespace-nowrap rounded-[10px] border px-3.5 py-2.5 text-[12.5px] ${
                luzAcesa
                  ? "border-[#F3B65B] bg-[#F3B65B]"
                  : "border-[#DDD8CC] bg-white"
              }`}
            >
              {luzAcesa ? "luz acesa" : "luz apagada"}
            </button>
            <button className="rounded-[10px] bg-[#26241F] px-5 py-3 text-[13.5px] font-semibold text-white hover:bg-black">
              Encomendar
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
