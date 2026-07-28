"use client";

import { BASES, CORPOS, DIFUSORES, LIMITES_CRIAR, PALETA } from "@per-parte/nucleo";
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
