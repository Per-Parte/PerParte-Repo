"use client";

/**
 * Montagem v2 · F3 — painel direito do wireframe. Mostra, conforme a
 * ferramenta e a seleção: a GRADE de variações da forma escolhida
 * (3 colunas, miniaturas do motor), as PROPRIEDADES da forma selecionada,
 * a PALETA (quando o balde de tinta está na mão) ou os controles de
 * FATIAR. Todo slider é grampeado pelo núcleo: limite de fabricação vira
 * limite de controle, nunca mensagem de erro.
 */

import { useEffect, useState } from "react";
import {
  LIMITES_BLOCO,
  PALETA,
  PAREDE_MINIMA_BLOCO_MM,
  PONTO_DE_LUZ,
  VARIACOES_BLOCO,
  bordaTamanhoMaxMm,
  escalaAlturaMaxima,
  escalaLarguraMaxima,
  espessuraParedeMaxMm,
  furoMaximoMm,
  limitesFatiaMm,
  type EixoFatia,
  type FormaBloco,
  type FormaFuro,
  type ParametrosBloco,
  type SentidoBorda,
} from "@per-parte/nucleo";
import { ehPontoDeLuz, type ItemCena } from "./cena";
import { miniaturaDataUrl } from "./geometria";
import { FORMAS_BARRA } from "./BarraFormas";
import type { Ferramenta } from "./ferramentas";

const nomeDaForma = (forma: FormaBloco): string =>
  FORMAS_BARRA.find((f) => f.forma === forma)?.rotulo ?? forma;

// ---------------------------------------------------------------------------
// Peças de UI
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

