"use client";

import { useEffect, useRef, useState } from "react";
import {
  LIMITES_PLACA,
  PLACA_PADRAO,
  type ParametrosPlaca,
} from "@per-parte/nucleo";

export function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/[0.06] px-5 py-4 last:border-b-0">
      <h3 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#A69D8D]">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

export function Chips({
  nomes,
  selecionado,
  aoEscolher,
}: {
  nomes: string[];
  selecionado: number;
  aoEscolher: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {nomes.map((n, i) => (
        <button
          key={n}
          onClick={() => aoEscolher(i)}
          className={`rounded-full px-3.5 py-1.5 text-[12.5px] transition-all ${
            i === selecionado
              ? "bg-[#F2EDE4] font-semibold text-[#161412]"
              : "border border-white/10 bg-white/[0.04] text-[#CFC7B8] hover:border-white/25 hover:bg-white/[0.08]"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function SliderCtl({
  rotulo,
  valorFmt,
  valor,
  min,
  max,
  passo,
  aoMudar,
  nota,
  motivoMin,
  motivoMax,
}: {
  rotulo: string;
  valorFmt: string;
  valor: number;
  min: number;
  max: number;
  passo: number;
  aoMudar: (v: number) => void;
  nota?: string;
  /** Por que o controle não desce mais — aparece quando o dedo encosta no piso. */
  motivoMin?: string;
  /** Por que o controle não sobe mais — aparece quando o dedo encosta no teto. */
  motivoMax?: string;
}) {
  const pct = max > min ? ((valor - min) / (max - min)) * 100 : 0;

  // O motivo do limite: nada de mensagem de erro — uma explicação humana,
  // que aparece quando o arraste encosta no fim do curso e some sozinha.
  const [motivo, setMotivo] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  function explicar(v: number) {
    const texto =
      v >= max && motivoMax ? motivoMax : v <= min && motivoMin ? motivoMin : null;
    if (!texto) return;
    setMotivo(texto);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMotivo(null), 4000);
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-[13px] text-[#E7E0D2]">{rotulo}</label>
        <span className="text-[12.5px] font-medium tabular-nums text-[#D3AC6C]">
          {valorFmt}
        </span>
      </div>
      <input
        type="range"
        className="ctl"
        style={{ ["--pct" as string]: `${pct}%` }}
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => {
          const v = Number(e.target.value);
          aoMudar(v);
          explicar(v);
        }}
      />
      {motivo && (
        <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-[#D3AC6C]/30 bg-[#D3AC6C]/[0.08] px-2.5 py-1.5 text-[10.5px] leading-relaxed text-[#E8CE9E]">
          <span className="font-bold text-[#D3AC6C]">!</span>
          <span>{motivo}</span>
        </div>
      )}
      {nota && !motivo && (
        <div className="mt-1.5 text-[10px] leading-relaxed text-[#7d766a]">
          {nota}
        </div>
      )}
    </div>
  );
}

export function PontosDeLuzCtl({
  pontosDeLuz,
  separacaoMm,
  sepMin,
  sepMax,
  sepPasso,
  aoMudarPontos,
  aoMudarSep,
  placa,
  aoMudarPlaca,
}: {
  pontosDeLuz: number;
  separacaoMm: number;
  sepMin: number;
  sepMax: number;
  sepPasso: number;
  aoMudarPontos: (n: 1 | 2) => void;
  aoMudarSep: (v: number) => void;
  /** Refletor (PLACA) na segunda coluna — null = sem refletor. */
  placa: ParametrosPlaca | null;
  aoMudarPlaca: (p: ParametrosPlaca | null) => void;
}) {
  const duo = pontosDeLuz === 2 || !!placa;
  return (
    <div>
      <Chips
        nomes={["1 luz", "2 luzes", "Luz + refletor"]}
        selecionado={placa ? 2 : pontosDeLuz === 2 ? 1 : 0}
        aoEscolher={(i) => {
          aoMudarPontos(i === 1 ? 2 : 1);
          aoMudarPlaca(i === 2 ? { ...PLACA_PADRAO } : null);
        }}
      />
      {duo && (
        <div className="mt-4">
          <SliderCtl
            rotulo="Separação das colunas"
            valorFmt={`${(separacaoMm / 10).toFixed(1).replace(".", ",")} cm`}
            valor={separacaoMm}
            min={sepMin}
            max={sepMax}
            passo={sepPasso}
            aoMudar={aoMudarSep}
            nota={
              placa
                ? "a luz na frente, o disco refletor atrás — o eclipse acende na parede"
                : "o corpo é a mesma peça impressa 2× (uma girada 180°); módulo elétrico em dobro"
            }
          />
        </div>
      )}
      {placa && (
        <div className="mt-1">
          <SliderCtl
            rotulo="Tamanho do disco"
            valorFmt={`Ø ${((placa.raioMm * 2) / 10).toFixed(0)} cm`}
            valor={placa.raioMm}
            min={LIMITES_PLACA.raioMm.min}
            max={LIMITES_PLACA.raioMm.max}
            passo={LIMITES_PLACA.raioMm.passo}
            aoMudar={(v) => aoMudarPlaca({ ...placa, raioMm: v })}
            motivoMax="Maior que isso o disco não cabe deitado na impressora (F1)."
          />
          <SliderCtl
            rotulo="Inclinação"
            valorFmt={`${placa.inclinacaoGraus}°`}
            valor={placa.inclinacaoGraus}
            min={LIMITES_PLACA.inclinacaoGraus.min}
            max={LIMITES_PLACA.inclinacaoGraus.max}
            passo={LIMITES_PLACA.inclinacaoGraus.passo}
            aoMudar={(v) => aoMudarPlaca({ ...placa, inclinacaoGraus: v })}
            nota="o disco pende para trás, como um eclipse"
            motivoMax="Mais deitado que isso o peso do disco sai de cima da base."
          />
          <SliderCtl
            rotulo="Concavidade"
            valorFmt={
              placa.concavidadeMm === 0
                ? "plano"
                : `${placa.concavidadeMm.toFixed(1).replace(".", ",")} mm`
            }
            valor={placa.concavidadeMm}
            min={LIMITES_PLACA.concavidadeMm.min}
            max={LIMITES_PLACA.concavidadeMm.max}
            passo={LIMITES_PLACA.concavidadeMm.passo}
            aoMudar={(v) => aoMudarPlaca({ ...placa, concavidadeMm: v })}
            nota="prato raso voltado para a luz — concentra o brilho refletido"
          />
          <SliderCtl
            rotulo="Altura do pescoço"
            valorFmt={`${(placa.pescocoMm / 10).toFixed(1).replace(".", ",")} cm`}
            valor={placa.pescocoMm}
            min={LIMITES_PLACA.pescocoMm.min}
            max={LIMITES_PLACA.pescocoMm.max}
            passo={LIMITES_PLACA.pescocoMm.passo}
            aoMudar={(v) => aoMudarPlaca({ ...placa, pescocoMm: v })}
          />
        </div>
      )}
    </div>
  );
}
