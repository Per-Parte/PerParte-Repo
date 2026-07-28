"use client";

export function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2.5 mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6E695E] first:mt-0">
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
    <div className="flex flex-wrap gap-2">
      {nomes.map((n, i) => (
        <button
          key={n}
          onClick={() => aoEscolher(i)}
          className={`rounded-[10px] border px-3 py-2 text-[12.5px] transition-colors ${
            i === selecionado
              ? "border-[#26241F] bg-[#26241F] text-white"
              : "border-[#DDD8CC] bg-white text-[#26241F] hover:border-[#6E695E]"
          }`}
        >
          {n}
        </button>
      ))}
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
        <div className="mt-3">
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
  return (
    <div className="mb-3.5">
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-[13px]">{rotulo}</label>
        <span className="text-xs tabular-nums text-[#6E695E]">{valorFmt}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="w-full accent-[#26241F]"
      />
      {nota && (
        <div className="mt-1 text-[10px] text-[#6E695E] opacity-80">{nota}</div>
      )}
    </div>
  );
}
