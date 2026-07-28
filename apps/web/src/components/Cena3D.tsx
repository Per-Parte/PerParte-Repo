"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Ponto2D } from "@per-parte/nucleo";

/** Escala da cena: 100 mm = 1 unidade 3D. */
const MM = 100;

interface ParteProps {
  perfil: Ponto2D[];
  yMm: number;
  cor: string;
  segmentos: number;
  difusor?: boolean;
  luzAcesa?: boolean;
}

function Parte({
  perfil,
  yMm,
  cor,
  segmentos,
  difusor = false,
  luzAcesa = false,
}: ParteProps) {
  const pontos = useMemo(
    () => perfil.map((p) => new THREE.Vector2(p.x / MM, p.y / MM)),
    [perfil]
  );
  const facetado = segmentos <= 16;

  return (
    <mesh position={[0, yMm / MM, 0]}>
      <latheGeometry args={[pontos, segmentos]} />
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
}

export default function Cena3D({
  perfis,
  alturasMm,
  coresHex,
  segmentos,
  luzAcesa,
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
      />
      <Parte
        perfil={perfis.difusor}
        yMm={alturasMm.base + alturasMm.corpo}
        cor={coresHex.difusor}
        segmentos={segmentos}
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
