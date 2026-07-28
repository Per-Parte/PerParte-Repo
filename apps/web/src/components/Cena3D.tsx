"use client";

import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  malhaRevolucao,
  type Ponto2D,
  type TexturaRevolucao,
} from "@per-parte/nucleo";

/** Escala da cena: 100 mm = 1 unidade 3D. */
const MM = 100;

interface ParteProps {
  perfil: Ponto2D[];
  yMm: number;
  cor: string;
  segmentos: number;
  textura?: TexturaRevolucao;
  difusor?: boolean;
  luzAcesa?: boolean;
}

/**
 * Uma parte da luminária. A geometria vem da MESMA malha que gera o STL de
 * produção (núcleo) — textura que você vê é a textura que imprime.
 */
function Parte({
  perfil,
  yMm,
  cor,
  segmentos,
  textura,
  difusor = false,
  luzAcesa = false,
}: ParteProps) {
  const geometria = useMemo(() => {
    const comGomos = !!textura && textura.gomos > 0 && segmentos >= 32;
    const seg = comGomos ? 96 : segmentos;
    const m = malhaRevolucao(perfil, seg, textura);
    const pos = new Float32Array(m.posicoes.length);
    for (let i = 0; i < m.posicoes.length; i++) pos[i] = m.posicoes[i] / MM;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(m.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [perfil, segmentos, textura]);

  useEffect(() => () => geometria.dispose(), [geometria]);

  const facetado = segmentos <= 16;

  return (
    <mesh
      geometry={geometria}
      position={[0, yMm / MM, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      {difusor ? (
        <meshStandardMaterial
          key={`dif-${facetado}-${luzAcesa}`}
          color={cor}
          roughness={0.5}
          transparent
          opacity={luzAcesa ? 0.92 : 0.68}
          side={THREE.DoubleSide}
          emissive="#F3B65B"
          emissiveIntensity={luzAcesa ? 0.55 : 0}
          flatShading={facetado}
          depthWrite={false}
        />
      ) : (
        <meshStandardMaterial
          key={`sol-${facetado}`}
          color={cor}
          roughness={0.6}
          flatShading={facetado}
        />
      )}
    </mesh>
  );
}

export interface Cena3DProps {
  perfis: { base: Ponto2D[]; corpo: Ponto2D[]; difusor: Ponto2D[] };
  alturasMm: { base: number; corpo: number; difusor: number };
  coresHex: { base: string; corpo: string; difusor: string };
  segmentos: number;
  luzAcesa: boolean;
  texturas?: { corpo?: TexturaRevolucao; difusor?: TexturaRevolucao };
}

export default function Cena3D({
  perfis,
  alturasMm,
  coresHex,
  segmentos,
  luzAcesa,
  texturas,
}: Cena3DProps) {
  const totalMm = alturasMm.base + alturasMm.corpo + alturasMm.difusor;
  const alvoY = (totalMm * 0.52) / MM;
  const lampadaY =
    (alturasMm.base + alturasMm.corpo + alturasMm.difusor * 0.45) / MM;

  return (
    <Canvas camera={{ position: [3.4, 2.6, 4.4], fov: 38 }}>
      <color attach="background" args={[luzAcesa ? "#EAE4D6" : "#ECE8DE"]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4.5, 7.2, 5.3]} intensity={1.6} />
      <directionalLight position={[-5.5, 1.5, -3.5]} intensity={0.45} />
      {luzAcesa && (
        <pointLight
          position={[0, lampadaY, 0]}
          color="#FFC478"
          intensity={6}
          distance={7}
        />
      )}

      <Parte
        perfil={perfis.base}
        yMm={0}
        cor={coresHex.base}
        segmentos={40}
      />
      <Parte
        perfil={perfis.corpo}
        yMm={alturasMm.base}
        cor={coresHex.corpo}
        segmentos={segmentos}
        textura={texturas?.corpo}
      />
      <Parte
        perfil={perfis.difusor}
        yMm={alturasMm.base + alturasMm.corpo}
        cor={coresHex.difusor}
        segmentos={segmentos}
        textura={texturas?.difusor}
        difusor
        luzAcesa={luzAcesa}
      />

      <ContactShadows opacity={0.32} scale={5} blur={2.6} far={2.5} />
      <OrbitControls
        target={[0, alvoY, 0]}
        enablePan={false}
        minDistance={2.2}
        maxDistance={9}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}
