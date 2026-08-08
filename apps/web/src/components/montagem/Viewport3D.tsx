"use client";

/**
 * Montagem v2 — viewport central: um estúdio com CENÁRIOS fotográficos
 * (item 8 do plano — as quatro referências do Davi de 08/08).
 *
 * — Câmera SEM controle do usuário: enquadramento automático (item 5);
 *   quem gira a obra é a manivela.
 * — O cenário mora em cenarios.tsx: parede com a luz bakeada (estuque,
 *   gobo de persiana/folhagem, fora-de-foco), chão de madeira com veio,
 *   quina real, foco com gobo projetado atravessando a obra. O antigo
 *   ciclorama de gradiente — a maior fonte da "cara de desenho 3D" —
 *   morreu aqui.
 * — As peças usam material FÍSICO: sheen (o falloff aveludado do PLA) e
 *   clearcoat no metálico. A cor fiel de catálogo vive no cenário
 *   Galeria; os demais têm licença artística de foto.
 *
 * Os gestos das ferramentas viram chamadas do modelo de cena (A1).
 */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  PONTO_DE_LUZ,
  alturaPontoDeLuzMm,
  apoioDaForma,
  larguraBrutaMm,
  materialDoBloco,
} from "@per-parte/nucleo";
import { ehPontoDeLuz, type ItemCena } from "./cena";
import { MM, geometriaDoBloco, geometriasDoPontoDeLuz } from "./geometria";
import { superficieDoAcabamento } from "./superficie";
import { Cenario, cenarioPorId, type CenarioId } from "./cenarios";
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
  cenarioId: CenarioId;
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

// ---------------------------------------------------------------------------
// Estúdio
// ---------------------------------------------------------------------------

/**
 * Ambiente de reflexo — entregue SÓ ao acabamento metálico, nunca à cena
 * inteira. Metal precisa de mundo em volta para brilhar (sem reflexo ele
 * lê como plástico escuro), mas o `RoomEnvironment` do three é uma sala
 * com luminárias de valor ~50: como ambiente global ele injetava umas
 * três vezes a irradiância pretendida, e aí o tone mapping ACES comprimia
 * os canais altos e DESATURAVA a peça — o Limão (#E2E071) saía #EEEDCE,
 * quase branco. Num configurador isso é mentira cara: o cliente escolhe
 * o filamento pela cor que vê. Então o fosco fica só com as luzes (cor
 * verdadeira) e o metálico ganha a sala como envMap próprio.
 *
 * É procedural: nenhum HDRI para baixar, nenhum asset no repo.
 */
function useAmbienteMetalico(): THREE.Texture | null {
  const { gl } = useThree();
  // A sala é gerada UMA vez, na primeira renderização com este renderer
  // (useMemo e não efeito com setState: o valor já existe no primeiro
  // quadro, então a peça metálica nunca pisca sem reflexo).
  const ambiente = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const sala = new RoomEnvironment();
    const alvo = pmrem.fromScene(sala, 0.04);
    pmrem.dispose();
    sala.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    return alvo.texture;
  }, [gl]);
  useEffect(() => () => ambiente.dispose(), [ambiente]);
  return ambiente;
}

/**
 * Enquadramento automático (item 5): a câmera não tem controle nenhum —
 * ela recua/avança sozinha, com amortecimento, para a obra caber sempre
 * com a mesma folga. O usuário nunca "perde" a luminária.
 */
