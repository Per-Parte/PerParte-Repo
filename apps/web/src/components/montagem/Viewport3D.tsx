"use client";

/**
 * Montagem v2 · F2/F3 — viewport central: a obra fica no centro e a
 * câmera só aproxima/afasta. Quem gira a cena é a manivela do canto
 * (ManivelaCena — pedido do Davi de 06/08): a órbita livre com o cursor
 * saiu, então o cursor fica inteiro para as ferramentas. Os gestos viram
 * chamadas do modelo de cena, que só devolve contatos válidos (A1).
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PALETA, PONTO_DE_LUZ } from "@per-parte/nucleo";
import { ehPontoDeLuz, type ItemCena } from "./cena";
import { MM, geometriaDoBloco, geometriasDoPontoDeLuz } from "./geometria";
import type { Ferramenta } from "./ferramentas";

/** Cor do bulbo aceso — a mesma 2700K real da cena do configurador. */
const COR_LUZ = "#FFC478";

export interface GestosViewport {
  onSelecionar(id: number | null): void;
  /** Deltas em mm no plano da mesa (coordenadas do núcleo). */
  onMover(id: number, dxMm: number, dyMm: number): void;
  /** Delta de tamanho geral, em mm (o modelo grampeia). */
  onRedimensionar(id: number, deltaMm: number): void;
  onGirar(id: number, deltaGraus: number): void;
  /** Balde de tinta: pinta a forma tocada com a cor atual. */
  onPintar(id: number): void;
  /** Gesto terminou — hora de fechar um passo de undo. */
  onFimDeGesto(): void;
}

interface Props extends GestosViewport {
  itens: ItemCena[];
  selecionadoId: number | null;
  ferramenta: Ferramenta;
  /** Giro da cena inteira (graus), vindo da manivela. */
  giroCenaGraus: number;
}

interface Arrasto {
  id: number;
  tipo: Ferramenta;
  plano: THREE.Plane;
  ultimoPonto: THREE.Vector3;
  ultimoPx: number;
  ultimoPy: number;
  mexeu: boolean;
}

function BlocoMesh({
  item,
  selecionado,
  aoPressionar,
}: {
  item: ItemCena;
  selecionado: boolean;
  aoPressionar(e: ThreeEvent<PointerEvent>): void;
}) {
  const geometria = useMemo(
    () => geometriaDoBloco(item.params),
    [item.params]
  );
  const cor = PALETA[item.params.corIdx]?.hex ?? PALETA[0].hex;
  return (
    <group
      position={[
        item.contato.xMm / MM,
        item.contato.zBaseMm / MM,
        -item.contato.yMm / MM,
      ]}
      rotation={[0, (item.giroZGraus * Math.PI) / 180, 0]}
    >
      <mesh
        geometry={geometria}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={aoPressionar}
      >
        <meshStandardMaterial
          color={cor}
          roughness={0.55}
          metalness={0}
          emissive={selecionado ? "#3A6EA5" : "#000000"}
          emissiveIntensity={selecionado ? 0.28 : 0}
        />
      </mesh>
    </group>
  );
}

function PontoDeLuzMesh({
  item,
  selecionado,
  aoPressionar,
}: {
  item: ItemCena;
  selecionado: boolean;
  aoPressionar(e: ThreeEvent<PointerEvent>): void;
}) {
  const { base, bulbo } = useMemo(() => geometriasDoPontoDeLuz(), []);
  const alturaBulboCentro =
    (PONTO_DE_LUZ.baseAlturaMm + PONTO_DE_LUZ.bulboAlturaMm / 2) / MM;
  return (
    <group
      position={[
        item.contato.xMm / MM,
        item.contato.zBaseMm / MM,
        -item.contato.yMm / MM,
      ]}
    >
      <mesh
        geometry={base}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={aoPressionar}
      >
        <meshStandardMaterial
          color="#F4F1E8"
          roughness={0.6}
          emissive={selecionado ? "#3A6EA5" : "#000000"}
          emissiveIntensity={selecionado ? 0.3 : 0}
        />
      </mesh>
      <mesh
        geometry={bulbo}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={aoPressionar}
      >
        <meshStandardMaterial
          color={COR_LUZ}
          emissive={COR_LUZ}
          emissiveIntensity={1.8}
          roughness={0.3}
        />
      </mesh>
      {/* A poça de luz no chão vem daqui. */}
      <pointLight
        position={[0, alturaBulboCentro, 0]}
        color={COR_LUZ}
        intensity={6}
        distance={12}
        decay={1.6}
      />
    </group>
  );
}

