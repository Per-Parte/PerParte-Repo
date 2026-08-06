"use client";

/**
 * Montagem v2 — MANIVELA DA CENA (pedido do Davi, 06/08): a órbita livre
 * com o cursor saiu; quem gira a obra é este ícone 3D de luminária no
 * canto superior direito. Arrastar sobre ele gira TODAS as peças da cena
 * juntas — e o próprio ícone gira igual, funcionando como mostrador do
 * ângulo. Para leigos isso mata o acidente clássico do 3D livre ("perdi
 * a luminária de vista"); a câmera continua podendo aproximar e afastar.
 */

import { Canvas } from "@react-three/fiber";
import { useRef } from "react";

/** Graus de giro por pixel arrastado. ⚑ calibrado a olho no desktop. */
const GRAUS_POR_PIXEL = 0.7;

function LuminariaIcone({ giroGraus }: { giroGraus: number }) {
  return (
    <group rotation={[0, (giroGraus * Math.PI) / 180, 0]} position={[0, -0.35, 0]}>
      {/* base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.42, 0.46, 0.1, 24]} />
        <meshStandardMaterial color="#B9B3A6" roughness={0.6} />
      </mesh>
      {/* coluna */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.44, 16]} />
        <meshStandardMaterial color="#B9B3A6" roughness={0.6} />
      </mesh>
      {/* cúpula acesa */}
      <mesh position={[0, 0.72, 0]}>
        <coneGeometry args={[0.4, 0.42, 24]} />
        <meshStandardMaterial
          color="#FFC478"
          emissive="#FFC478"
          emissiveIntensity={0.85}
          roughness={0.35}
        />
      </mesh>
      {/* marca de referência: mostra de que lado a cena está virada */}
      <mesh position={[0, 0.16, 0.47]}>
        <boxGeometry args={[0.1, 0.1, 0.04]} />
        <meshStandardMaterial color="#3A6EA5" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function ManivelaCena({
  giroGraus,
  aoGirar,
  aoFimDeGesto,
}: {
  giroGraus: number;
  /** Delta em graus desde o último evento. */
  aoGirar(deltaGraus: number): void;
  aoFimDeGesto(): void;
}) {
  const ultimoX = useRef<number | null>(null);

  const aoMover = (e: PointerEvent) => {
    if (ultimoX.current == null) return;
    aoGirar((e.clientX - ultimoX.current) * GRAUS_POR_PIXEL);
    ultimoX.current = e.clientX;
  };

  const aoSoltar = () => {
    const arrastou = ultimoX.current != null;
    ultimoX.current = null;
    window.removeEventListener("pointermove", aoMover);
    window.removeEventListener("pointerup", aoSoltar);
    if (arrastou) aoFimDeGesto();
  };

  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/90 p-2 shadow-lg backdrop-blur">
      <div
        role="slider"
        aria-label="Girar a cena"
        aria-valuenow={Math.round(((giroGraus % 360) + 360) % 360)}
        aria-valuemin={0}
        aria-valuemax={360}
        tabIndex={0}
        title="Clique e arraste para girar a luminária inteira"
        onPointerDown={(e) => {
          e.preventDefault();
          ultimoX.current = e.clientX;
          window.addEventListener("pointermove", aoMover);
          window.addEventListener("pointerup", aoSoltar);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") aoGirar(-10);
          else if (e.key === "ArrowRight") aoGirar(10);
          else return;
          e.preventDefault();
          aoFimDeGesto();
        }}
        className="h-[84px] w-[84px] cursor-grab touch-none rounded-xl bg-neutral-50 active:cursor-grabbing"
      >
        <Canvas
          camera={{ fov: 30, position: [0, 0.9, 3.1] }}
          dpr={[1, 2]}
          // O ícone é decoração interativa: o gesto é do div, não do canvas.
          style={{ pointerEvents: "none" }}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[2, 3, 4]} intensity={1.3} />
          <LuminariaIcone giroGraus={giroGraus} />
        </Canvas>
      </div>
      <span className="text-[11px] font-medium text-neutral-600">Girar</span>
    </div>
  );
}
