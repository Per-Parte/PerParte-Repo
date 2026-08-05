"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { PropsCenario } from "./tipos";

/**
 * Cenário realista: um quarto acolhedor de fim de tarde, com a obra acesa
 * sobre o cesto de vime ao lado da cama (o criado-mudo do quarto). O GLB
 * não tem luzes — o clima vem de um ambiente baixo e quente + a própria
 * obra como fonte (o point light quente que já mora na Cena3D).
 */

const ARQUIVO = "/cenarios/cenario-quarto.glb";
/** Decoder Draco self-hosted (copiado de three/examples) — sem CDN externo. */
const DRACO = "/draco/";

/** Aquece o cache do GLB em idle — a troca real continua sob Suspense. */
export function precarregarQuarto() {
  useGLTF.preload(ARQUIVO, DRACO);
}

/** Cor de fundo/névoa do quarto em função da intensidade do ambiente. */
const TONS = {
  fundoAceso: new THREE.Color("#1A1410"), // fim de tarde, quente e escuro
  fundoApagado: new THREE.Color("#070605"),
};
export function fundoQuarto(alvo: THREE.Color, s: number): THREE.Color {
  return alvo.copy(TONS.fundoApagado).lerp(TONS.fundoAceso, s);
}

/** Névoa quase ausente — só profundidade sutil; o quarto fecha o horizonte. */
export const NEVOA_QUARTO = { perto: 30, longe: 130 };

/**
 * Posicionamento (medido do JSON do GLB, sem decodificar Draco):
 * o quarto está em METROS — AABB global ~6,3 × 3,8 × 6,4 m, teto a 3,58 m.
 * A cena do configurador usa 100 mm = 1 unidade, então 1 m = 10 unidades.
 * A obra fica na ORIGEM dela; é o quarto que se move: o grupo é escalado
 * ×10 e deslocado para que o TOPO DO CESTO DE VIME ao lado da cabeceira
 * (node "Plant vase", tampa plana em y = 0,60 m, centro x = −0,505,
 * z = −3,435) caia exatamente na origem — a obra pousa nele. A planta que
 * ocupava o cesto ("Plant vase2") é ocultada para dar lugar à obra.
 */
const ESCALA = 10;
const ANCORA = { x: -0.505, y: 0.6, z: -3.435 };

/**
 * Fade do quarto inteiro: opacidade acompanha o peso do crossfade, e a
 * transparência só liga DURANTE o fade — assentado, tudo volta a opaco
 * (depthWrite segue ligado o tempo todo: o fade não vira raio-x).
 */
function aplicarFade(materiais: THREE.Material[], p: number) {
  const emFade = p < 0.999;
  for (const m of materiais) {
    if (m.transparent !== emFade) {
      m.transparent = emFade;
      m.needsUpdate = true;
    }
    m.opacity = p;
  }
}

export default function CenaQuarto({
  intensidade,
  ativo,
  reduzido,
  aoPronto,
}: PropsCenario) {
  const { scene } = useGLTF(ARQUIVO, DRACO);
  const s = useRef(1);
  const peso = useRef(0);
  const refGrupo = useRef<THREE.Group>(null);
  const refHemi = useRef<THREE.HemisphereLight>(null);
  const refSol = useRef<THREE.DirectionalLight>(null);
  /** Materiais do quarto — o crossfade anima a opacidade de todos em bloco
      (depthWrite fica ligado: o fade não vira raio-x). Vive num ref porque
      quem escreve neles a cada frame é o useFrame. */
  const refMateriais = useRef<THREE.Material[]>([]);

  useEffect(() => {
    // A planta sai do cesto (o GLTFLoader troca espaços por "_" nos nomes).
    const planta =
      scene.getObjectByName("Plant_vase2") ??
      scene.getObjectByName("Plant vase2");
    if (planta) planta.visible = false;
    // Coleciona os materiais uma vez.
    const lista = new Set<THREE.Material>();
    scene.traverse((obj) => {
      const malha = obj as THREE.Mesh;
      if (!malha.isMesh) return;
      const mats = Array.isArray(malha.material)
        ? malha.material
        : [malha.material];
      for (const m of mats) lista.add(m);
    });
    refMateriais.current = Array.from(lista);
  }, [scene]);

  // Chegou = está pronto (o Suspense só deixa renderizar com o GLB em mãos).
  useEffect(() => {
    aoPronto?.();
  }, [aoPronto]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
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

    // "Apagar a luz" no quarto: mesmo escalar — quarto de luz apagada com a
    // obra acesa (o point light da obra não passa por aqui).
    if (refHemi.current) refHemi.current.intensity = (0.04 + 0.4 * sv) * p;
    if (refSol.current) refSol.current.intensity = 0.65 * sv * p;

    aplicarFade(refMateriais.current, p);
  });

  return (
    <group ref={refGrupo} visible={false}>
      <group
        scale={ESCALA}
        position={[-ANCORA.x * ESCALA, -ANCORA.y * ESCALA, -ANCORA.z * ESCALA]}
      >
        <primitive object={scene} />
      </group>
      {/* Ambiente baixo e quente — fim de tarde entrando no quarto. */}
      <hemisphereLight ref={refHemi} args={["#CFA57E", "#241C16", 0.44]} />
      <directionalLight
        ref={refSol}
        position={[16, 20, 22]}
        intensity={0.65}
        color="#E2A163"
      />
      {/* Sombra de contato local sob a obra, sobre a tampa do cesto —
          escala curta para não apanhar a beirada da cama. */}
      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.4}
        scale={4}
        blur={2.4}
        far={1.8}
        color="#140D08"
      />
    </group>
  );
}