function CenaMontagem({
  itens,
  selecionadoId,
  ferramenta,
  giroCenaGraus,
  onSelecionar,
  onMover,
  onRedimensionar,
  onGirar,
  onPintar,
  onFimDeGesto,
}: Props) {
  const { camera, gl } = useThree();
  const controles = useRef<OrbitControlsImpl>(null);
  const arrasto = useRef<Arrasto | null>(null);
  const giroRad = (giroCenaGraus * Math.PI) / 180;

  const pontoNoPlano = (
    clientX: number,
    clientY: number,
    plano: THREE.Plane
  ): THREE.Vector3 | null => {
    const r = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1
    );
    const raio = new THREE.Raycaster();
    raio.setFromCamera(ndc, camera);
    const alvo = new THREE.Vector3();
    return raio.ray.intersectPlane(plano, alvo) ? alvo : null;
  };

  /**
   * Deslocamento do MUNDO para as coordenadas do núcleo. A cena inteira
   * está girada pela manivela, então o arrasto precisa voltar ao
   * referencial local antes de virar (dx, dy) em mm — senão empurrar
   * para a direita move a peça de través.
   */
  const paraNucleoMm = (
    mundoDx: number,
    mundoDz: number
  ): { dxMm: number; dyMm: number } => {
    const cos = Math.cos(giroRad);
    const sen = Math.sin(giroRad);
    const localX = mundoDx * cos - mundoDz * sen;
    const localZ = mundoDx * sen + mundoDz * cos;
    return { dxMm: localX * MM, dyMm: -localZ * MM };
  };

  const aoMoverPonteiro = (e: PointerEvent) => {
    const a = arrasto.current;
    if (!a) return;
    a.mexeu = true;
    if (a.tipo === "mover") {
      const ponto = pontoNoPlano(e.clientX, e.clientY, a.plano);
      if (!ponto) return;
      const { dxMm, dyMm } = paraNucleoMm(
        ponto.x - a.ultimoPonto.x,
        ponto.z - a.ultimoPonto.z
      );
      a.ultimoPonto.copy(ponto);
      onMover(a.id, dxMm, dyMm);
    } else if (a.tipo === "tamanho") {
      onRedimensionar(a.id, -(e.clientY - a.ultimoPy) * 0.6);
      a.ultimoPy = e.clientY;
    } else if (a.tipo === "rotacionar") {
      onGirar(a.id, (e.clientX - a.ultimoPx) * 0.5);
      a.ultimoPx = e.clientX;
    }
  };

  const aoSoltarPonteiro = () => {
    const mexeu = arrasto.current?.mexeu ?? false;
    arrasto.current = null;
    if (controles.current) controles.current.enabled = true;
    window.removeEventListener("pointermove", aoMoverPonteiro);
    window.removeEventListener("pointerup", aoSoltarPonteiro);
    if (mexeu) onFimDeGesto();
  };

  const pressionarItem =
    (item: ItemCena) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onSelecionar(item.id);
      // Balde de tinta: tocar já pinta (é o gesto que o público espera).
      if (ferramenta === "pintar") {
        onPintar(item.id);
        return;
      }
      // Selecionar e Fatiar não arrastam: o painel da direita conduz.
      if (ferramenta === "selecionar" || ferramenta === "fatiar") return;
      if (ehPontoDeLuz(item) && ferramenta !== "mover") return;
      const yBase = item.contato.zBaseMm / MM;
      const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yBase);
      const ponto = pontoNoPlano(e.clientX, e.clientY, plano);
      arrasto.current = {
        id: item.id,
        tipo: ferramenta,
        plano,
        ultimoPonto: ponto ?? new THREE.Vector3(),
        ultimoPx: e.clientX,
        ultimoPy: e.clientY,
        mexeu: false,
      };
      if (controles.current) controles.current.enabled = false;
      window.addEventListener("pointermove", aoMoverPonteiro);
      window.addEventListener("pointerup", aoSoltarPonteiro);
    };

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} />
      <directionalLight position={[-5, 3, -4]} intensity={0.35} color="#dfe8f0" />

      {/* Chão do estúdio — recebe a poça de luz do bulbo. Fica FORA do
          giro: a mesa não gira, a obra gira sobre ela. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        onPointerDown={() => onSelecionar(null)}
      >
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#ECEAE4" roughness={0.92} metalness={0} />
      </mesh>

      {/* Todas as peças giram JUNTAS, no mesmo grupo (pedido do Davi). */}
      <group rotation={[0, giroRad, 0]}>
        {itens.map((item) =>
          ehPontoDeLuz(item) ? (
            <PontoDeLuzMesh
              key={item.id}
              item={item}
              selecionado={item.id === selecionadoId}
              aoPressionar={pressionarItem(item)}
            />
          ) : (
            <BlocoMesh
              key={item.id}
              item={item}
              selecionado={item.id === selecionadoId}
              aoPressionar={pressionarItem(item)}
            />
          )
        )}
      </group>

      {/* Sem órbita e sem pan: a obra não sai do centro (espec §2) e o
          giro é da manivela. Sobra o zoom, que é seguro para leigo. */}
      <OrbitControls
        ref={controles}
        target={[0, 0.9, 0]}
        enablePan={false}
        enableRotate={false}
        minDistance={1.2}
        maxDistance={18}
        makeDefault
      />
    </>
  );
}

export default function Viewport3D(props: Props) {
  return (
    <Canvas
      camera={{ fov: 32, position: [4.2, 3.2, 5.4], near: 0.05, far: 120 }}
      dpr={[1, 2]}
      onPointerMissed={() => props.onSelecionar(null)}
      className="h-full w-full touch-none"
    >
      <color attach="background" args={["#F6F5F1"]} />
      <CenaMontagem {...props} />
    </Canvas>
  );
}
