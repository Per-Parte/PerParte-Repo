"use client";

import {
  BASES,
  CORPOS,
  DIFUSORES,
  ESTRUTURAIS,
  LIMITES_CRIAR,
  MAX_ESTRUTURAIS,
  type ParametrosPlaca,
} from "@per-parte/nucleo";
import {
  Chips,
  PaletaFamilias,
  PontosDeLuzCtl,
  Secao,
  SubRotulo,
} from "./controles";
import type { AlvoCor, CoresPartes } from "./Configurador";

const ALVOS: { id: AlvoCor; rotulo: string }[] = [
  { id: "all", rotulo: "tudo" },
  { id: "base", rotulo: "base" },
  { id: "corpo", rotulo: "corpo" },
  { id: "difusor", rotulo: "difusor" },
];

interface Props {
  iBase: number;
  iCorpo: number;
  iDifusor: number;
  escolherBase: (i: number) => void;
  escolherCorpo: (i: number) => void;
  escolherDifusor: (i: number) => void;
  /** Pilha de estruturais entre a base e o corpo (índices, de baixo para cima). */
  estruturais: number[];
  setEstruturais: (e: number[]) => void;
  cores: CoresPartes;
  alvoCor: AlvoCor;
  setAlvoCor: (a: AlvoCor) => void;
  escolherCor: (i: number) => void;
  pontosDeLuz: number;
  separacaoMm: number;
  setPontosDeLuz: (n: 1 | 2) => void;
  setSeparacaoMm: (v: number) => void;
  placa: ParametrosPlaca | null;
  setPlaca: (p: ParametrosPlaca | null) => void;
  luzAcesa: boolean;
  setLuzAcesa: (v: boolean) => void;
}

