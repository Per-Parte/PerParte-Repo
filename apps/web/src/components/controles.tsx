"use client";

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
}: {
  rotulo: string;
  valorFmt: string;
  valor: number;
  min: number;
  max: number;
  passo: number;
  aoMudar: (v: number) => void;
  nota?: string;
}) {
  const pct = max > min ? ((valor - min) / (max - min)) * 100 : 0;
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
        onChange={(e) => aoMudar(Number(e.target.value))}
      />
      {nota && (
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
}: {
  pontosDeLuz: number;
  separacaoMm: number;
  sepMin: number;
  sepMax: number;
  sepPasso: number;
  aoMudarPontos: (n: 1 | 2) => void;
  aoMudarSep: (v: number) => void;
}) {
  return (
    <div>
      <Chips
        nomes={["1 luz", "2 luzes"]}
        selecionado={pontosDeLuz === 2 ? 1 : 0}
        aoEscolher={(i) => aoMudarPontos(i === 1 ? 2 : 1)}
      />
      {pontosDeLuz === 2 && (
        <div className="mt-4">
          <SliderCtl
            rotulo="Separação das colunas"
            valorFmt={`${(separacaoMm / 10).toFixed(1).replace(".", ",")} cm`}
            valor={separacaoMm}
            min={sepMin}
            max={sepMax}
            passo={sepPasso}
            aoMudar={aoMudarSep}
            nota="o corpo é a mesma peça impressa 2× (uma girada 180°); módulo elétrico em dobro"
          />
        </div>
      )}
    </div>
  );
}
