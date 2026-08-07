"use client";

/**
 * Montagem v2 — viewport central, agora um ESTÚDIO FOTOGRÁFICO (itens 4
 * e 5 do plano de alterações):
 *
 * — Câmera SEM controle nenhum do usuário (zoom saiu; órbita e pan já
 *   tinham saído com a manivela): o enquadramento é AUTOMÁTICO — a
 *   câmera recua suavemente conforme a obra cresce, mantendo-a sempre
 *   inteira e do mesmo tamanho na tela. Quem gira a obra é a manivela.
 * — Fundo de estúdio conforme as referências do cofre (mood-estudio-*):
 *   ciclorama sem horizonte (névoa dissolve o chão na parede), gradiente
 *   radial de luz atrás da peça, cor saturada selecionável, sombra de
 *   contato macia e reflexo discreto no chão. Como a câmera é fixa, o
 *   gradiente é um plano atrás da obra — o "pool de luz" das fotos.
 *
 * Os gestos das ferramentas viram chamadas do modelo de cena (A1).
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, MeshReflectorMaterial } from "@react-three/drei";
import {
  PALETA,
  PONTO_DE_LUZ,
  alturaPontoDeLuzMm,
  apoioDaForma,
  larguraBrutaMm,
} from "@per-parte/nucleo";
import { ehPontoDeLuz, type ItemCena } from "./cena";
import { MM, geometriaDoBloco, geometriasDoPontoDeLuz } from "./geometria";
import type { Ferramenta } from "./ferramentas";

/** Cor do bulbo aceso — a mesma 2700K real da cena do configurador. */
const COR_LUZ = "#FFC478";

/**
 * Fundos do estúdio — as cores das referências do cofre (vinho, laranja,
 * índigo, oliva) mais o branco-gelo do estúdio v1. ⚑ provisório até a
 * paleta v1 do branding decidir as cores oficiais do estúdio.
 */
export const FUNDOS_ESTUDIO = [
  { id: "gelo", nome: "Gelo", hex: "#E9EAE8" },
  { id: "terracota", nome: "Terracota", hex: "#A44A28" },
  { id: "vinho", nome: "Vinho", hex: "#571E2C" },
  { id: "indigo", nome: "Índigo", hex: "#2B3160" },
  { id: "oliva", nome: "Oliva", hex: "#5F6247" },
] as const;

export type FundoEstudioId = (typeof FUNDOS_ESTUDIO)[number]["id"];

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
  fundoId: FundoEstudioId;
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

/** Gradiente radial do fundo: pool de luz que escurece nas bordas. */
function texturaGradiente(hex: string): THREE.CanvasTexture {
  const tela = document.createElement("canvas");
  tela.width = 512;
  tela.height = 512;
  const ctx = tela.getContext("2d")!;
  const cor = new THREE.Color(hex);
  const claro = cor.clone().lerp(new THREE.Color("#FFFFFF"), 0.32);
  const escuro = cor.clone().multiplyScalar(0.42);
  // Centro do pool um pouco acima do meio — onde a obra recorta.
  const g = ctx.createRadialGradient(256, 290, 40, 256, 290, 420);
  g.addColorStop(0, `#${claro.getHexString()}`);
  g.addColorStop(0.55, `#${cor.getHexString()}`);
  g.addColorStop(1, `#${escuro.getHexString()}`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  // A base do pano escurece até o MESMO valor da névoa (0,42×): é onde
  // o chão esfumado encosta no plano — sem isso a emenda vira uma linha.
  const rodape = ctx.createLinearGradient(0, 265, 0, 330);
  rodape.addColorStop(0, `#${escuro.getHexString()}00`);
  rodape.addColorStop(1, `#${escuro.getHexString()}ff`);
  ctx.fillStyle = rodape;
  ctx.fillRect(0, 265, 512, 512 - 265);
  const textura = new THREE.CanvasTexture(tela);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

function Estudio({ fundoId }: { fundoId: FundoEstudioId }) {
  const fundo = FUNDOS_ESTUDIO.find((f) => f.id === fundoId)!;
  const textura = useMemo(() => texturaGradiente(fundo.hex), [fundo.hex]);
  const corChao = useMemo(
    () => new THREE.Color(fundo.hex).multiplyScalar(0.82),
    [fundo.hex]
  );
  // A névoa dissolve o chão exatamente no VALOR da borda do gradiente
  // (0,42× — o mesmo `escuro` da textura): sem costura visível entre o
  // chão esfumado e o pano de fundo.
  const corNevoa = useMemo(
    () => new THREE.Color(fundo.hex).multiplyScalar(0.42),
    [fundo.hex]
  );
  const corSombra = useMemo(
    () =>
      `#${new THREE.Color(fundo.hex).multiplyScalar(0.22).getHexString()}`,
    [fundo.hex]
  );

  return (
    <>
      {/* O vazio além do pano tem a MESMA cor da névoa — nenhum ângulo
          de enquadramento revela aresta de plano contra fundo preto. */}
      <color attach="background" args={[corNevoa]} />
      {/* Névoa na cor do fundo: o chão dissolve na parede sem horizonte. */}
      <fog attach="fog" args={[corNevoa, 14, 42]} />

      {/* Fill fraco: sombra com detalhe, nunca buraco preto (receita v1). */}
      <hemisphereLight args={["#FFFFFF", "#B9B2A4", 0.5]} />
      {/* Key alta e lateral: desenha a sombra principal, borda macia VSM. */}
      <directionalLight
        castShadow
        position={[4.8, 7.2, 3.4]}
        intensity={1.5}
        color="#FFEEDA"
        shadow-mapSize={[2048, 2048]}
        shadow-radius={7}
        shadow-blurSamples={16}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {/* Contraluz fria discreta: recorta a obra contra o fundo. */}
      <directionalLight position={[-5.5, 2.5, -3.5]} intensity={0.3} color="#CFD8E2" />

      {/* O pool de luz atrás da obra — câmera fixa, o plano não denuncia.
          Grande o bastante para o recuo máximo do enquadramento automático
          nunca revelar a aresta. */}
      <mesh position={[0, 14, -30]}>
        <planeGeometry args={[260, 140]} />
        <meshBasicMaterial map={textura} fog={false} toneMapped={false} />
      </mesh>

      {/* Chão-ciclorama: fosco na cor do fundo, reflexo discreto e
          desfocado (superfície de estúdio, não espelho — receita v1). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <circleGeometry args={[90, 64]} />
        <MeshReflectorMaterial
          color={corChao}
          roughness={0.9}
          metalness={0}
          mirror={0}
          mixStrength={0.25}
          mixBlur={1}
          blur={[400, 130]}
          resolution={1024}
          depthScale={0.8}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
        />
      </mesh>

      {/* Sombra de contato macia logo abaixo da obra (as referências). */}
      <ContactShadows
        position={[0, -0.001, 0]}
        opacity={0.5}
        scale={9}
        blur={2.6}
        far={3}
        color={corSombra}
      />
    </>
  );
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
    // Ângulo fixo de catálogo: ~32° de elevação, levemente à direita.
    const d = distancia.current;
    camera.position.set(d * 0.52, alvoY.current + d * 0.5, d * 0.75);
    camera.lookAt(0, alvoY.current, 0);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

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
        castShadow
        receiveShadow
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

// ---------------------------------------------------------------------------
// A cena
// ---------------------------------------------------------------------------

function CenaMontagem({
  itens,
  selecionadoId,
  ferramenta,
  giroCenaGraus,
  fundoId,
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
      <Estudio fundoId={fundoId} />
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
