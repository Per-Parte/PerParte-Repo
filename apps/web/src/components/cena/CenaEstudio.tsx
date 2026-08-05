"use client";

import { useRef, useSyncExternalStore, type ComponentRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import type { PropsCenario } from "./tipos";

/**
 * Estúdio "branco gelo": ciclorama infinito levemente frio onde o visitante
 * julga a COR da luz e o DESENHO da sombra da obra, como numa loja boa. O
 * contraste-marca é a poça de luz QUENTE da própria obra contra o chão frio.
 */

/** Tons do estúdio aceso e apagado (o interruptor do §4.4 lerpa entre eles). */
const TONS = {
  fundoClaro: new THREE.Color("#F2F3F1"), // branco gelo, levemente frio
  fundoEscuro: new THREE.Color("#0d0c0b"), // quase-preto do apagar a luz
  chaoClaro: new THREE.Color("#F2F3F1"), // chão na cor do fundo — ciclorama
  chaoEscuro: new THREE.Color("#141110"), // um fio acima: a obra poça nele
};

/** Cor de fundo/névoa do estúdio em função da intensidade do ambiente. */
export function fundoEstudio(alvo: THREE.Color, s: number): THREE.Color {
  return alvo.copy(TONS.fundoEscuro).lerp(TONS.fundoClaro, s);
}

/**
 * Névoa na MESMA cor do fundo: o chão dissolve no horizonte sem linha dura.
 * near > distância máxima da câmera (9) — a obra nunca entra na névoa.
 */
export const NEVOA_ESTUDIO = { perto: 9, longe: 26 };

/** Telas pequenas degradam o reflexo (resolution menor) por performance (§5). */
function useTelaPequena() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );
}

export default function CenaEstudio({
  intensidade,
  ativo,
  reduzido,
}: PropsCenario) {
  const telaPequena = useTelaPequena();
  /** Intensidade corrente do ambiente (interruptor/seção Luz, ~800 ms). */
  const s = useRef(1);
  /** Peso corrente do crossfade de cena (~300 ms). */
  const peso = useRef(1);
  const refGrupo = useRef<THREE.Group>(null);
  const refHemi = useRef<THREE.HemisphereLight>(null);
  const refChave = useRef<THREE.DirectionalLight>(null);
  const refContra = useRef<THREE.DirectionalLight>(null);
  const refChao = useRef<ComponentRef<typeof MeshReflectorMaterial>>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    // λ = 5 ⇒ ~0,8 s (interruptor) · λ = 15 ⇒ ~0,3 s (troca de cena).
    s.current = reduzido
      ? intensidade
      : THREE.MathUtils.damp(s.current, intensidade, 5, dt);
    peso.current = reduzido
      ? (ativo ? 1 : 0)
      : THREE.MathUtils.damp(peso.current, ativo ? 1 : 0, 15, dt);
    const sv = s.current;
    const p = peso.current;

    if (refGrupo.current) refGrupo.current.visible = p > 0.001;
    if (p <= 0.001) return;

    // Luzes escurecem com o interruptor E desvanecem na troca de cena — a
    // obra nunca pisca: enquanto o estúdio apaga, o quarto acende em par.
    if (refHemi.current) refHemi.current.intensity = (0.03 + 0.5 * sv) * p;
    if (refChave.current) refChave.current.intensity = (0.05 + 1.5 * sv) * p;
    if (refContra.current) refContra.current.intensity = 0.3 * sv * p;

    const chao = refChao.current;
    if (chao) {
      chao.color.copy(TONS.chaoEscuro).lerp(TONS.chaoClaro, sv);
      chao.opacity = p;
      // transparente só DURANTE o fade — opaco assentado evita sorting ruim.
      const emFade = p < 0.999;
      if (chao.transparent !== emFade) {
        chao.transparent = emFade;
        chao.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={refGrupo}>
      {/* Fill fraco: sombra cinza-quente com detalhe, nunca buraco preto. */}
      <hemisphereLight ref={refHemi} args={["#FFFFFF", "#E4E0D6", 0.53]} />
      {/* A key alta e lateral (~45°) desenha a sombra principal — VSM com
          radius/blurSamples dá a borda macia de softbox de loja. */}
      <directionalLight
        ref={refChave}
        castShadow
        position={[4.8, 7.2, 3.4]}
        intensity={1.55}
        color="#FFEEDA"
        shadow-mapSize={[2048, 2048]}
        shadow-radius={7}
        shadow-blurSamples={16}
        shadow-camera-near={1}
        shadow-camera-far={26}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      {/* Contraluz fria discreta: modela a obra contra o branco gelo. */}
      <directionalLight
        ref={refContra}
        position={[-5.5, 2.5, -3.5]}
        intensity={0.3}
        color="#CFD8E2"
      />
      {/* Chão-ciclorama: fosco na cor do fundo, com reflexo discreto e
          desfocado (superfície de estúdio, não espelho) — a névoa o dissolve
          muito antes da borda. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <circleGeometry args={[90, 64]} />
        <MeshReflectorMaterial
          ref={refChao}
          color="#F2F3F1"
          roughness={0.92}
          metalness={0}
          mirror={0}
          mixStrength={0.2}
          mixBlur={1}
          blur={[400, 130]}
          resolution={telaPequena ? 512 : 1024}
          depthScale={0.8}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Sombra de contato: acompanha os sliders em tempo real (o drei
          re-renderiza a cada frame por padrão — frames = Infinity). */}
      <ContactShadows
        position={[0, -0.001, 0]}
        opacity={0.35}
        scale={7.5}
        blur={2.5}
        far={2.6}
        color="#2A241B"
      />
    </group>
  );
}
