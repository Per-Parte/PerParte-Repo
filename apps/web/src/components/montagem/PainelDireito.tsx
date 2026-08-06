"use client";

/**
 * Montagem v2 · F3 — painel direito do wireframe: ora a GRADE de
 * variações da forma escolhida (3 colunas, miniaturas do motor), ora as
 * PROPRIEDADES da forma selecionada (sliders com valor visível — todos
 * grampeados pelo núcleo; limite de fabricação vira limite de controle,
 * nunca mensagem de erro).
 */

import { useEffect, useState } from "react";
import {
  LIMITES_BLOCO,
  PALETA,
  PAREDE_MINIMA_BLOCO_MM,
  PONTO_DE_LUZ,
  VARIACOES_BLOCO,
  escalaAlturaMaxima,
  escalaLarguraMaxima,
  espessuraParedeMaxMm,
  furoMaximoMm,
  type FormaBloco,
  type FormaFuro,
  type ParametrosBloco,
} from "@per-parte/nucleo";
import { ehPontoDeLuz, type ItemCena } from "./cena";
import { miniaturaDataUrl } from "./geometria";
import { FORMAS_BARRA } from "./BarraFormas";

// ---------------------------------------------------------------------------
// Grade de variações
// ---------------------------------------------------------------------------

function GradeVariacoes({
  forma,
  aoEscolher,
}: {
  forma: FormaBloco;
  aoEscolher(variacaoId: string): void;
}) {
  // Miniaturas são WebGL (sistema externo): geram no cliente, fora do
  // corpo do efeito, para não segurar o paint com 8 renders seguidos.
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let vivo = true;
    const tarefa = setTimeout(() => {
      const geradas: Record<string, string> = {};
      for (const v of VARIACOES_BLOCO) {
        geradas[v.id] = miniaturaDataUrl(forma, v.id);
      }
      if (vivo) setUrls(geradas);
    }, 0);
    return () => {
      vivo = false;
      clearTimeout(tarefa);
    };
  }, [forma]);

  const rotulo =
    FORMAS_BARRA.find((f) => f.forma === forma)?.rotulo ?? forma;

  return (
    <div>
      <h2 className="mb-3 font-display text-lg text-neutral-900">
        {rotulo} — variações
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {VARIACOES_BLOCO.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => aoEscolher(v.id)}
            title={`Adicionar ${rotulo.toLowerCase()} — ${v.nome.toLowerCase()}`}
            className="flex flex-col items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1.5 pb-2 text-[11px] text-neutral-700 transition hover:border-neutral-400 hover:shadow"
          >
            {urls[v.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urls[v.id]}
                alt={v.nome}
                className="aspect-square w-full rounded-lg bg-neutral-50"
              />
            ) : (
              <span className="aspect-square w-full animate-pulse rounded-lg bg-neutral-100" />
            )}
            {v.nome}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Toque numa variação para ela entrar na cena — já encostada no topo
        da obra.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Propriedades
// ---------------------------------------------------------------------------

function Slider({
  rotulo,
  valor,
  min,
  max,
  passo,
  sufixo = "",
  aoMudar,
  aoSoltar,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo: number;
  sufixo?: string;
  aoMudar(v: number): void;
  aoSoltar(): void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs font-medium text-neutral-700">
        {rotulo}
        <span className="tabular-nums text-neutral-500">
          {Number.isInteger(passo) ? valor.toFixed(0) : valor.toFixed(2)}
          {sufixo}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        onPointerUp={aoSoltar}
        onKeyUp={aoSoltar}
        className="mt-1 w-full accent-neutral-900"
      />
    </label>
  );
}

const FORMAS_FURO_UI: { forma: FormaFuro; simbolo: string; nome: string }[] = [
  { forma: "circulo", simbolo: "○", nome: "Redondo" },
  { forma: "triangulo", simbolo: "△", nome: "Triangular" },
  { forma: "quadrado", simbolo: "□", nome: "Quadrado" },
];

