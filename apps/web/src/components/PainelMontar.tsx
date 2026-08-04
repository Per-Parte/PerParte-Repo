"use client";

import {
  BASES,
  CORPOS,
  DIFUSORES,
  ESTRUTURAIS,
  LIMITES_CRIAR,
  MAX_ESTRUTURAIS,
  PALETA,
} from "@per-parte/nucleo";
import { Chips, PontosDeLuzCtl, Secao } from "./controles";
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
  /** Quando presente, renderiza só a seção pedida (modo órbita). */
  apenasSecao?: string;
}

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
  apenasSecao,
}: Props) {
  const corSelecionada = alvoCor === "all" ? cores.corpo : cores[alvoCor];
  const vis = (id: string) => !apenasSecao || apenasSecao === id;

  return (
    <div>
      {vis("base") && (
      <Secao titulo="Base">
        <Chips
          nomes={BASES.map((b) => b.nome)}
          selecionado={iBase}
          aoEscolher={escolherBase}
        />
      </Secao>
      )}
      {vis("pilha") && (
      <Secao titulo="Empilhar — a luminária cresce por peças">
        {/* A pilha, de cima para baixo: difusor / corpo / estruturais / base. */}
        <div className="mb-3 space-y-1.5">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[11.5px] text-[#7d766a]">
            difusor · <b className="text-[#A69D8D]">{DIFUSORES[iDifusor].nome}</b>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[11.5px] text-[#7d766a]">
            corpo · <b className="text-[#A69D8D]">{CORPOS[iCorpo].nome}</b>
          </div>
          {[...estruturais].reverse().map((ie, kInv) => {
            const k = estruturais.length - 1 - kInv;
            return (
              <div
                key={`slot-${k}`}
                className="rounded-xl border border-[#D3AC6C]/25 bg-[#D3AC6C]/[0.05] px-3.5 py-2.5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#A69D8D]">
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
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#A69D8D] transition-colors hover:border-[#E06A55]/50 hover:text-[#E06A55]"
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
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[11.5px] text-[#7d766a]">
            base · <b className="text-[#A69D8D]">{BASES[iBase].nome}</b>
          </div>
        </div>
        {estruturais.length < MAX_ESTRUTURAIS ? (
          <button
            onClick={() => setEstruturais([...estruturais, 0])}
            className="w-full rounded-full border border-dashed border-white/20 py-2.5 text-[12.5px] text-[#A69D8D] transition-colors hover:border-[#D3AC6C]/60 hover:text-[#D3AC6C]"
          >
            + somar uma peça entre a base e o corpo
          </button>
        ) : (
          <div className="text-center text-[10.5px] text-[#7d766a]">
            pilha cheia — até {MAX_ESTRUTURAIS} peças entre a base e o corpo
          </div>
        )}
        <div className="mt-2.5 text-[10px] leading-relaxed text-[#7d766a]">
          Os encaixes são os mesmos em toda peça (F5): tudo monta em tudo, em
          qualquer ordem. É assim que uma luminária de meio metro sai de uma
          impressora comum — em impressões separadas.
        </div>
      </Secao>
      )}

      {vis("corpo") && (
      <Secao titulo="Corpo">
        <Chips
          nomes={CORPOS.map((c) => c.nome)}
          selecionado={iCorpo}
          aoEscolher={escolherCorpo}
        />
      </Secao>
      )}
      {vis("difusor") && (
      <Secao titulo="Difusor">
        <Chips
          nomes={DIFUSORES.map((d) => d.nome)}
          selecionado={iDifusor}
          aoEscolher={escolherDifusor}
        />
      </Secao>
      )}

      {vis("luzes") && (
      <Secao titulo="Pontos de luz">
        <PontosDeLuzCtl
          pontosDeLuz={pontosDeLuz}
          separacaoMm={separacaoMm}
          sepMin={LIMITES_CRIAR.luminaria.separacaoMm.min}
          sepMax={LIMITES_CRIAR.luminaria.separacaoMm.max}
          sepPasso={LIMITES_CRIAR.luminaria.separacaoMm.passo}
          aoMudarPontos={setPontosDeLuz}
          aoMudarSep={setSeparacaoMm}
        />
      </Secao>
      )}

      {vis("cor") && (
      <Secao titulo="Cor — aplicar em">
        <div className="mb-3 flex gap-1.5">
          {ALVOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlvoCor(a.id)}
              className={`flex-1 rounded-full py-1.5 text-[11.5px] transition-all ${
                alvoCor === a.id
                  ? "bg-white/[0.12] font-semibold text-[#F2EDE4]"
                  : "border border-white/10 bg-white/[0.03] text-[#A69D8D] hover:border-white/25"
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {PALETA.map((p, i) => (
            <button
              key={p.nome}
              title={p.nome}
              onClick={() => escolherCor(i)}
              className={`h-[30px] w-[30px] rounded-full transition-transform hover:scale-110 ${
                corSelecionada === i
                  ? "ring-2 ring-[#F2EDE4] ring-offset-2 ring-offset-[#1a1815]"
                  : "ring-1 ring-white/20"
              }`}
              style={{ background: p.hex }}
            />
          ))}
        </div>
      </Secao>
      )}

      {vis("regras") && (
      <Secao titulo="Regras embutidas">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <div className="flex justify-between py-1 text-xs text-[#A69D8D]">
            <span>Compatibilidade das partes</span>
            <span className="font-semibold text-[#8FB07E]">garantida ✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#A69D8D]">
            <span>Módulo elétrico certificado</span>
            <span className="font-semibold text-[#8FB07E]">incluído ✓</span>
          </div>
          <div className="mt-2 text-[10px] text-[#7d766a]">
            No modo Montar não existe combinação inválida — os encaixes são
            padronizados por projeto.
          </div>
        </div>
      </Secao>
      )}
    </div>
  );
}