/** Painel do modo Montar — seções colapsáveis num único scroll (§4.2). */
export default function PainelMontar({
  iBase,
  iCorpo,
  iDifusor,
  escolherBase,
  escolherCorpo,
  escolherDifusor,
  estruturais,
  setEstruturais,
  cores,
  alvoCor,
  setAlvoCor,
  escolherCor,
  pontosDeLuz,
  separacaoMm,
  setPontosDeLuz,
  setSeparacaoMm,
  placa,
  setPlaca,
  luzAcesa,
  setLuzAcesa,
}: Props) {
  const corSelecionada = alvoCor === "all" ? cores.corpo : cores[alvoCor];

  return (
    <div>
      <Secao id="base" titulo="Base">
        <Chips
          nomes={BASES.map((b) => b.nome)}
          selecionado={iBase}
          aoEscolher={escolherBase}
        />
      </Secao>

      <Secao id="corpo" titulo="Corpo">
        <Chips
          nomes={CORPOS.map((c) => c.nome)}
          selecionado={iCorpo}
          aoEscolher={escolherCorpo}
        />

        <SubRotulo>Empilhar — a luminária cresce por peças</SubRotulo>
        {/* A pilha, de cima para baixo: difusor / corpo / estruturais / base. */}
        <div className="mb-3 space-y-1.5">
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-2 text-[11.5px] text-[#97907F]">
            difusor · <b className="text-[#4A463D]">{DIFUSORES[iDifusor].nome}</b>
          </div>
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-2 text-[11.5px] text-[#97907F]">
            corpo · <b className="text-[#4A463D]">{CORPOS[iCorpo].nome}</b>
          </div>
          {[...estruturais].reverse().map((ie, kInv) => {
            const k = estruturais.length - 1 - kInv;
            return (
              <div
                key={`slot-${k}`}
                className="rounded-xl border border-acento/40 bg-acento/[0.06] px-3.5 py-2.5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#6D675C]">
                    {ESTRUTURAIS[ie].tipo === "anel" ? "anel" : "haste"} ·{" "}
                    {(ESTRUTURAIS[ie].alturaMm / 10)
                      .toFixed(1)
                      .replace(".", ",")}{" "}
                    cm
                  </span>
                  <button
                    onClick={() =>
                      setEstruturais(estruturais.filter((_, j) => j !== k))
                    }
                    className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] text-[#6D675C] transition-colors hover:border-[#B23B28]/50 hover:text-[#B23B28]"
                  >
                    remover
                  </button>
                </div>
                <Chips
                  nomes={ESTRUTURAIS.map((e) => e.nome)}
                  selecionado={ie}
                  aoEscolher={(i) =>
                    setEstruturais(estruturais.map((v, j) => (j === k ? i : v)))
                  }
                />
              </div>
            );
          })}
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-2 text-[11.5px] text-[#97907F]">
            base · <b className="text-[#4A463D]">{BASES[iBase].nome}</b>
          </div>
        </div>
        {estruturais.length < MAX_ESTRUTURAIS ? (
          <button
            onClick={() => setEstruturais([...estruturais, 0])}
            className="w-full rounded-full border border-dashed border-black/20 py-2.5 text-[12.5px] text-[#6D675C] transition-colors hover:border-acento hover:text-[#8A5F10]"
          >
            + somar uma peça entre a base e o corpo
          </button>
        ) : (
          <div className="text-center text-[10.5px] text-[#97907F]">
            pilha cheia — até {MAX_ESTRUTURAIS} peças entre a base e o corpo
          </div>
        )}
        <div className="mt-2.5 text-[10px] leading-relaxed text-[#97907F]">
          Os encaixes são os mesmos em toda peça (F5): tudo monta em tudo, em
          qualquer ordem. É assim que uma luminária de meio metro sai de uma
          impressora comum — em impressões separadas.
        </div>
      </Secao>

      <Secao id="difusor" titulo="Difusor">
        <Chips
          nomes={DIFUSORES.map((d) => d.nome)}
          selecionado={iDifusor}
          aoEscolher={escolherDifusor}
        />
      </Secao>

      <Secao id="cor" titulo="Cor & acabamento">
        <div className="mb-3 flex gap-1.5">
          {ALVOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlvoCor(a.id)}
              className={`flex-1 rounded-full py-1.5 text-[11.5px] transition-all ${
                alvoCor === a.id
                  ? "bg-palco-escuro font-semibold text-luz-acesa"
                  : "border border-black/10 bg-black/[0.02] text-[#4A463D] hover:border-black/30"
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <PaletaFamilias selecionado={corSelecionada} aoEscolher={escolherCor} />
        {/* Facetas/squircle são um controle do modo Inventar — aqui as peças
            do catálogo já vêm com o acabamento delas. */}
      </Secao>

      <Secao id="luz" titulo="Luz">
        <PontosDeLuzCtl
          pontosDeLuz={pontosDeLuz}
          separacaoMm={separacaoMm}
          sepMin={LIMITES_CRIAR.luminaria.separacaoMm.min}
          sepMax={LIMITES_CRIAR.luminaria.separacaoMm.max}
          sepPasso={LIMITES_CRIAR.luminaria.separacaoMm.passo}
          aoMudarPontos={setPontosDeLuz}
          aoMudarSep={setSeparacaoMm}
          placa={placa}
          aoMudarPlaca={setPlaca}
        />
        <SubRotulo>Luz acesa</SubRotulo>
        <Chips
          nomes={["Acesa", "Apagada"]}
          selecionado={luzAcesa ? 0 : 1}
          aoEscolher={(i) => setLuzAcesa(i === 0)}
        />
      </Secao>

      <Secao id="regras" titulo="Regras">
        <div className="rounded-2xl border border-black/[0.08] bg-black/[0.02] px-4 py-3">
          <div className="flex justify-between py-1 text-xs text-[#4A463D]">
            <span>Compatibilidade das partes</span>
            <span className="font-semibold text-[#4F7A44]">garantida ✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#4A463D]">
            <span>Módulo elétrico certificado</span>
            <span className="font-semibold text-[#4F7A44]">incluído ✓</span>
          </div>
          <div className="mt-2 text-[10px] text-[#97907F]">
            No modo Montar não existe combinação inválida — os encaixes são
            padronizados por projeto.
          </div>
        </div>
      </Secao>
    </div>
  );
}