function CameraEnquadrada({ itens }: { itens: ItemCena[] }) {
  const { camera } = useThree();
  const distancia = useRef(7);
  const alvoY = useRef(0.9);

  // Esfera envolvente da obra, em unidades da cena. O ponto de luz não
  // tem primitivo registrado — as medidas dele vêm das constantes.
  let alturaMax = 1.2;
  let raioMax = 0.8;
  for (const item of itens) {
    const luz = ehPontoDeLuz(item);
    const topo = luz
      ? item.contato.zBaseMm + alturaPontoDeLuzMm()
      : item.contato.zBaseMm +
        apoioDaForma(item.params.forma).alturaTopoMm(item.params);
    const meiaLargura = luz
      ? PONTO_DE_LUZ.bulboRaioMm
      : (larguraBrutaMm(item.params) / 2) * Math.SQRT2;
    const raio =
      Math.hypot(item.contato.xMm, item.contato.yMm) + meiaLargura;
    alturaMax = Math.max(alturaMax, topo / MM);
    raioMax = Math.max(raioMax, raio / MM);
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const raioCena = Math.max(alturaMax * 0.62, raioMax * 1.15);
    const alvoDist = Math.max(4.2, raioCena * 3.6);
    const alvoAltura = Math.max(0.7, alturaMax * 0.5);
    distancia.current = THREE.MathUtils.damp(
      distancia.current,
      alvoDist,
      3,
      dt
    );
    alvoY.current = THREE.MathUtils.damp(alvoY.current, alvoAltura, 3, dt);
    // Câmera de FOTO de produto: baixa (~14° de elevação), quase no
    // nível da mesa — é o ângulo de todas as referências, e é ele que
    // põe a PAREDE como fundo em vez de encher o quadro de chão.
    const d = distancia.current;
    camera.position.set(d * 0.42, alvoY.current + d * 0.26, d * 0.88);
    camera.lookAt(0, alvoY.current + d * 0.02, 0);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function BlocoMesh({
  item,
  selecionado,
  ambienteMetalico,
  aoPressionar,
}: {
  item: ItemCena;
  selecionado: boolean;
  ambienteMetalico: THREE.Texture | null;
  aoPressionar(e: ThreeEvent<PointerEvent>): void;
}) {
  const geometria = useMemo(
    () => geometriaDoBloco(item.params),
    [item.params]
  );
  // Cor E acabamento vêm do material: a trama fina do plástico impresso
  // (fosco) ou o cintilar das partículas (metálico) — item 7 do plano.
  const material = materialDoBloco(item.params.corIdx);
  const superficie = useMemo(
    () => superficieDoAcabamento(material.acabamento),
    [material.acabamento]
  );
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
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={material.hex}
          roughness={superficie.roughness}
          roughnessMap={superficie.roughnessMap}
          metalness={superficie.metalness}
          normalMap={superficie.normalMap}
          normalScale={superficie.normalScale}
          envMap={material.acabamento === "metalico" ? ambienteMetalico : null}
          envMapIntensity={superficie.envMapIntensity}
          sheen={superficie.sheen}
          sheenRoughness={superficie.sheenRoughness}
          sheenColor="#FFFFFF"
          clearcoat={superficie.clearcoat}
          clearcoatRoughness={superficie.clearcoatRoughness}
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
        castShadow
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
      {/* A luz REAL do bulbo: decay físico e intensidade para acender a
          cúpula abaixo, o pedestal e a poça no chão — "emissivo que não
          ilumina nada" foi o achado unânime da crítica visual. */}
      <pointLight
        position={[0, alturaBulboCentro, 0]}
        color={COR_LUZ}
        intensity={26}
        distance={9}
        decay={2}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// A cena
// ---------------------------------------------------------------------------

function CenaMontagem({
  itens,
  selecionadoId,
  ferramenta,
  giroCenaGraus,
  cenarioId,
  onSelecionar,
  onMover,
  onRedimensionar,
  onGirar,
  onPintar,
  onFimDeGesto,
}: Props) {
  const { camera, gl } = useThree();
  const arrasto = useRef<Arrasto | null>(null);
  const giroRad = (giroCenaGraus * Math.PI) / 180;
  const ambienteMetalico = useAmbienteMetalico();

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
   * Deslocamento do MUNDO para as coordenadas do núcleo (a cena inteira
   * gira pela manivela — o arrasto volta ao referencial local antes de
   * virar mm, senão empurrar para a direita move a peça de través).
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
      window.addEventListener("pointermove", aoMoverPonteiro);
      window.addEventListener("pointerup", aoSoltarPonteiro);
    };

  return (
    <>
      <Cenario config={cenarioPorId(cenarioId)} />
      <CameraEnquadrada itens={itens} />

      {/* Todas as peças giram JUNTAS, no mesmo grupo (manivela). */}
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
              ambienteMetalico={ambienteMetalico}
              aoPressionar={pressionarItem(item)}
            />
          )
        )}
      </group>
    </>
  );
}

export default function Viewport3D(props: Props) {
  return (
    <Canvas
      shadows="variance"
      camera={{ fov: 32, position: [4.2, 3.2, 5.4], near: 0.05, far: 120 }}
      dpr={[1, 2]}
      onPointerMissed={() => props.onSelecionar(null)}
      className="h-full w-full touch-none"
    >
      <CenaMontagem {...props} />
    </Canvas>
  );
}
