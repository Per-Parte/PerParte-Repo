"use client";

import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  deslocamentoEspinhaMm,
  ENCAIXES,
  malhaRevolucao,
  mascaraVazado,
  perfilPastilhaMacho,
  type EspinhaLateral,
  type ParametrosVazado,
  type Ponto2D,
  type TexturaRevolucao,
} from "@per-parte/nucleo";

/** Escala da cena: 100 mm = 1 unidade 3D. */
const MM = 100;

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
}: ParteProps) {
  const geometria = useMemo(() => {
    const comTextura =
      !!textura &&
      textura.profundidadeMm > 0 &&
      segmentos >= 32 &&
      (textura.familia && textura.familia !== "gomos"
        ? (textura.repeticao ?? 0) > 0
        : textura.gomos > 0);
    const seg = comTextura ? 96 : segmentos;
    const m = malhaRevolucao(perfil, seg, textura, espinha);
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
  }, [perfil, segmentos, textura, espinha, vazado]);

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

  const facetado = segmentos <= 16;

  return (
    <group position={[xMm / MM, yMm / MM, 0]} rotation={[0, giroY, 0]}>
      <mesh geometry={geometria} rotation={[-Math.PI / 2, 0, 0]}>
        {difusor ? (
          <meshStandardMaterial
            key={`dif-${facetado}-${luzAcesa}-${mapaVazado ? "vaz" : "solido"}`}
            color={cor}
            roughness={0.5}
            transparent
            opacity={luzAcesa ? 0.95 : 0.68}
            side={THREE.DoubleSide}
            emissive="#F3B65B"
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
}: Cena3DProps) {
  // A pilha de estruturais vive entre a base e o corpo — soma altura a
  // tudo que está acima dela.
  const altEstruturais = alturasMm.estruturais ?? [];
  const totalEstrMm = altEstruturais.reduce((s, h) => s + h, 0);
  const yCorpoMm = alturasMm.base + totalEstrMm;
  const totalMm = yCorpoMm + alturasMm.corpo + alturasMm.difusor;
  const alvoY = (totalMm * 0.52) / MM;
  const lampadaY =
    (yCorpoMm + alturasMm.corpo + alturasMm.difusor * 0.45) / MM;

  const dxTopoMm = espinhaCorpo
    ? deslocamentoEspinhaMm(alturasMm.corpo, espinhaCorpo)
    : 0;
  const duo = pontosDeLuz === 2;
  const meiaSepMm = duo ? separacaoMm / 2 : 0;

  const perfilPastilha = useMemo(
    () => (duo ? perfilPastilhaMacho(ENCAIXES.baseCorpo.anel) : null),
    [duo]
  );

  // Posições X dos corpos e dos topos (difusor + lâmpada), em mm.
  const colunas = duo
    ? [
        { xCorpo: -meiaSepMm, giro: Math.PI, xTopo: -meiaSepMm - dxTopoMm },
        { xCorpo: meiaSepMm, giro: 0, xTopo: meiaSepMm + dxTopoMm },
      ]
    : [{ xCorpo: 0, giro: 0, xTopo: dxTopoMm }];

  return (
    <Canvas camera={{ position: [3.4, 2.6, 4.4], fov: 38 }}>
      <color attach="background" args={[luzAcesa ? "#161311" : "#1b1916"]} />
      <fog attach="fog" args={[luzAcesa ? "#161311" : "#1b1916", 9, 16]} />
      <ambientLight intensity={luzAcesa ? 0.35 : 0.5} />
      <directionalLight position={[4.5, 7.2, 5.3]} intensity={1.1} />
      <directionalLight
        position={[-5.5, 1.5, -3.5]}
        intensity={0.35}
        color="#9BB5D0"
      />
      {luzAcesa &&
        colunas.map((c, i) => (
          <pointLight
            key={`luz-${i}`}
            position={[c.xTopo / MM, lampadaY, 0]}
            color="#FFC478"
            intensity={9}
            distance={9}
          />
        ))}

      <Parte
        perfil={perfis.base}
        yMm={0}
        cor={coresHex.base}
        segmentos={40}
      />
      {duo &&
        perfilPastilha &&
        colunas.map((c, i) => (
          <Parte
            key={`pastilha-${i}`}
            perfil={perfilPastilha}
            yMm={alturasMm.base - 1}
            xMm={c.xCorpo}
            cor={coresHex.base}
            segmentos={40}
          />
        ))}
      {(perfis.estruturais ?? []).map((perfil, k) => {
        // Altura acumulada das estruturais abaixo desta.
        const yK =
          alturasMm.base +
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
        />
      ))}
      {colunas.map((c, i) => (
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
        />
      ))}

      <ContactShadows opacity={0.5} scale={6} blur={2.8} far={2.5} color="#000000" />
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
