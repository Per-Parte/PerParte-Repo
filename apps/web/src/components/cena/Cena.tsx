"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CenaEstudio, { fundoEstudio, NEVOA_ESTUDIO } from "./CenaEstudio";
import CenaQuarto, {
  fundoQuarto,
  NEVOA_QUARTO,
  precarregarQuarto,
} from "./CenaQuarto";
import type { CenaId, PropsCenario } from "./tipos";

/**
 * O slot de cenários do §4.4, crescido: <Cena id={...}> resolve o cenário
 * pelo id num registro simples. O estúdio é a CENA-BASE — está sempre
 * montado e segura o palco enquanto um cenário pesado carrega; a troca só
 * consuma quando o destino avisa que está pronto, e então os dois fazem um
 * crossfade de ~300 ms (luzes/opacidade — a obra nunca desmonta nem pisca).
 */

interface DefCenario {
  Ambiente: ComponentType<PropsCenario>;
  /** Escreve em `alvo` a cor de fundo/névoa para a intensidade s (0..1). */
  fundo: (alvo: THREE.Color, s: number) => THREE.Color;
  /** Calibração da névoa deste cenário. */
  nevoa: { perto: number; longe: number };
  /** Carrega sob demanda? (Suspense + consumação adiada da troca.) */
  pesado: boolean;
}

const CENA_BASE: CenaId = "estudio";

const CENARIOS: Record<CenaId, DefCenario> = {
  estudio: {
    Ambiente: CenaEstudio,
    fundo: fundoEstudio,
    nevoa: NEVOA_ESTUDIO,
    pesado: false,
  },
  quarto: {
    Ambiente: CenaQuarto,
    fundo: fundoQuarto,
    nevoa: NEVOA_QUARTO,
    pesado: true,
  },
};

/** Cenário que falhou ao carregar não derruba o palco — fica no estúdio. */
class LimiteErroCenario extends Component<
  { children: ReactNode },
  { erro: boolean }
> {
  state = { erro: false };
  static getDerivedStateFromError() {
    return { erro: true };
  }
  render() {
    return this.state.erro ? null : this.props.children;
  }
}

export interface CenaProps {
  id: CenaId;
  /** 1 = ambiente aceso · 0,3 = seção Luz · 0 = apagado (§4.4). */
  intensidade: number;
  reduzido: boolean;
  /** Avisa a UI quando um cenário pesado ficou pronto (pill "Dando forma…"). */
  aoProntoCena?: (id: CenaId) => void;
}

export default function Cena({
  id,
  intensidade,
  reduzido,
  aoProntoCena,
}: CenaProps) {
  // Cenários pesados montam no primeiro pedido e FICAM montados: o GLB já
  // está em cache e o crossfade de volta precisa dos dois lados vivos.
  const [pedidos, setPedidos] = useState<Partial<Record<CenaId, boolean>>>({});
  if (CENARIOS[id].pesado && !pedidos[id]) {
    setPedidos((p) => ({ ...p, [id]: true }));
  }

  // A troca consuma quando o cenário avisa que está pronto.
  const [prontos, setProntos] = useState<Partial<Record<CenaId, boolean>>>({
    [CENA_BASE]: true,
  });
  const marcarPronto = useCallback(
    (idPronto: CenaId) => {
      setProntos((p) => (p[idPronto] ? p : { ...p, [idPronto]: true }));
      aoProntoCena?.(idPronto);
    },
    [aoProntoCena]
  );

  /** Alvo VISÍVEL: o pedido do visitante, ou a base enquanto ele carrega. */
  const alvo: CenaId = prontos[id] ? id : CENA_BASE;

  // Aquecimento em idle: baixa o GLB do quarto sem segurar nada — o toggle
  // encontra o cache quente (a troca em si continua lazy, sob Suspense).
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const marcador = window.requestIdleCallback(
        () => precarregarQuarto(),
        { timeout: 6000 }
      );
      return () => window.cancelIdleCallback(marcador);
    }
    const t = setTimeout(() => precarregarQuarto(), 3500);
    return () => clearTimeout(t);
  }, []);

  // Fundo e névoa são um só por cena (attach) — o crossfade lerpa entre a
  // paleta da base e a do alvo, e o interruptor (s) escurece as duas.
  const refFundo = useRef<THREE.Color>(null);
  const refNevoa = useRef<THREE.Fog>(null);
  const s = useRef(1);
  const mix = useRef(0);
  const corBase = useMemo(() => new THREE.Color(), []);
  const corAlvo = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    // λ = 5 ⇒ ~0,8 s (interruptor) · λ = 15 ⇒ ~0,3 s (troca de cena) —
    // os mesmos ritmos dos cenários: tudo assenta junto.
    s.current = reduzido
      ? intensidade
      : THREE.MathUtils.damp(s.current, intensidade, 5, dt);
    const alvoMix = alvo === CENA_BASE ? 0 : 1;
    mix.current = reduzido
      ? alvoMix
      : THREE.MathUtils.damp(mix.current, alvoMix, 15, dt);

    const outra = alvo === CENA_BASE ? CENARIOS.quarto : CENARIOS[alvo];
    CENARIOS[CENA_BASE].fundo(corBase, s.current);
    outra.fundo(corAlvo, s.current);
    refFundo.current?.copy(corBase).lerp(corAlvo, mix.current);
    if (refNevoa.current) {
      refNevoa.current.color.copy(corBase).lerp(corAlvo, mix.current);
      const { lerp } = THREE.MathUtils;
      const nBase = CENARIOS[CENA_BASE].nevoa;
      refNevoa.current.near = lerp(nBase.perto, outra.nevoa.perto, mix.current);
      refNevoa.current.far = lerp(nBase.longe, outra.nevoa.longe, mix.current);
    }
  });

  return (
    <>
      <color ref={refFundo} attach="background" args={["#F2F3F1"]} />
      <fog
        ref={refNevoa}
        attach="fog"
        args={["#F2F3F1", NEVOA_ESTUDIO.perto, NEVOA_ESTUDIO.longe]}
      />
      {(Object.keys(CENARIOS) as CenaId[]).map((idCenario) => {
        const def = CENARIOS[idCenario];
        if (def.pesado && !pedidos[idCenario]) return null;
        const ambiente = (
          <def.Ambiente
            intensidade={intensidade}
            ativo={alvo === idCenario}
            reduzido={reduzido}
            aoPronto={
              def.pesado ? () => marcarPronto(idCenario) : undefined
            }
          />
        );
        // Pesado carrega sob Suspense; enquanto isso a base segura o palco
        // (fallback null: nada pisca — o estúdio continua inteiro atrás).
        return def.pesado ? (
          <LimiteErroCenario key={idCenario}>
            <Suspense fallback={null}>{ambiente}</Suspense>
          </LimiteErroCenario>
        ) : (
          <group key={idCenario}>{ambiente}</group>
        );
      })}
    </>
  );
}