function Propriedades({
  item,
  aoAtualizar,
  aoFecharGesto,
}: {
  item: ItemCena;
  aoAtualizar(parciais: Partial<ParametrosBloco>): void;
  aoFecharGesto(): void;
}) {
  if (ehPontoDeLuz(item)) {
    return (
      <div>
        <h2 className="mb-2 font-display text-lg text-neutral-900">
          💡 Ponto de luz
        </h2>
        <p className="text-sm text-neutral-600">
          Peça padronizada: base de {PONTO_DE_LUZ.baseLadoMm / 10} ×{" "}
          {PONTO_DE_LUZ.baseLadoMm / 10} cm com bulbo de{" "}
          {PONTO_DE_LUZ.bulboAlturaMm / 10} cm — é ela que abriga a luz da
          sua obra. Use <strong>Mover</strong> para reposicionar.
        </p>
      </div>
    );
  }

  const p = item.params;
  const rotulo =
    FORMAS_BARRA.find((f) => f.forma === p.forma)?.rotulo ?? p.forma;
  const tetoFuro = p.furos
    ? Math.max(LIMITES_BLOCO.furoTamanhoMm.min, furoMaximoMm(p))
    : LIMITES_BLOCO.furoTamanhoMm.min;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-neutral-900">{rotulo}</h2>

      <Slider
        rotulo="Tamanho geral"
        valor={p.tamanhoMm}
        min={LIMITES_BLOCO.tamanhoMm.min}
        max={LIMITES_BLOCO.tamanhoMm.max}
        passo={LIMITES_BLOCO.tamanhoMm.passo}
        sufixo=" mm"
        aoMudar={(v) => aoAtualizar({ tamanhoMm: v })}
        aoSoltar={aoFecharGesto}
      />
      <Slider
        rotulo="Esticar ↕ achatar"
        valor={p.escalaAltura}
        min={LIMITES_BLOCO.escalaAltura.min}
        max={escalaAlturaMaxima(p.tamanhoMm)}
        passo={LIMITES_BLOCO.escalaAltura.passo}
        sufixo="×"
        aoMudar={(v) => aoAtualizar({ escalaAltura: v })}
        aoSoltar={aoFecharGesto}
      />
      <Slider
        rotulo="Alargar ↔ afinar"
        valor={p.escalaLargura}
        min={LIMITES_BLOCO.escalaLargura.min}
        max={escalaLarguraMaxima(p.tamanhoMm)}
        passo={LIMITES_BLOCO.escalaLargura.passo}
        sufixo="×"
        aoMudar={(v) => aoAtualizar({ escalaLargura: v })}
        aoSoltar={aoFecharGesto}
      />

      <div className="rounded-xl bg-neutral-50 p-3">
        <label className="flex items-center justify-between text-sm font-medium text-neutral-800">
          Oca por dentro
          <input
            type="checkbox"
            checked={p.oca}
            onChange={(e) =>
              aoAtualizar(
                e.target.checked ? { oca: true } : { oca: false, furos: null }
              )
            }
            className="h-5 w-5 accent-neutral-900"
          />
        </label>
        {p.oca && (
          <div className="mt-3">
            <Slider
              rotulo="Espessura da parede"
              valor={p.espessuraParedeMm}
              min={PAREDE_MINIMA_BLOCO_MM}
              max={espessuraParedeMaxMm(p)}
              passo={LIMITES_BLOCO.espessuraParedeMm.passo}
              sufixo=" mm"
              aoMudar={(v) => aoAtualizar({ espessuraParedeMm: v })}
              aoSoltar={aoFecharGesto}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl bg-neutral-50 p-3">
        <span className="text-sm font-medium text-neutral-800">Furos</span>
        <div className="mt-2 flex gap-1">
          {FORMAS_FURO_UI.map(({ forma, simbolo, nome }) => (
            <button
              key={forma}
              type="button"
              title={`Furos com formato ${nome.toLowerCase()}`}
              onClick={() =>
                aoAtualizar({
                  furos: {
                    forma,
                    quantidade: p.furos?.quantidade ?? 4,
                    tamanhoMm:
                      p.furos?.tamanhoMm ?? LIMITES_BLOCO.furoTamanhoMm.min,
                  },
                })
              }
              className={`h-10 flex-1 rounded-lg text-lg transition ${
                p.furos?.forma === forma
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {simbolo}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-3">
          <Slider
            rotulo="Quantidade"
            valor={p.furos?.quantidade ?? 0}
            min={0}
            max={LIMITES_BLOCO.furosQuantidade.max}
            passo={1}
            aoMudar={(v) =>
              aoAtualizar(
                v === 0
                  ? { furos: null }
                  : {
                      furos: {
                        forma: p.furos?.forma ?? "circulo",
                        quantidade: v,
                        tamanhoMm:
                          p.furos?.tamanhoMm ??
                          LIMITES_BLOCO.furoTamanhoMm.min,
                      },
                    }
              )
            }
            aoSoltar={aoFecharGesto}
          />
          {p.furos && (
            <Slider
              rotulo="Tamanho do furo"
              valor={p.furos.tamanhoMm}
              min={LIMITES_BLOCO.furoTamanhoMm.min}
              max={tetoFuro}
              passo={LIMITES_BLOCO.furoTamanhoMm.passo}
              sufixo=" mm"
              aoMudar={(v) =>
                aoAtualizar({ furos: { ...p.furos!, tamanhoMm: v } })
              }
              aoSoltar={aoFecharGesto}
            />
          )}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-neutral-800">Cor</span>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {PALETA.map((cor, i) => (
            <button
              key={cor.nome}
              type="button"
              title={cor.nome}
              onClick={() => aoAtualizar({ corIdx: i })}
              style={{ backgroundColor: cor.hex }}
              className={`h-8 w-full rounded-lg border-2 transition ${
                p.corIdx === i
                  ? "border-neutral-900"
                  : "border-transparent hover:border-neutral-300"
              }`}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-500">
          Cada forma imprime separada — cor é de graça na produção.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// O painel
// ---------------------------------------------------------------------------

export function PainelDireito({
  formaAberta,
  selecionado,
  aoEscolherVariacao,
  aoAtualizar,
  aoFecharGesto,
}: {
  formaAberta: FormaBloco | null;
  selecionado: ItemCena | null;
  aoEscolherVariacao(variacaoId: string): void;
  aoAtualizar(parciais: Partial<ParametrosBloco>): void;
  aoFecharGesto(): void;
}) {
  return (
    <div className="h-full overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
      {selecionado ? (
        <Propriedades
          item={selecionado}
          aoAtualizar={aoAtualizar}
          aoFecharGesto={aoFecharGesto}
        />
      ) : formaAberta ? (
        <GradeVariacoes forma={formaAberta} aoEscolher={aoEscolherVariacao} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-neutral-500">
          <span className="text-3xl">✦</span>
          Escolha uma forma na barra de baixo
          <br />
          para ver as variações dela aqui.
        </div>
      )}
    </div>
  );
}
