"use client";

import { useEffect, useRef, useState } from "react";
import {
  LIMITES_PLACA,
  PALETA,
  PLACA_PADRAO,
  type ParametrosPlaca,
} from "@per-parte/nucleo";
import { FAMILIAS_PALETA } from "@/lib/familias-paleta";

/**
 * Seção colapsável do painel, com header sticky no scroll do painel.
 * O data-secao é o gancho estável para a próxima fase (scroll-driven camera).
 */
export function Secao({
  id,
  titulo,
  aberta = true,
  children,
}: {
  /** Âncora estável no DOM (data-secao) — a câmera pluga aqui depois. */
  id: string;
  titulo: string;
  /** Estado inicial de abertura (o visitante pode fechar/abrir). */
  aberta?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={aberta}
      data-secao={id}
      className="group border-b border-black/[0.06] last:border-b-0"
    >
      <summary className="sticky top-0 z-10 flex cursor-pointer select-none list-none items-center justify-between gap-3 bg-white px-5 py-3.5 [&::-webkit-details-marker]:hidden">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#6D675C]">
          {titulo}
        </h3>
        <svg
          viewBox="0 0 10 6"
          className="h-1.5 w-2.5 text-[#97907F] transition-transform duration-200 ease-padrao group-open:rotate-180"
          aria-hidden
        >
          <path
            d="M1 1l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

/** Subtítulo de bloco dentro de uma seção. */
export function SubRotulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-4 text-[13px] font-medium text-palco-escuro">
      {children}
    </div>
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
              ? "bg-palco-escuro font-semibold text-luz-acesa"
              : "border border-black/10 bg-black/[0.02] text-[#4A463D] hover:border-black/30"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

/** Swatches circulares 28 px, agrupados por família da paleta (§4.2). */
export function PaletaFamilias({
  selecionado,
  aoEscolher,
}: {
  selecionado: number;
  aoEscolher: (i: number) => void;
}) {
  return (
    <div className="space-y-3">
      {FAMILIAS_PALETA.map((f) => (
        <div key={f.nome}>
          <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[#97907F]">
            {f.nome}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {f.indices.map((i) => (
              <button
                key={PALETA[i].nome}
                title={PALETA[i].nome}
                onClick={() => aoEscolher(i)}
                className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                  selecionado === i
                    ? "ring-2 ring-palco-escuro ring-offset-2 ring-offset-white"
                    : "ring-1 ring-black/15"
                }`}
                style={{ background: PALETA[i].hex }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Número que anima em contagem (~300 ms) a cada mudança — o preço evolutivo
 * virando experiência (§4.1). Com prefers-reduced-motion, troca seco.
 */
export function NumeroAnimado({ valor }: { valor: number }) {
  const [mostrado, setMostrado] = useState(valor);
  const partida = useRef(valor);
  useEffect(() => {
    const de = partida.current;
    if (de === valor) return;
    const seco = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = requestAnimationFrame(function passo(t) {
      const p = seco ? 1 : Math.min(1, (t - t0) / 300);
      const suave = 1 - Math.pow(1 - p, 3);
      setMostrado(Math.round(de + (valor - de) * suave));
      if (p < 1) raf = requestAnimationFrame(passo);
    });
    return () => {
      cancelAnimationFrame(raf);
      partida.current = valor;
    };
  }, [valor]);
  return <>{mostrado.toLocaleString("pt-BR")}</>;
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
        <label className="text-[13px] text-[#4A463D]">{rotulo}</label>
        <span className="text-[12.5px] font-semibold tabular-nums text-palco-escuro">
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
        <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-acento/40 bg-acento/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-[#6B4E12]">
          <span className="font-bold text-[#A87A16]">!</span>
          <span>{motivo}</span>
        </div>
      )}
      {nota && !motivo && (
        <div className="mt-1.5 text-[10px] leading-relaxed text-[#97907F]">
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
