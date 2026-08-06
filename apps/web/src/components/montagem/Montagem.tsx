"use client";

/**
 * Montagem v2 · F2/F3 — a tela do modo blocos (rota /criar), no layout
 * do wireframe: ferramentas à esquerda, formas na base, painel de
 * variações ↔ propriedades à direita, obra centralizada no meio e a
 * manivela de giro no canto superior direito da cena.
 *
 * Undo por GESTO: operações discretas empilham na hora; gestos
 * contínuos (arrastar, slider, girar a cena) guardam a cena de antes no
 * início e empilham uma vez só quando o gesto termina.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  VARIACOES_BLOCO,
  blocoDaVariacao,
  type FormaBloco,
  type ParametrosBloco,
} from "@per-parte/nucleo";
import {
  CENA_VAZIA,
  adicionarForma,
  adicionarPontoDeLuz,
  apagarItem,
  atualizarParams,
  ehPontoDeLuz,
  girarItem,
  moverItem,
  pontosDeLuz,
  type Cena,
} from "./cena";
import Viewport3D from "./Viewport3D";
import { ManivelaCena } from "./ManivelaCena";
import { BarraFerramentas, type Ferramenta } from "./ferramentas";
import { BarraFormas } from "./BarraFormas";
import { PainelDireito } from "./PainelDireito";

export default function Montagem() {
  const [cena, setCena] = useState<Cena>(CENA_VAZIA);
  const [passado, setPassado] = useState<Cena[]>([]);
  const [futuro, setFuturo] = useState<Cena[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [ferramenta, setFerramenta] = useState<Ferramenta>("selecionar");
  const [formaAberta, setFormaAberta] = useState<FormaBloco | null>(null);
  /** Giro da cena inteira (manivela) — é vista, não faz parte da obra. */
  const [giroCenaGraus, setGiroCenaGraus] = useState(0);
  /** Cor na ponta do balde de tinta. */
  const [corAtualIdx, setCorAtualIdx] = useState(0);

  // Cena de antes de um gesto contínuo (arrasto/slider) — vira UM passo
  // de undo quando o gesto fecha.
  const baseDoGesto = useRef<Cena | null>(null);
  const cenaRef = useRef(cena);
  useEffect(() => {
    cenaRef.current = cena;
  }, [cena]);

  /** Operação discreta: empilha o estado atual e aplica. */
  const comHistorico = useCallback((proxima: (c: Cena) => Cena) => {
    setPassado((p) => [...p, cenaRef.current]);
    setFuturo([]);
    setCena((c) => proxima(c));
  }, []);

  /** Passo de um gesto contínuo: aplica sem empilhar (guarda a base). */
  const aplicarVivo = useCallback((proxima: (c: Cena) => Cena) => {
    if (baseDoGesto.current == null) baseDoGesto.current = cenaRef.current;
    setCena((c) => proxima(c));
  }, []);

  const fecharGesto = useCallback(() => {
    const base = baseDoGesto.current;
    baseDoGesto.current = null;
    if (base != null && base !== cenaRef.current) {
      setPassado((p) => [...p, base]);
      setFuturo([]);
    }
  }, []);

  const desfazer = useCallback(() => {
    setPassado((p) => {
      if (p.length === 0) return p;
      const anterior = p[p.length - 1];
      setFuturo((f) => [...f, cenaRef.current]);
      setCena(anterior);
      return p.slice(0, -1);
    });
    setSelecionadoId(null);
  }, []);

  const refazer = useCallback(() => {
    setFuturo((f) => {
      if (f.length === 0) return f;
      const proxima = f[f.length - 1];
      setPassado((p) => [...p, cenaRef.current]);
      setCena(proxima);
      return f.slice(0, -1);
    });
    setSelecionadoId(null);
  }, []);

  const apagarSelecionado = useCallback(() => {
    if (selecionadoId == null) return;
    comHistorico((c) => apagarItem(c, selecionadoId));
    setSelecionadoId(null);
  }, [selecionadoId, comHistorico]);

  // Atalhos: Ctrl/Cmd+Z (desfazer), +Shift (refazer), Delete (apagar).
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName)) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) refazer();
        else desfazer();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        apagarSelecionado();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [desfazer, refazer, apagarSelecionado]);

  const escolherVariacao = (variacaoId: string) => {
    if (!formaAberta) return;
    const variacao = VARIACOES_BLOCO.find((v) => v.id === variacaoId);
    if (!variacao) return;
    const params = blocoDaVariacao(variacao, formaAberta, corAtualIdx);
    comHistorico((c) => adicionarForma(c, params));
    // A forma nova já entra selecionada (espec §4.2) — o id dela é o
    // proximoId de antes da adição.
    setSelecionadoId(cenaRef.current.proximoId);
  };

  /** Balde de tinta: pinta um item com a cor na ponta do balde. */
  const pintar = useCallback(
    (id: number, corIdx: number) => {
      const item = cenaRef.current.itens.find((b) => b.id === id);
      if (!item || ehPontoDeLuz(item)) return;
      comHistorico((c) => atualizarParams(c, id, { corIdx }));
    },
    [comHistorico]
  );

  const selecionado =
    cena.itens.find((b) => b.id === selecionadoId) ?? null;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#F6F5F1] text-neutral-900">
      <Viewport3D
        itens={cena.itens}
        selecionadoId={selecionadoId}
        ferramenta={ferramenta}
        giroCenaGraus={giroCenaGraus}
        onSelecionar={setSelecionadoId}
        onMover={(id, dx, dy) => aplicarVivo((c) => moverItem(c, id, dx, dy))}
        onRedimensionar={(id, delta) =>
          aplicarVivo((c) => {
            const item = c.itens.find((b) => b.id === id);
            if (!item) return c;
            return atualizarParams(c, id, {
              tamanhoMm: item.params.tamanhoMm + delta,
            });
          })
        }
        onGirar={(id, graus) => aplicarVivo((c) => girarItem(c, id, graus))}
        onPintar={(id) => pintar(id, corAtualIdx)}
        onFimDeGesto={fecharGesto}
      />

      {/* Cabeçalho discreto. */}
      <header className="pointer-events-none absolute left-4 top-3 z-10 flex items-center gap-3">
        <Link
          href="/"
          className="pointer-events-auto rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-neutral-700 shadow backdrop-blur transition hover:bg-white"
        >
          ← Per Parte
        </Link>
        <span className="rounded-lg bg-white/60 px-2.5 py-1 text-xs text-neutral-500 backdrop-blur">
          Criar · modo blocos <strong className="text-amber-700">beta</strong>
        </span>
      </header>

      {/* Estado vazio: instrução curta e convidativa. */}
      {cena.itens.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center font-display text-xl text-neutral-400">
          Toque numa forma para começar
        </p>
      )}

      {/* Esquerda: ferramentas. */}
      <aside className="absolute left-3 top-1/2 z-10 -translate-y-1/2">
        <BarraFerramentas
          ativa={ferramenta}
          aoEscolher={setFerramenta}
          temSelecao={selecionadoId != null}
          aoApagar={apagarSelecionado}
          podeDesfazer={passado.length > 0}
          podeRefazer={futuro.length > 0}
          aoDesfazer={desfazer}
          aoRefazer={refazer}
        />
      </aside>

      {/* Canto superior direito da CENA: a manivela que gira a obra. */}
      <div className="absolute right-[320px] top-3 z-10">
        <ManivelaCena
          giroGraus={giroCenaGraus}
          aoGirar={(delta) => setGiroCenaGraus((g) => g + delta)}
          aoFimDeGesto={() => {
            /* o giro é vista: não entra no histórico da obra */
          }}
        />
      </div>

      {/* Base: as 4 formas + ponto de luz. */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <BarraFormas
          formaAberta={formaAberta}
          aoAbrirForma={(f) => {
            setFormaAberta(f);
            // Espec §4.4: clicar na barra volta o painel para a grade.
            setSelecionadoId(null);
            // Com o balde ou a faca na mão, a grade não apareceria.
            if (ferramenta === "pintar" || ferramenta === "fatiar") {
              setFerramenta("selecionar");
            }
          }}
          quantidadeLuzes={pontosDeLuz(cena).length}
          aoAdicionarLuz={() => {
            comHistorico((c) => adicionarPontoDeLuz(c));
            setSelecionadoId(cenaRef.current.proximoId);
          }}
        />
      </div>

      {/* Direita: variações ↔ propriedades ↔ paleta ↔ fatiar. */}
      <aside className="absolute bottom-24 right-3 top-3 z-10 w-[300px] max-w-[calc(100vw-6rem)]">
        <PainelDireito
          ferramenta={ferramenta}
          formaAberta={formaAberta}
          selecionado={selecionado}
          corAtualIdx={corAtualIdx}
          aoEscolherVariacao={escolherVariacao}
          aoAtualizar={(parciais: Partial<ParametrosBloco>) => {
            if (selecionadoId == null) return;
            aplicarVivo((c) => atualizarParams(c, selecionadoId, parciais));
          }}
          aoEscolherCor={(idx) => {
            setCorAtualIdx(idx);
            if (selecionadoId != null) pintar(selecionadoId, idx);
          }}
          aoFecharGesto={fecharGesto}
        />
      </aside>
    </main>
  );
}
