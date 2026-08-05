"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ComponentRef,
  type RefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Cena from "./cena/Cena";
import type { CenaId } from "./cena/tipos";
import ControladorGestos from "./manipulacao/ControladorGestos";
import type { MarcaParte } from "./manipulacao/estado";
import {
  ASSENTO_PASTILHA_MM,
  deslocamentoEspinhaMm,
  ENCAIXES,
  facetasParaBase,
  facetasParaCorpo,
  facetasParaDifusor,
  facetasParaEstrutural,
  malhaCabecaInclinada,
  malhaPlaca,
  malhaRevolucao,
  mascaraVazado,
  medidasJunta,
  modulaPorTheta,
  perfilPastilhaMacho,
  type CorteBorda,
  type EspinhaLateral,
  type FacetasRevolucao,
  type JuntaInclinada,
  type ParametrosDifusor,
  type ParametrosPlaca,
  type ParametrosVazado,
  type Ponto2D,
  type TexturaRevolucao,
} from "@per-parte/nucleo";

/** Escala da cena: 100 mm = 1 unidade 3D. */
const MM = 100;

/** prefers-reduced-motion como store externo — sem setState em effect (§6). */
function useMovimentoReduzido() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** Pose de câmera de uma seção do painel (§4.3). */
interface PoseCamera {
  /** Altura do alvo, em unidades de cena (o alvo fica no eixo da obra). */
  alvoY: number;
  /** Distância da câmera ao alvo. */
  dist: number;
  /** Ângulo polar (π/2 = à altura do alvo; menor = câmera mais alta). */
  phi: number;
  /** Órbita lenta contínua (seção Cor & acabamento). */
  orbita?: boolean;
}

/** Velocidade da órbita contínua — uma volta a cada ~80 s. */
const ORBITA_RAD_S = 0.08;

/**
 * Scroll-driven camera (§4.3): a cada frame, lerpa com damping (~0,8 s até
 * assentar) a posição e o alvo rumo à pose da seção ativa — nunca corta
 * seco. Os OrbitControls seguem ativos: o evento start deles suspende o
 * autoenquadramento por 4 s, e o próximo scroll do painel re-sincroniza.
 */
function CameraRig({
  pose,
  controlesRef,
  suspensoAteRef,
  sinalRolagemRef,
  reduzido,
}: {
  pose: PoseCamera;
  controlesRef: RefObject<ComponentRef<typeof OrbitControls> | null>;
  /** Instante (performance.now) até o qual o arrasto manual manda. */
  suspensoAteRef: RefObject<number>;
  /** Contador que avança a cada scroll do painel — re-sincroniza a câmera. */
  sinalRolagemRef?: RefObject<number>;
  reduzido: boolean;
}) {
  const esf = useRef(new THREE.Spherical());
  const vetor = useRef(new THREE.Vector3());
  const ultimoSinal = useRef(0);

  useFrame(({ camera }, delta) => {
    const c = controlesRef.current;
    if (!c) return;
    if (sinalRolagemRef && sinalRolagemRef.current !== ultimoSinal.current) {
      ultimoSinal.current = sinalRolagemRef.current;
      suspensoAteRef.current = 0; // o scroll re-sincroniza na hora
    }
    if (performance.now() < suspensoAteRef.current) return;

    const dt = Math.min(delta, 0.1);
    esf.current.setFromVector3(
      vetor.current.copy(camera.position).sub(c.target)
    );
    // O azimute é do visitante (fica onde ele deixou); só a órbita o move.
    if (pose.orbita && !reduzido) esf.current.theta -= ORBITA_RAD_S * dt;

    // Reduzido = transição rápida entre poses fixas, sem lerp longo (§6).
    const l = reduzido ? 40 : 5;
    const { damp } = THREE.MathUtils;
    c.target.set(
      damp(c.target.x, 0, l, dt),
      damp(c.target.y, pose.alvoY, l, dt),
      damp(c.target.z, 0, l, dt)
    );
    esf.current.radius = damp(esf.current.radius, pose.dist, l, dt);
    esf.current.phi = damp(esf.current.phi, pose.phi, l, dt);
    esf.current.makeSafe();
    camera.position.setFromSpherical(esf.current).add(c.target);
    camera.lookAt(c.target);
  });

  return null;
}

