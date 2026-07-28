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
}: Props) {
  const corSelecionada = alvoCor === "all" ? cores.corpo : cores[alvoCor];

  return (
    <div>
      <Secao titulo="Base">
        <Chips
          nomes={BASES.map((b) => b.nome)}
          selecionado={iBase}
          aoEscolher={escolherBase}
        />
      </Secao>
      <Secao titulo="Corpo">
        <Chips
          nomes={CORPOS.map((c) => c.nome)}
          selecionado={iCorpo}
          aoEscolher={escolherCorpo}
        />
      </Secao>
      <Secao titulo="Difusor">
        <Chips
          nomes={DIFUSORES.map((d) => d.nome)}
          selecionado={iDifusor}
          aoEscolher={escolherDifusor}
        />
      </Secao>

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

      <Secao titulo="Cor — aplicar em">
        <div className="mb-2.5 flex gap-2">
          {ALVOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlvoCor(a.id)}
              className={`flex-1 rounded-lg border py-1.5 text-[11.5px] ${
                alvoCor === a.id
                  ? "border-[#26241F] font-semibold text-[#26241F]"
                  : "border-[#DDD8CC] bg-white text-[#6E695E]"
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
              className={`h-[26px] w-[26px] rounded-full border-2 border-white ${
                corSelecionada === i
                  ? "outline outline-2 outline-[#26241F]"
                  : "outline outline-1 outline-[#DDD8CC]"
              }`}
              style={{ background: p.hex }}
            />
          ))}
        </div>
      </Secao>

      <Secao titulo="Regras embutidas">
        <div className="rounded-xl border border-[#DDD8CC] bg-white px-3.5 py-3">
          <div className="flex justify-between py-1 text-xs text-[#6E695E]">
            <span>Compatibilidade das partes</span>
            <span className="font-semibold text-[#5F7A52]">garantida ✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#6E695E]">
            <span>Módulo elétrico certificado</span>
            <span className="font-semibold text-[#5F7A52]">incluído ✓</span>
          </div>
          <div className="mt-2 text-[10.5px] text-[#6E695E] opacity-80">
            No modo Montar não existe combinação inválida — os encaixes são
            padronizados por projeto.
          </div>
        </div>
      </Secao>
    </div>
  );
}