function BotoesEmLinha<T extends string>({
  opcoes,
  valor,
  aoEscolher,
  desabilitado = false,
}: {
  opcoes: { valor: T; rotulo: string; dica?: string }[];
  valor: T;
  aoEscolher(v: T): void;
  desabilitado?: boolean;
}) {
  return (
    <div className="mt-2 flex gap-1">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          title={o.dica}
          disabled={desabilitado}
          onClick={() => aoEscolher(o.valor)}
          className={`h-9 flex-1 rounded-lg px-1 text-[11px] font-medium transition disabled:opacity-40 ${
            valor === o.valor
              ? "bg-neutral-900 text-white"
              : "bg-white text-neutral-700 enabled:hover:bg-neutral-100"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

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

  const rotulo = nomeDaForma(forma);

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
// Paleta (balde de tinta)
// ---------------------------------------------------------------------------

function PainelCores({
  corIdx,
  temSelecao,
  aoEscolherCor,
}: {
  corIdx: number;
  temSelecao: boolean;
  aoEscolherCor(idx: number): void;
}) {
  return (
    <div>
      <h2 className="mb-1 font-display text-lg text-neutral-900">
        🪣 Balde de tinta
      </h2>
      <p className="mb-3 text-xs text-neutral-500">
        {temSelecao
          ? "Toque numa cor para pintar a forma selecionada — ou toque em qualquer forma da cena com a cor na mão."
          : "Escolha uma cor e toque nas formas da cena para pintar."}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {PALETA.map((cor, i) => (
          <button
            key={cor.nome}
            type="button"
            title={cor.nome}
            onClick={() => aoEscolherCor(i)}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 text-[11px] transition ${
              corIdx === i
                ? "border-neutral-900 bg-neutral-50"
                : "border-transparent hover:bg-neutral-50"
            }`}
          >
            <span
              style={{ backgroundColor: cor.hex }}
              className="aspect-square w-full rounded-lg border border-black/10"
            />
            <span className="text-neutral-600">{cor.nome}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-neutral-500">
        Cada forma imprime separada — cor é de graça na produção.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fatiar
// ---------------------------------------------------------------------------

const EIXOS_UI: { eixo: EixoFatia; rotulo: string; dica: string }[] = [
  { eixo: "z", rotulo: "Altura", dica: "Corte na horizontal, na altura escolhida" },
  { eixo: "x", rotulo: "Largura", dica: "Corte na vertical, ao longo da largura" },
  { eixo: "y", rotulo: "Fundo", dica: "Corte na vertical, ao longo da profundidade" },
];

function PainelFatia({
  item,
  aoAtualizar,
  aoFecharGesto,
}: {
  item: ItemCena;
  aoAtualizar(parciais: Partial<ParametrosBloco>): void;
  aoFecharGesto(): void;
}) {
  const p = item.params;
  const fatia = p.fatia;
  const eixo = fatia?.eixo ?? "z";
  const faixa = limitesFatiaMm(p, eixo);
  const cabe = faixa.min <= faixa.max;

  const cortar = (novoEixo: EixoFatia) => {
    const nova = limitesFatiaMm(p, novoEixo);
    aoAtualizar({
      fatia: {
        eixo: novoEixo,
        posicaoMm: (nova.min + nova.max) / 2,
        lado: fatia?.lado ?? "menor",
      },
    });
    aoFecharGesto();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg text-neutral-900">
          Fatiar — {nomeDaForma(p.forma).toLowerCase()}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          O corte é de verdade: a face fica plana e a peça sai assim na
          impressão. Depois de cortar, a forma volta a assentar sozinha.
        </p>
      </div>

      <div>
        <span className="text-sm font-medium text-neutral-800">
          Onde passar o corte
        </span>
        <BotoesEmLinha
          opcoes={EIXOS_UI.map((e) => ({
            valor: e.eixo,
            rotulo: e.rotulo,
            dica: e.dica,
          }))}
          valor={eixo}
          aoEscolher={cortar}
        />
      </div>

      {!fatia && (
        <p className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
          Escolha acima por onde cortar — o corte entra no meio da forma e
          você ajusta depois.
        </p>
      )}

      {fatia && !cabe && (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          Esta forma é pequena demais para cortar neste sentido. Aumente o
          tamanho dela ou escolha outro corte.
        </p>
      )}

      {fatia && cabe && (
        <>
          <Slider
            rotulo={eixo === "z" ? "Altura do corte" : "Posição do corte"}
            valor={fatia.posicaoMm}
            min={faixa.min}
            max={faixa.max}
            passo={1}
            sufixo=" mm"
            aoMudar={(v) =>
              aoAtualizar({ fatia: { ...fatia, posicaoMm: v } })
            }
            aoSoltar={aoFecharGesto}
          />

          <button
            type="button"
            onClick={() => {
              aoAtualizar({
                fatia: {
                  ...fatia,
                  lado: fatia.lado === "menor" ? "maior" : "menor",
                },
              });
              aoFecharGesto();
            }}
            className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200"
          >
            {eixo === "z"
              ? fatia.lado === "menor"
                ? "Fica a parte de baixo ⇅"
                : "Fica a parte de cima ⇅"
              : "Trocar o lado que fica ⇄"}
          </button>

          <button
            type="button"
            onClick={() => {
              aoAtualizar({ fatia: null });
              aoFecharGesto();
            }}
            className="w-full rounded-xl px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Remover o corte
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Propriedades
// ---------------------------------------------------------------------------

const FORMAS_FURO_UI: { forma: FormaFuro; simbolo: string; nome: string }[] = [
  { forma: "circulo", simbolo: "○", nome: "Redondo" },
  { forma: "triangulo", simbolo: "△", nome: "Triangular" },
  { forma: "quadrado", simbolo: "□", nome: "Quadrado" },
];

function SecaoBorda({
  p,
  aoAtualizar,
  aoFecharGesto,
}: {
  p: ParametrosBloco;
  aoAtualizar(parciais: Partial<ParametrosBloco>): void;
  aoFecharGesto(): void;
}) {
  // A esfera é curva inteira: não tem borda reta para encurvar.
  if (p.forma === "esfera") return null;
  const sentido: SentidoBorda | "reta" = p.borda?.sentido ?? "reta";
  const tetoDe = (s: SentidoBorda) => bordaTamanhoMaxMm({ ...p, sentido: s });
  const tetoFora = tetoDe("fora");
  const tetoDentro = tetoDe("dentro");
  const semEspaco = tetoFora <= 0 && tetoDentro <= 0;
  const teto = p.borda ? tetoDe(p.borda.sentido) : 0;

  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <span className="text-sm font-medium text-neutral-800">
        Borda do topo
      </span>
      <BotoesEmLinha
        opcoes={[
          { valor: "reta", rotulo: "Reta", dica: "Sem curva na borda" },
          {
            valor: "fora",
            rotulo: "Pra fora",
            dica: "A borda abre como uma aba de abajur",
          },
          {
            valor: "dentro",
            rotulo: "Pra dentro",
            dica: "A borda fecha como um lábio",
          },
        ]}
        valor={sentido}
        desabilitado={semEspaco}
        aoEscolher={(v) => {
          if (v === "reta") {
            aoAtualizar({ borda: null });
          } else {
            const novoTeto = tetoDe(v);
            aoAtualizar({
              borda: {
                sentido: v,
                tamanhoMm: Math.min(
                  p.borda?.tamanhoMm ?? novoTeto / 2,
                  novoTeto
                ),
              },
            });
          }
          aoFecharGesto();
        }}
      />
      {semEspaco && (
        <p className="mt-2 text-[11px] text-neutral-500">
          Esta forma é pequena demais para uma borda encurvada — aumente o
          tamanho dela.
        </p>
      )}
      {p.borda && teto > 0 && (
        <div className="mt-3">
          <Slider
            rotulo="Tamanho da borda"
            valor={p.borda.tamanhoMm}
            min={LIMITES_BLOCO.bordaTamanhoMm.min}
            max={teto}
            passo={LIMITES_BLOCO.bordaTamanhoMm.passo}
            sufixo=" mm"
            aoMudar={(v) =>
              aoAtualizar({ borda: { ...p.borda!, tamanhoMm: v } })
            }
            aoSoltar={aoFecharGesto}
          />
        </div>
      )}
    </div>
  );
}

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
  const tetoFuro = p.furos
    ? Math.max(LIMITES_BLOCO.furoTamanhoMm.min, furoMaximoMm(p))
    : LIMITES_BLOCO.furoTamanhoMm.min;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-neutral-900">
        {nomeDaForma(p.forma)}
      </h2>

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

      <SecaoBorda p={p} aoAtualizar={aoAtualizar} aoFecharGesto={aoFecharGesto} />

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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// O painel
// ---------------------------------------------------------------------------

export function PainelDireito({
  ferramenta,
  formaAberta,
  selecionado,
  corAtualIdx,
  aoEscolherVariacao,
  aoAtualizar,
  aoEscolherCor,
  aoFecharGesto,
}: {
  ferramenta: Ferramenta;
  formaAberta: FormaBloco | null;
  selecionado: ItemCena | null;
  corAtualIdx: number;
  aoEscolherVariacao(variacaoId: string): void;
  aoAtualizar(parciais: Partial<ParametrosBloco>): void;
  aoEscolherCor(idx: number): void;
  aoFecharGesto(): void;
}) {
  const conteudo = () => {
    // O balde de tinta manda no painel enquanto estiver na mão.
    if (ferramenta === "pintar") {
      return (
        <PainelCores
          corIdx={selecionado ? selecionado.params.corIdx : corAtualIdx}
          temSelecao={selecionado != null}
          aoEscolherCor={aoEscolherCor}
        />
      );
    }
    if (ferramenta === "fatiar") {
      if (selecionado && !ehPontoDeLuz(selecionado)) {
        return (
          <PainelFatia
            item={selecionado}
            aoAtualizar={aoAtualizar}
            aoFecharGesto={aoFecharGesto}
          />
        );
      }
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-neutral-500">
          <span className="text-3xl">🔪</span>
          Toque numa forma da cena
          <br />
          para escolher por onde cortar.
        </div>
      );
    }
    if (selecionado) {
      return (
        <Propriedades
          item={selecionado}
          aoAtualizar={aoAtualizar}
          aoFecharGesto={aoFecharGesto}
        />
      );
    }
    if (formaAberta) {
      return (
        <GradeVariacoes forma={formaAberta} aoEscolher={aoEscolherVariacao} />
      );
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-neutral-500">
        <span className="text-3xl">✦</span>
        Escolha uma forma na barra de baixo
        <br />
        para ver as variações dela aqui.
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
      {conteudo()}
    </div>
  );
}
