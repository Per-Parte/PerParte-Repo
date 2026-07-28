"use client";

import { useState } from "react";
import {
  DIFUSORES,
  FACETAS,
  LIMITES_CRIAR,
  REGRAS,
  type ResultadoEstabilidade,
} from "@per-parte/nucleo";
import { Chips, Secao, SliderCtl } from "./controles";
import type { EstadoCriar } from "./Configurador";

const cm = (mm: number) => (mm / 10).toFixed(1).replace(".", ",");
const fmtPos = (v: number) => (v < -0.15 ? "baixo" : v > 0.15 ? "alto" : "centro");

interface Props {
  criar: EstadoCriar;
  aoMudar: (c: EstadoCriar) => void;
  remixDe: string;
  iFaceta: number;
  setIFaceta: (i: number) => void;
  estab: ResultadoEstabilidade;
}

export default function PainelCriar({
  criar,
  aoMudar,
  remixDe,
  iFaceta,
  setIFaceta,
  estab,
}: Props) {
  const [nomePeca, setNomePeca] = useState("");
  const [publicada, setPublicada] = useState<string | null>(null);

  const LC = LIMITES_CRIAR.corpo;
  const LD = LIMITES_CRIAR.difusor;

  const mudarCorpo = (campo: keyof EstadoCriar["corpo"], v: number) =>
    aoMudar({ ...criar, corpo: { ...criar.corpo, [campo]: v } });
  const mudarDifusor = (campo: "alturaMm" | "raioMm", v: number) =>
    aoMudar({ ...criar, difusor: { ...criar.difusor, [campo]: v } });

  const iForma = DIFUSORES.findIndex((d) => d.forma === criar.difusor.forma);

  return (
    <div>
      <div className="mb-3.5 rounded-[10px] border border-dashed border-[#DDD8CC] bg-white px-3 py-2 text-xs text-[#6E695E]">
        Você está remixando{" "}
        <b className="text-[#26241F]">{remixDe}</b>. Os encaixes ficam travados
        — o miolo é todo seu.
      </div>

      <Secao titulo="Corpo">
        <SliderCtl
          rotulo="Altura"
          valorFmt={`${cm(criar.corpo.alturaMm)} cm`}
          valor={criar.corpo.alturaMm}
          min={LC.alturaMm.min}
          max={LC.alturaMm.max}
          passo={LC.alturaMm.passo}
          aoMudar={(v) => mudarCorpo("alturaMm", v)}
          nota={`regra: ${LC.alturaMm.min / 10}–${LC.alturaMm.max / 10} cm — acima disso a peça não cabe na impressora`}
        />
        <SliderCtl
          rotulo="Volume do bojo"
          valorFmt={`${criar.corpo.volumeBojoMm >= 0 ? "+" : ""}${cm(criar.corpo.volumeBojoMm)} cm`}
          valor={criar.corpo.volumeBojoMm}
          min={LC.volumeBojoMm.min}
          max={LC.volumeBojoMm.max}
          passo={LC.volumeBojoMm.passo}
          aoMudar={(v) => mudarCorpo("volumeBojoMm", v)}
          nota="regra: parede mínima e distância do miolo elétrico preservadas"
        />
        <SliderCtl
          rotulo="Posição do bojo"
          valorFmt={fmtPos(criar.corpo.posicaoBojo)}
          valor={criar.corpo.posicaoBojo}
          min={LC.posicaoBojo.min}
          max={LC.posicaoBojo.max}
          passo={LC.posicaoBojo.passo}
          aoMudar={(v) => mudarCorpo("posicaoBojo", v)}
        />
        <SliderCtl
          rotulo="Ondulação"
          valorFmt={`${criar.corpo.ondulacao} ondas`}
          valor={criar.corpo.ondulacao}
          min={LC.ondulacao.min}
          max={LC.ondulacao.max}
          passo={LC.ondulacao.passo}
          aoMudar={(v) => mudarCorpo("ondulacao", v)}
        />
        <SliderCtl
          rotulo="Profundidade da onda"
          valorFmt={`${criar.corpo.amplitudeOndaMm.toFixed(1).replace(".", ",")} mm`}
          valor={criar.corpo.amplitudeOndaMm}
          min={LC.amplitudeOndaMm.min}
          max={LC.amplitudeOndaMm.max}
          passo={LC.amplitudeOndaMm.passo}
          aoMudar={(v) => mudarCorpo("amplitudeOndaMm", v)}
          nota={`regra: até ${LC.amplitudeOndaMm.max} mm — mais que isso vira balanço > ${REGRAS.F.balancoMaximoGraus}° e não imprime limpo`}
        />
        <div className="mb-1 text-[13px]">Acabamento</div>
        <Chips
          nomes={FACETAS.map((f) => f.nome)}
          selecionado={iFaceta}
          aoEscolher={setIFaceta}
        />
      </Secao>

      <Secao titulo="Difusor">
        <Chips
          nomes={DIFUSORES.map((d) => d.nome)}
          selecionado={iForma}
          aoEscolher={(i) =>
            aoMudar({
              ...criar,
              difusor: {
                forma: DIFUSORES[i].forma,
                alturaMm: DIFUSORES[i].alturaMm,
                raioMm: DIFUSORES[i].raioMm,
              },
            })
          }
        />
        <div className="mt-3">
          <SliderCtl
            rotulo="Altura do difusor"
            valorFmt={`${cm(criar.difusor.alturaMm)} cm`}
            valor={criar.difusor.alturaMm}
            min={LD.alturaMm.min}
            max={LD.alturaMm.max}
            passo={LD.alturaMm.passo}
            aoMudar={(v) => mudarDifusor("alturaMm", v)}
          />
          <SliderCtl
            rotulo="Abertura / largura"
            valorFmt={`Ø ${Math.round(criar.difusor.raioMm / 5)} cm`}
            valor={criar.difusor.raioMm}
            min={LD.raioMm.min}
            max={LD.raioMm.max}
            passo={LD.raioMm.passo}
            aoMudar={(v) => mudarDifusor("raioMm", v)}
          />
        </div>
      </Secao>

      <Secao titulo="Regras embutidas">
        <div className="rounded-xl border border-[#DDD8CC] bg-white px-3.5 py-3">
          <div className="flex justify-between py-1 text-xs text-[#6E695E]">
            <span>
              Parede mínima ({String(REGRAS.F.paredeDifusorMm.min).replace(".", ",")}–
              {String(REGRAS.F.paredeEstruturalMm.max).replace(".", ",")} mm)
            </span>
            <span className="font-semibold text-[#5F7A52]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#6E695E]">
            <span>Balanço ≤ {REGRAS.F.balancoMaximoGraus}°</span>
            <span className="font-semibold text-[#5F7A52]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#6E695E]">
            <span>Distância do miolo elétrico</span>
            <span className="font-semibold text-[#5F7A52]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#6E695E]">
            <span>Estabilidade</span>
            <span
              className={`font-semibold ${
                estab.pertoDoLimite ? "text-[#D9772F]" : "text-[#5F7A52]"
              }`}
            >
              {estab.ajustada ? "base ajustada ✓" : "✓"}
            </span>
          </div>
          <div className="mt-2 text-[10.5px] text-[#6E695E] opacity-80">
            {estab.ajustada
              ? "A base foi alargada automaticamente para o conjunto não tombar — a regra é a ferramenta."
              : "Tudo que estes controles permitem criar, a Per Parte fabrica."}
          </div>
        </div>
      </Secao>

      <Secao titulo="Publicar no catálogo">
        <div className="rounded-xl border border-[#DDD8CC] bg-white p-3.5">
          <input
            type="text"
            value={nomePeca}
            onChange={(e) => setNomePeca(e.target.value)}
            placeholder="dê um nome à sua peça (ex.: Duna)"
            className="mb-2 w-full rounded-lg border border-[#DDD8CC] bg-[#FBFAF7] px-3 py-2 text-[13px] outline-none focus:border-[#6E695E]"
          />
          <button
            onClick={() => setPublicada(nomePeca.trim() || "Sem nome")}
            className="w-full rounded-[10px] bg-[#26241F] py-2.5 text-[13.5px] font-semibold text-white hover:bg-black"
          >
            Publicar minha parte
          </button>
          {publicada && (
            <div className="mt-2.5 rounded-[10px] border border-[#E8D9BC] bg-[#F6EFE3] px-3 py-2.5 text-xs leading-relaxed">
              <b className="text-[#D9772F]">“{publicada}”</b> entrou na fila de
              curadoria. Quando aprovada, sua parte fica disponível para
              qualquer pessoa usar nas montagens dela — e você recebe{" "}
              <b>royalty por parte</b> a cada luminária vendida que usar uma
              criação sua.
            </div>
          )}
        </div>
      </Secao>
    </div>
  );
}
