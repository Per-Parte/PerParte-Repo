"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { OBRAS_ANEL } from "@/lib/obras-anel";

/**
 * O Anel de Obras (§3.3) — cards de luminárias percorrendo um caminho
 * elíptico contínuo em CSS 3D, decorativo para leitores de tela (a lista
 * real vem logo depois, sr-only). Preenche o ancestral posicionado mais
 * próximo: quem o importa decide onde ele fica na pilha do herói.
 */

/** Uma volta completa do anel, em segundos. */
const SEGUNDOS_POR_VOLTA = 75;
/** Fração da velocidade durante o hover — desacelera, não congela. */
const FATOR_HOVER = 0.3;
/** Cards do leque estático de prefers-reduced-motion. */
const CARDS_LEQUE = 7;

interface Medidas {
  n: number;
  larguraCard: number;
  rx: number;
  rz: number;
}

/** Só roda no cliente — o SSR nunca mede viewport (nada de NaN). */
function medir(): Medidas {
  const vw = window.innerWidth;
  const movel = vw < 768;
  return {
    n: movel ? 10 : 18,
    larguraCard: movel ? 128 : 200,
    rx: vw * (movel ? 0.38 : 0.42),
    rz: vw * 0.3,
  };
}

/** Leque estático: 7 cards abertos como cartas na mão. */
function estiloLeque(i: number, largura: number): CSSProperties {
  const c = i - (CARDS_LEQUE - 1) / 2;
  return {
    transform:
      `translate(-50%, -50%) translateX(${c * largura * 0.62}px) ` +
      `translateY(${Math.abs(c) * largura * 0.07}px) rotate(${c * 5}deg) ` +
      `scale(${1 - Math.abs(c) * 0.05})`,
    zIndex: 10 - Math.abs(c),
  };
}

export default function AnelDeObras({ className }: { className?: string }) {
  const [medidas, setMedidas] = useState<Medidas | null>(null);
  const [semMovimento, setSemMovimento] = useState(false);
  const anelRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const thetaRef = useRef(0);
  const alvoVelocidadeRef = useRef(1);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aoMudarMovimento = () => setSemMovimento(consulta.matches);
    const aoRedimensionar = () => setMedidas(medir());
    aoMudarMovimento();
    aoRedimensionar();
    consulta.addEventListener("change", aoMudarMovimento);
    window.addEventListener("resize", aoRedimensionar);
    return () => {
      consulta.removeEventListener("change", aoMudarMovimento);
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, []);

  // Um rAF atualiza --theta no container e posiciona os cards por ref —
  // zero re-render React por frame. Os cards nascem invisíveis e só
  // aparecem já posicionados (sem flash de cards empilhados).
  useEffect(() => {
    if (!medidas || semMovimento) return;
    const anel = anelRef.current;
    if (!anel) return;

    const { n, rx, rz } = medidas;
    let quadro = 0;
    let ultimo = 0;
    let velocidade = 1;

    const posicionar = () => {
      const theta = thetaRef.current;
      anel.style.setProperty("--theta", theta.toFixed(5));
      for (let i = 0; i < n; i++) {
        const card = cardsRef.current[i];
        if (!card) continue;
        const a = theta + (i * Math.PI * 2) / n;
        const x = rx * Math.sin(a);
        const z = rz * Math.cos(a) - rz;
        const profundidade = (Math.cos(a) + 1) / 2; // 1 = frente, 0 = fundo
        card.style.transform =
          `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, 0, ` +
          `${z.toFixed(1)}px) scale(${(0.55 + 0.45 * profundidade).toFixed(3)})`;
        card.style.filter = `brightness(${(0.8 + 0.2 * profundidade).toFixed(3)})`;
        card.style.zIndex = String(Math.round(profundidade * 100));
        card.style.visibility = "visible";
      }
    };

    const passo = (agora: number) => {
      const dt = Math.min((agora - ultimo) / 1000, 0.1);
      ultimo = agora;
      velocidade += (alvoVelocidadeRef.current - velocidade) * Math.min(1, dt * 4);
      thetaRef.current += dt * ((Math.PI * 2) / SEGUNDOS_POR_VOLTA) * velocidade;
      posicionar();
      quadro = requestAnimationFrame(passo);
    };

    const comecar = () => {
      ultimo = performance.now();
      quadro = requestAnimationFrame(passo);
    };
    const parar = () => cancelAnimationFrame(quadro);
    // Aba inativa: nada a animar.
    const aoVisibilidade = () => (document.hidden ? parar() : comecar());

    posicionar();
    if (!document.hidden) comecar();
    document.addEventListener("visibilitychange", aoVisibilidade);
    return () => {
      parar();
      document.removeEventListener("visibilitychange", aoVisibilidade);
    };
  }, [medidas, semMovimento]);

  const obras = medidas
    ? OBRAS_ANEL.slice(0, semMovimento ? CARDS_LEQUE : medidas.n)
    : [];

  return (
    <div className={`pointer-events-none absolute inset-0 ${className ?? ""}`}>
      <div
        ref={anelRef}
        aria-hidden
        className="absolute inset-0 select-none"
        style={{ perspective: "1200px", "--theta": "0" } as CSSProperties}
        onPointerOver={() => (alvoVelocidadeRef.current = FATOR_HOVER)}
        onPointerOut={() => (alvoVelocidadeRef.current = 1)}
      >
        {medidas &&
          obras.map((obra, i) => (
            <a
              key={obra.src}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              href={obra.href}
              tabIndex={-1}
              title="Abrir esta obra"
              draggable={false}
              className="pointer-events-auto absolute left-1/2 top-[58%] block overflow-hidden border border-palco-escuro/10 bg-areia will-change-transform"
              style={{
                width: medidas.larguraCard,
                height: Math.round(medidas.larguraCard * 1.4),
                borderRadius: "var(--raio-card)",
                ...(semMovimento
                  ? estiloLeque(i, medidas.larguraCard)
                  : { visibility: "hidden" as const }),
              }}
            >
              {/* Assets estáticos de /public — img simples basta. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={obra.src}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
            </a>
          ))}
      </div>

      {/* Alternativa real para leitores de tela — o anel acima é decorativo. */}
      <ul className="sr-only" aria-label="Obras em destaque">
        {OBRAS_ANEL.map((obra) => (
          <li key={obra.src}>
            <a href={obra.href}>{obra.alt}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