interface ParteProps {
  perfil: Ponto2D[];
  yMm: number;
  xMm?: number;
  giroY?: number;
  cor: string;
  segmentos: number;
  textura?: TexturaRevolucao;
  espinha?: EspinhaLateral;
  difusor?: boolean;
  luzAcesa?: boolean;
  /** Vazado (preview): furos recortados por textura alpha, sem tocar a malha. */
  vazado?: ParametrosVazado;
  /** Facetas geométricas na lateral (encaixes ficam redondos — F5). */
  facetas?: FacetasRevolucao;
  /** Corte da borda livre (z(θ)): oblíquo ou dentes — só no difusor. */
  corte?: CorteBorda;
  /** Marca da parte para o raycast da manipulação direta (userData.pp). */
  marca?: MarcaParte;
}

/**
 * Uma parte da luminária. A geometria vem da MESMA malha que gera o STL de
 * produção (núcleo) — o que você vê é o que imprime.
 */
function Parte({
  perfil,
  yMm,
  xMm = 0,
  giroY = 0,
  cor,
  segmentos,
  textura,
  espinha,
  difusor = false,
  luzAcesa = false,
  vazado,
  facetas,
  corte,
  marca,
}: ParteProps) {
  const geometria = useMemo(() => {
    // Facetado/squircle é um estilo próprio e desliga a textura (regra
    // existente). ESTICAR é seção, não acabamento: a textura continua
    // esculpindo por cima da elipse (auditoria 05/08, B2). A malha fica
    // fina sempre que há modulação, para o encaixe sair redondo.
    const comModulacao = modulaPorTheta(facetas);
    const comFacetasDuras =
      !!facetas && (facetas.lados >= 3 || (facetas.expoente ?? 0) > 2);
    const comTextura =
      !comFacetasDuras &&
      !!textura &&
      textura.profundidadeMm > 0 &&
      segmentos >= 32 &&
      (textura.familia && textura.familia !== "gomos"
        ? (textura.repeticao ?? 0) > 0
        : textura.gomos > 0);
    const seg = comModulacao || comTextura ? 96 : segmentos;
    const m = malhaRevolucao(
      perfil,
      seg,
      comFacetasDuras ? undefined : textura,
      espinha,
      facetas,
      corte
    );
    const pos = new Float32Array(m.posicoes.length);
    for (let i = 0; i < m.posicoes.length; i++) pos[i] = m.posicoes[i] / MM;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(m.indices, 1));
    g.computeVertexNormals();
    if (vazado) {
      // UVs para a máscara de vazado: u dá a volta, v sobe a peça.
      // A ordem dos vértices é a da malhaRevolucao: anel a anel + 2 ápices.
      const nAneis = perfil.length;
      const yMax = Math.max(...perfil.map((p) => p.y), 1);
      const uv = new Float32Array((nAneis * seg + 2) * 2);
      for (let j = 0; j < nAneis; j++) {
        for (let i = 0; i < seg; i++) {
          const k = (j * seg + i) * 2;
          uv[k] = i / seg;
          uv[k + 1] = perfil[j].y / yMax;
        }
      }
      uv[nAneis * seg * 2 + 1] = 0;
      uv[nAneis * seg * 2 + 3] = 1;
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    return g;
  }, [perfil, segmentos, textura, espinha, vazado, facetas, corte]);

  useEffect(() => () => geometria.dispose(), [geometria]);

  // A máscara do vazado vira textura alpha: furo = transparente. A malha de
  // produção não é tocada — vazado impresso aguarda booleanos no núcleo ⚑.
  const mapaVazado = useMemo(() => {
    if (!vazado) return null;
    const lateral = perfil.filter((p) => p.y >= 0);
    const yMax = Math.max(...lateral.map((p) => p.y), 1);
    const rMedio =
      lateral.reduce((s, p) => s + p.x, 0) / Math.max(1, lateral.length);
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 256;
    const ctx = cv.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#000";
    for (let py = 0; py < cv.height; py++) {
      const v = 1 - py / (cv.height - 1);
      for (let px = 0; px < cv.width; px++) {
        if (mascaraVazado(vazado, px / cv.width, v, rMedio, yMax)) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }, [vazado, perfil]);

  useEffect(() => () => mapaVazado?.dispose(), [mapaVazado]);

  // Sombreamento chapado só nas faces planas — a superelipse é suave.
  const facetado = segmentos <= 16 || (!!facetas && facetas.lados >= 3);

  return (
    <group position={[xMm / MM, yMm / MM, 0]} rotation={[0, giroY, 0]}>
      <mesh
        castShadow
        geometry={geometria}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={marca ? { pp: marca } : undefined}
      >
        {difusor ? (
          <meshStandardMaterial
            key={`dif-${facetado}-${luzAcesa}-${mapaVazado ? "vaz" : "solido"}`}
            color={cor}
            roughness={0.5}
            transparent
            opacity={luzAcesa ? 0.95 : 0.68}
            side={THREE.DoubleSide}
            emissive="#F6E7C4"
            emissiveIntensity={luzAcesa ? 0.85 : 0}
            flatShading={facetado}
            depthWrite={false}
            alphaMap={mapaVazado ?? undefined}
            alphaTest={mapaVazado ? 0.5 : 0}
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
    </group>
  );
}

/**
 * O refletor (PLACA): disco de revolução deitado + pescoço, malha vinda
 * inteira do núcleo — a mesma que vira STL.
 */
function PartePlaca({
  placa,
  xMm,
  yMm,
  cor,
  marca,
}: {
  placa: ParametrosPlaca;
  xMm: number;
  yMm: number;
  cor: string;
  /** Marca da parte para o raycast da manipulação direta (userData.pp). */
  marca?: MarcaParte;
}) {
  const geometria = useMemo(() => {
    const m = malhaPlaca(placa, 96);
    const pos = new Float32Array(m.posicoes.length);
    for (let i = 0; i < m.posicoes.length; i++) pos[i] = m.posicoes[i] / MM;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(m.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [placa]);
  useEffect(() => () => geometria.dispose(), [geometria]);
  return (
    <group position={[xMm / MM, yMm / MM, 0]}>
      <mesh
        castShadow
        geometry={geometria}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={marca ? { pp: marca } : undefined}
      >
        <meshStandardMaterial color={cor} roughness={0.55} />
      </mesh>
    </group>
  );
}

/**
 * A cabeça inclinada (junta do Gio Task): pescoço com a fêmea + difusor
 * girado e deslocado — malha inteira do núcleo, a mesma do STL.
 */
function ParteCabecaInclinada({
  difusor,
  junta,
  xMm,
  yMm,
  cor,
  luzAcesa,
  marca,
}: {
  difusor: ParametrosDifusor;
  junta: JuntaInclinada;
  xMm: number;
  yMm: number;
  cor: string;
  luzAcesa: boolean;
  /** Marca da parte para o raycast da manipulação direta (userData.pp). */
  marca?: MarcaParte;
}) {
  const geometria = useMemo(() => {
    const m = malhaCabecaInclinada(difusor, junta, 96);
    const pos = new Float32Array(m.posicoes.length);
    for (let i = 0; i < m.posicoes.length; i++) pos[i] = m.posicoes[i] / MM;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(m.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [difusor, junta]);
  useEffect(() => () => geometria.dispose(), [geometria]);
  return (
    <group position={[xMm / MM, yMm / MM, 0]}>
      <mesh
        castShadow
        geometry={geometria}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={marca ? { pp: marca } : undefined}
      >
        <meshStandardMaterial
          color={cor}
          roughness={0.5}
          transparent
          opacity={luzAcesa ? 0.95 : 0.68}
          side={THREE.DoubleSide}
          emissive="#F6E7C4"
          emissiveIntensity={luzAcesa ? 0.85 : 0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export interface Cena3DProps {
  perfis: {
    base: Ponto2D[];
    corpo: Ponto2D[];
    difusor: Ponto2D[];
    /** Pilha entre a base e o corpo, de baixo para cima. */
    estruturais?: Ponto2D[][];
  };
  alturasMm: {
    base: number;
    corpo: number;
    difusor: number;
    estruturais?: number[];
  };
  coresHex: {
    base: string;
    corpo: string;
    difusor: string;
    estruturais?: string[];
  };
  segmentos: number;
  luzAcesa: boolean;
  texturas?: { corpo?: TexturaRevolucao; difusor?: TexturaRevolucao };
  espinhaCorpo?: EspinhaLateral;
  pontosDeLuz?: number;
  separacaoMm?: number;
  /** Vazado do difusor (preview). */
  vazadoDifusor?: ParametrosVazado;
  /** Superelipse (squircle): expoente do acabamento, quando escolhido. */
  expoente?: number;
  /** ESTICAR: proporção da seção (1 = redonda; <1 = oval/retângulo). */
  proporcao?: number;
  /** Corte da borda livre do difusor (oblíquo/dentes). */
  corteDifusor?: CorteBorda;
  /** Corte da borda da GOLA do corpo (o berço do Weight). */
  corteCorpo?: CorteBorda;
  /** Refletor (PLACA) na segunda coluna — o gesto do eclipse. */
  placa?: ParametrosPlaca | null;
  /** Cabeça inclinada (junta do Gio Task): substitui o difusor reto. */
  difusorInclinado?: { difusor: ParametrosDifusor; junta: JuntaInclinada };
  /** Assento real das pastilhas: y da superfície da base no raio delas. */
  superficieBaseMm?: number;
  /** Seção ativa do painel (data-secao) — define a pose da câmera (§4.3). */
  secaoAtiva?: string;
  /** Estúdio aceso? false = "apagar a luz do ambiente" (§4.4). */
  ambienteAceso?: boolean;
  /** Contador que avança a cada scroll do painel — re-sincroniza a câmera. */
  sinalRolagem?: RefObject<number>;
  /** Cenário ao redor da obra (§4.4) — persiste fora do ?c=. */
  cena?: CenaId;
  /** Avisa a UI quando um cenário carregado sob demanda ficou pronto. */
  aoProntoCena?: (id: CenaId) => void;
}

export default function Cena3D({
  perfis,
  alturasMm,
  coresHex,
  segmentos,
  luzAcesa,
  texturas,
  espinhaCorpo,
  pontosDeLuz = 1,
  separacaoMm = 0,
  vazadoDifusor,
  expoente,
  proporcao,
  corteDifusor,
  corteCorpo,
  placa,
  difusorInclinado,
  superficieBaseMm,
  secaoAtiva,
  ambienteAceso = true,
  sinalRolagem,
  cena = "estudio",
  aoProntoCena,
}: Cena3DProps) {
  const reduzido = useMovimentoReduzido();
  const refControles = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  /** Até quando o arrasto manual suspende o autoenquadramento (§4.3). */
  const suspensoAte = useRef(0);
  // Duas colunas: 2 luzes OU luz + refletor (a placa ocupa a segunda).
  const comPlaca = !!placa;
  const duo = pontosDeLuz === 2 || comPlaca;
  const meiaSepMm = duo ? separacaoMm / 2 : 0;

  // A pilha de estruturais vive entre a base e o corpo — soma altura a
  // tudo que está acima dela. Nas composições duplas a coluna assenta no
  // TOPO DA PASTILHA (laje − afundamento), não na face da base (A6).
  const assentoMm = duo ? ASSENTO_PASTILHA_MM : 0;
  const altEstruturais = alturasMm.estruturais ?? [];
  const totalEstrMm = altEstruturais.reduce((s, h) => s + h, 0);
  // Onde a coluna assenta: a SUPERFICIE real da base no raio das
  // pastilhas (no ombro/cone o topo nominal fica acima dela) + a laje.
  const ySuperficieMm = superficieBaseMm ?? alturasMm.base;
  const yColunaMm = (duo ? ySuperficieMm : alturasMm.base) + assentoMm;
  const yCorpoMm = yColunaMm + totalEstrMm;
  const totalMm = yCorpoMm + alturasMm.corpo + alturasMm.difusor;
  // Com refletor, o topo do disco pode passar da coluna de luz — "obra
  // inteira" precisa cobrir a placa também (§4.3).
  const topoPlacaMm = placa
    ? yColunaMm +
      placa.pescocoMm +
      2 * placa.raioMm * Math.cos((placa.inclinacaoGraus * Math.PI) / 180)
    : 0;
  const totalGeralMm = Math.max(totalMm, topoPlacaMm);
  // A lâmpada mora no MIOLO da cabeça — que, inclinada, sobe o pescoço e
  // acompanha o giro (A5: antes o clarão nascia no pescoço, "luz dupla").
  const cabeca = difusorInclinado
    ? medidasJunta(difusorInclinado.difusor, difusorInclinado.junta)
    : null;
  const lampadaY =
    (yCorpoMm +
      alturasMm.corpo +
      (cabeca
        ? cabeca.zCentroMm +
          Math.cos(cabeca.rad) * difusorInclinado!.difusor.alturaMm * 0.45
        : alturasMm.difusor * 0.45)) /
    MM;

  const dxTopoMm = espinhaCorpo
    ? deslocamentoEspinhaMm(alturasMm.corpo, espinhaCorpo)
    : 0;

  const perfilPastilha = useMemo(
    () => (duo ? perfilPastilhaMacho(ENCAIXES.baseCorpo.anel) : null),
    [duo]
  );

  // Poses da câmera por seção (§4.3), derivadas das medidas reais da obra —
  // alvo e distâncias acompanham obra alta/baixa, duas colunas e refletor.
  const poses = useMemo<Record<string, PoseCamera>>(() => {
    const raioMaxMm = Math.max(
      ...perfis.base.map((p) => p.x),
      ...perfis.corpo.map((p) => p.x),
      ...perfis.difusor.map((p) => p.x),
      ...(perfis.estruturais ?? []).flat().map((p) => p.x),
      placa?.raioMm ?? 0,
      1
    );
    const alturaU = totalGeralMm / MM;
    const larguraU = (2 * (raioMaxMm + meiaSepMm + Math.abs(dxTopoMm))) / MM;
    const clamp = THREE.MathUtils.clamp;
    // Enquadramento com fov 38°: a câmera assenta LONGE por padrão — quem
    // aproxima é o usuário, pelo zoom (pedido do Davi, 05/08).
    const longe = clamp(Math.max(2.0 * alturaU, 1.5 * larguraU, 4.4), 4.4, 11);
    const media = clamp(0.74 * longe, 3.7, 8.6);
    const perto = clamp(0.62 * longe, 3.2, 7.2);
    const alvoObra = (totalGeralMm * 0.52) / MM;
    const yCorpoU = yCorpoMm / MM;
    return {
      // mira a base · perto · baixa (contra-plongée leve)
      base: { alvoY: (alturasMm.base * 0.55) / MM, dist: perto, phi: 1.6 },
      // mira o meio · média · à altura do corpo
      corpo: {
        alvoY: yCorpoU + (alturasMm.corpo * 0.5) / MM,
        dist: media,
        phi: Math.PI / 2,
      },
      // mira o difusor · perto · alta
      difusor: {
        alvoY: yCorpoU + (alturasMm.corpo + alturasMm.difusor * 0.55) / MM,
        dist: perto,
        phi: 1.05,
      },
      // obra inteira · longe · levemente alta · órbita lenta contínua
      cor: { alvoY: alvoObra, dist: longe, phi: 1.25, orbita: true },
      // obra inteira · média (o ambiente escurece 70% via luzEstudio)
      luz: { alvoY: alvoObra, dist: media, phi: 1.35 },
      // obra inteira · longe · neutra
      regras: { alvoY: alvoObra, dist: longe, phi: 1.47 },
      // publicar (modo Inventar): a obra inteira em vitrine
      publicar: { alvoY: alvoObra, dist: longe, phi: 1.3 },
    };
  }, [perfis, placa, totalGeralMm, meiaSepMm, dxTopoMm, yCorpoMm, alturasMm]);
  const pose = poses[secaoAtiva ?? ""] ?? poses.regras;

  // O estúdio: aceso · a 30% na seção Luz (o glow protagoniza, §4.3) ·
  // apagado de vez pelo interruptor (§4.4) — o mesmo mecanismo nos três.
  const luzEstudio = !ambienteAceso ? 0 : secaoAtiva === "luz" ? 0.3 : 1;

  // Acabamento por θ (facetas ≤16 segmentos OU squircle): a lateral vira
  // prisma/superelipse com os encaixes redondos — a janela vem do núcleo.
  // A base e a pilha modulam JUNTO (fase 2 do EXT): "modula o corpo mas
  // não a base" é meio-estado que o cliente lê como defeito.
  const lados = segmentos <= 16 ? segmentos : 0;
  const comTheta = lados > 0 || (expoente ?? 0) > 2 || (proporcao ?? 1) < 0.999;
  const facetasCorpo = useMemo(
    () =>
      comTheta
        ? facetasParaCorpo(lados, alturasMm.corpo, expoente, proporcao)
        : undefined,
    [comTheta, lados, alturasMm.corpo, expoente, proporcao]
  );
  const facetasDifusor = useMemo(
    () =>
      comTheta
        ? facetasParaDifusor(lados, alturasMm.difusor, expoente, proporcao)
        : undefined,
    [comTheta, lados, alturasMm.difusor, expoente, proporcao]
  );
  const facetasBase = useMemo(
    () =>
      comTheta ? facetasParaBase(lados, alturasMm.base, expoente, proporcao) : undefined,
    [comTheta, lados, alturasMm.base, expoente, proporcao]
  );
  const chaveEstruturais = altEstruturais.join(",");
  const facetasEstruturais = useMemo(
    () =>
      comTheta && chaveEstruturais
        ? chaveEstruturais
            .split(",")
            .map((h) => facetasParaEstrutural(lados, Number(h), expoente, proporcao))
        : undefined,
    [comTheta, lados, chaveEstruturais, expoente, proporcao]
  );

  // Posições X das colunas DE LUZ (corpo + difusor + lâmpada), em mm.
  // Com refletor, a coluna de luz fica na frente (+X) e a placa atrás (−X).
  // col = coluna da marca de manipulação (−1 | 0 | 1): 0 quando só há uma;
  // com refletor, a coluna de luz mora em +X (a placa mora em −X).
  const colunas =
    pontosDeLuz === 2
      ? [
          {
            xCorpo: -meiaSepMm,
            giro: Math.PI,
            xTopo: -meiaSepMm - dxTopoMm,
            col: -1 as const,
          },
          {
            xCorpo: meiaSepMm,
            giro: 0,
            xTopo: meiaSepMm + dxTopoMm,
            col: 1 as const,
          },
        ]
      : comPlaca
        ? [
            {
              xCorpo: meiaSepMm,
              giro: 0,
              xTopo: meiaSepMm + dxTopoMm,
              col: 1 as const,
            },
          ]
        : [{ xCorpo: 0, giro: 0, xTopo: dxTopoMm, col: 0 as const }];

  return (
    // VSM dá à key do estúdio a sombra de borda macia (radius/blurSamples).
    <Canvas shadows="variance" camera={{ position: [4.8, 3.5, 6.2], fov: 38 }}>
      {/* O slot de cenários (§4.4): estúdio branco gelo ou quarto realista. */}
      <Cena
        id={cena}
        intensidade={luzEstudio}
        reduzido={reduzido}
        aoProntoCena={aoProntoCena}
      />
      {luzAcesa &&
        colunas.map((c, i) => (
          <pointLight
            key={`luz-${i}`}
            position={[
              // O deslocamento da cabeça inclinada ESPELHA na coluna girada.
              (c.xTopo +
                (c.giro ? -1 : 1) *
                  (difusorInclinado?.junta.deslocamentoMm ?? 0)) /
                MM,
              lampadaY,
              0,
            ]}
            color="#FFC478"
            intensity={13}
            distance={13}
          />
        ))}

      <Parte
        perfil={perfis.base}
        yMm={0}
        cor={coresHex.base}
        segmentos={40}
        facetas={facetasBase}
        marca={{ parte: "base" }}
      />
      {duo &&
        perfilPastilha &&
        [-meiaSepMm, meiaSepMm].map((x, i) => (
          <Parte
            key={`pastilha-${i}`}
            perfil={perfilPastilha}
            yMm={ySuperficieMm - 1}
            xMm={x}
            cor={coresHex.base}
            segmentos={40}
            marca={{ parte: "pastilha", coluna: i === 0 ? -1 : 1 }}
          />
        ))}
      {comPlaca && placa && (
        <PartePlaca
          placa={placa}
          xMm={-meiaSepMm}
          yMm={yColunaMm}
          cor={coresHex.base}
          marca={{ parte: "placa" }}
        />
      )}
      {(perfis.estruturais ?? []).map((perfil, k) => {
        // Altura acumulada das estruturais abaixo desta.
        const yK =
          yColunaMm +
          altEstruturais.slice(0, k).reduce((s, h) => s + h, 0);
        return colunas.map((c, i) => (
          <Parte
            key={`estrutural-${k}-${i}`}
            perfil={perfil}
            yMm={yK}
            xMm={c.xCorpo}
            giroY={c.giro}
            cor={coresHex.estruturais?.[k] ?? coresHex.corpo}
            segmentos={40}
            facetas={facetasEstruturais?.[k]}
            marca={{ parte: "estrutural", indice: k, coluna: c.col }}
          />
        ));
      })}
      {colunas.map((c, i) => (
        <Parte
          key={`corpo-${i}`}
          perfil={perfis.corpo}
          yMm={yCorpoMm}
          xMm={c.xCorpo}
          giroY={c.giro}
          cor={coresHex.corpo}
          segmentos={segmentos}
          textura={texturas?.corpo}
          espinha={espinhaCorpo}
          facetas={facetasCorpo}
          corte={corteCorpo}
          marca={{ parte: "corpo", coluna: c.col }}
        />
      ))}
      {colunas.map((c, i) =>
        difusorInclinado ? (
          <ParteCabecaInclinada
            key={`difusor-${i}`}
            difusor={difusorInclinado.difusor}
            junta={difusorInclinado.junta}
            xMm={c.xTopo}
            yMm={yCorpoMm + alturasMm.corpo}
            cor={coresHex.difusor}
            luzAcesa={luzAcesa}
            marca={{ parte: "difusor", coluna: c.col, inclinada: true }}
          />
        ) : (
          <Parte
            key={`difusor-${i}`}
            perfil={perfis.difusor}
            yMm={yCorpoMm + alturasMm.corpo}
            xMm={c.xTopo}
            cor={coresHex.difusor}
            segmentos={segmentos}
            textura={texturas?.difusor}
            difusor
            luzAcesa={luzAcesa}
            vazado={vazadoDifusor}
            facetas={facetasDifusor}
            corte={corteDifusor}
            marca={{ parte: "difusor", coluna: c.col, inclinada: false }}
          />
        )
      )}

      {/* Manipulação direta: seleção por raycast + glow; arrastar no vazio
          segue SEMPRE órbita (spec manipulação §2.1/§4). */}
      <ControladorGestos
        controlesRef={refControles}
        suspensoAteRef={suspensoAte}
      />

      {/* O visitante sempre pode arrastar (§4.3); o start suspende o rig 4 s. */}
      <OrbitControls
        ref={refControles}
        enablePan={false}
        minDistance={1.8}
        maxDistance={11}
        maxPolarAngle={1.62}
        onStart={() => {
          suspensoAte.current = performance.now() + 4000;
        }}
      />
      <CameraRig
        pose={pose}
        controlesRef={refControles}
        suspensoAteRef={suspensoAte}
        sinalRolagemRef={sinalRolagem}
        reduzido={reduzido}
      />
    </Canvas>
  );
}
