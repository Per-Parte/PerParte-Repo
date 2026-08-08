"use client";

/**
 * Montagem v2 — CENÁRIOS do estúdio (item 8 do plano de alterações).
 *
 * Um cenário = parede com a luz bakeada (estuque, gobo, desfoque) +
 * chão de verdade (madeira com veio ou piso claro) + jogo de luzes com
 * a MESMA história da parede (se a parede mostra persiana, a luz que
 * atravessa a obra carrega o gobo da persiana — SpotLight.map). A quina
 * parede×chão é real, como nas fotos de produto; morreu o ciclorama
 * infinito de gradiente, que era o que mais gritava "desenho 3D".
 *
 * Os quatro cenários vêm das quatro referências do Davi (08/08):
 * Manhã (parede creme + sombra de folhagem), Entardecer (estuque dourado
 * + persiana), Anoitecer (parede escura + obra acesa como protagonista)
 * e Galeria (painel canelado claro + poeira no ar — e a luz mais neutra:
 * é o cenário de COR FIEL, onde o filamento lê verdadeiro).
 */

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { ContactShadows, Sparkles } from "@react-three/drei";
import {
  gerarGoboProjetado,
  gerarMadeira,
  gerarParede,
  type GoboParede,
  type ReceitaMadeira,
  type ReceitaParede,
} from "./texturas-cenario";

export interface CenarioEstudio {
  id: string;
  nome: string;
  /** Cor do chip do seletor. */
  chip: string;
  /** Quanto da luz bakeada a parede emite por conta própria (0–1). */
  paredeAutoLuz: number;
  parede: ReceitaParede;
  chao: ReceitaMadeira & { reflexoDiscreto: boolean };
  luzes: {
    /** Key: cor, intensidade e posição (a história da parede manda). */
    keyCor: string;
    keyIntensidade: number;
    keyPosicao: [number, number, number];
    /** O gobo que ATRAVESSA a obra (null = luz limpa). */
    keyGobo: GoboParede;
    fillIntensidade: number;
    /** Céu/chão do hemisfério — o quique do ambiente. */
    fillCeu: string;
    fillChao: string;
    rimCor: string;
    rimIntensidade: number;
  };
  sombraContato: string;
  poeira: boolean;
}

/**
 * ⚑ Os quatro cenários são leitura minha das referências — cores e
 * ângulos afináveis a olho com o Davi. A GALERIA é contrato: luz quase
 * neutra e calibrada, porque é nela que a cor do filamento tem de bater
 * com o carretel (os outros três têm licença artística de foto — luz
 * dourada AMARELA a peça de propósito, como o sol faria).
 */
export const CENARIOS_ESTUDIO: readonly CenarioEstudio[] = [
  {
    id: "galeria",
    paredeAutoLuz: 0.34,
    nome: "Galeria",
    chip: "#E4E2DC",
    parede: {
      cor: "#EDEBE5",
      sombra: "#B9B6AE",
      gobo: "folhagem",
      canelada: true,
      desfoquePx: 3,
      ladoDaLuz: 1,
      semente: 41,
    },
    chao: {
      claro: "#DDDAD2",
      escuro: "#C9C6BE",
      junta: "#B5B2AA",
      semente: 7,
      reflexoDiscreto: true,
    },
    luzes: {
      keyCor: "#FFF4E6",
      keyIntensidade: 3.3,
      keyPosicao: [6.5, 7, 3.2],
      keyGobo: null,
      fillIntensidade: 0.42,
      fillCeu: "#FFFFFF",
      fillChao: "#C9C4B8",
      rimCor: "#DCE4EC",
      rimIntensidade: 0.55,
    },
    sombraContato: "#3A372F",
    poeira: true,
  },
  {
    id: "manha",
    paredeAutoLuz: 0.4,
    nome: "Manhã",
    chip: "#D8CBB6",
    parede: {
      cor: "#DECFBA",
      sombra: "#9F8E7B",
      gobo: "folhagem",
      desfoquePx: 5,
      ladoDaLuz: -1,
      semente: 11,
    },
    chao: {
      claro: "#C9A171",
      escuro: "#A87F52",
      junta: "#84623C",
      semente: 3,
      reflexoDiscreto: true,
    },
    luzes: {
      keyCor: "#FFE9C8",
      keyIntensidade: 3.1,
      keyPosicao: [-6, 6.5, 4.5],
      keyGobo: "folhagem",
      fillIntensidade: 0.42,
      fillCeu: "#FFF6E8",
      fillChao: "#B08D62",
      rimCor: "#E8EEF4",
      rimIntensidade: 0.4,
    },
    sombraContato: "#4A3520",
    poeira: false,
  },
  {
    id: "entardecer",
    paredeAutoLuz: 0.6,
    nome: "Entardecer",
    chip: "#C99B5F",
    parede: {
      cor: "#E4C08B",
      sombra: "#59493C",
      gobo: "persiana",
      desfoquePx: 2,
      ladoDaLuz: -1,
      semente: 23,
    },
    chao: {
      claro: "#B57F42",
      escuro: "#8A5C2C",
      junta: "#6B4520",
      semente: 13,
      reflexoDiscreto: true,
    },
    luzes: {
      keyCor: "#FFD9A0",
      keyIntensidade: 3.1,
      keyPosicao: [-7.5, 4.5, 5],
      keyGobo: "persiana",
      fillIntensidade: 0.5,
      fillCeu: "#F4DCBA",
      fillChao: "#7A5730",
      rimCor: "#FFE3B8",
      rimIntensidade: 0.3,
    },
    sombraContato: "#3E2B14",
    poeira: false,
  },
  {
    id: "anoitecer",
    paredeAutoLuz: 0.5,
    nome: "Anoitecer",
    chip: "#5C5148",
    parede: {
      cor: "#8A7A6B",
      sombra: "#3A322B",
      gobo: "folhagem",
      desfoquePx: 6,
      ladoDaLuz: 1,
      semente: 31,
    },
    chao: {
      claro: "#6B4E38",
      escuro: "#4A3426",
      junta: "#332318",
      semente: 29,
      reflexoDiscreto: true,
    },
    luzes: {
      keyCor: "#FFDFB4",
      keyIntensidade: 2.1,
      keyPosicao: [6.5, 5, 4.5],
      keyGobo: "folhagem",
      fillIntensidade: 0.42,
      fillCeu: "#C9BCAC",
      fillChao: "#4A3A2C",
      rimCor: "#B9C6D4",
      rimIntensidade: 0.5,
    },
    sombraContato: "#241A10",
    poeira: false,
  },
] as const;

export type CenarioId = (typeof CENARIOS_ESTUDIO)[number]["id"];

export function cenarioPorId(id: CenarioId): CenarioEstudio {
  return CENARIOS_ESTUDIO.find((c) => c.id === id) ?? CENARIOS_ESTUDIO[0];
}

// ---------------------------------------------------------------------------
// A cena
// ---------------------------------------------------------------------------

/** Parede a 9 unidades atrás da obra; chão encontra ela numa quina real. */
const PAREDE_Z = -9;
const PAREDE_LARGURA = 70;
const PAREDE_ALTURA = 34;
const CHAO_LADO = 80;

function descartar(...texturas: (THREE.Texture | undefined)[]) {
  for (const t of texturas) t?.dispose();
}

export function Cenario({ config }: { config: CenarioEstudio }) {
  const alvoDoFoco = useMemo(() => {
    const alvo = new THREE.Object3D();
    alvo.position.set(0, 1.1, 0);
    return alvo;
  }, []);
  const parede = useMemo(() => gerarParede(config.parede), [config.parede]);
  const chao = useMemo(() => gerarMadeira(config.chao), [config.chao]);
  const gobo = useMemo(
    () =>
      config.luzes.keyGobo
        ? gerarGoboProjetado(config.luzes.keyGobo, config.parede.semente)
        : null,
    [config.luzes.keyGobo, config.parede.semente]
  );
  useEffect(
    () => () =>
      descartar(
        parede.mapa,
        parede.normal,
        chao.mapa,
        chao.normal,
        chao.rugosidade,
        gobo ?? undefined
      ),
    [parede, chao, gobo]
  );

  // O chão repete a madeira em escala real (tábua ~55 cm de largura).
  const repeticaoChao = CHAO_LADO / 8;
  const mapaChao = chao.mapa;
  mapaChao.repeat.set(repeticaoChao, repeticaoChao);
  chao.normal.repeat.set(repeticaoChao, repeticaoChao);
  chao.rugosidade.repeat.set(repeticaoChao, repeticaoChao);

  const corForaDeQuadro = useMemo(
    () => new THREE.Color(config.parede.sombra).multiplyScalar(0.55),
    [config.parede.sombra]
  );

  return (
    <>
      {/* Fora do quadro: a cor do canto em sombra, nunca preto de void. */}
      <color attach="background" args={[corForaDeQuadro]} />

      {/* Fill hemisférico: o quique da sala. */}
      <hemisphereLight
        args={[
          config.luzes.fillCeu,
          config.luzes.fillChao,
          config.luzes.fillIntensidade,
        ]}
      />

      {/* A key. Com gobo, é um FOCO com a textura na frente (as listras
          da persiana correm por cima da obra quando a manivela gira);
          sem gobo, uma direcional comum. As sombras são VSM macias. */}
      {gobo ? (
        <>
          <primitive object={alvoDoFoco} />
          <spotLight
            castShadow
            map={gobo}
            position={config.luzes.keyPosicao}
            target={alvoDoFoco}
            angle={0.5}
            penumbra={0.85}
            decay={0}
            distance={0}
            intensity={config.luzes.keyIntensidade}
            color={config.luzes.keyCor}
            shadow-mapSize={[2048, 2048]}
            shadow-radius={6}
            shadow-blurSamples={14}
            shadow-bias={-0.0002}
            shadow-normalBias={0.05}
          />
        </>
      ) : (
        <directionalLight
          castShadow
          position={config.luzes.keyPosicao}
          intensity={config.luzes.keyIntensidade}
          color={config.luzes.keyCor}
          shadow-mapSize={[2048, 2048]}
          shadow-radius={7}
          shadow-blurSamples={16}
          shadow-normalBias={0.05}
          shadow-camera-near={1}
          shadow-camera-far={40}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={12}
          shadow-camera-bottom={-6}
        />
      )}

      {/* Contraluz fria discreta: recorta a obra contra a parede. */}
      <directionalLight
        position={[-config.luzes.keyPosicao[0] * 0.8, 3, -5]}
        intensity={config.luzes.rimIntensidade}
        color={config.luzes.rimCor}
      />

      {/* A PAREDE — a luz da foto mora na textura (pool, gobo, declive,
          oclusão do rodapé, fora-de-foco), bakeada uma vez. */}
      <mesh position={[0, PAREDE_ALTURA / 2 - 0.2, PAREDE_Z]} receiveShadow>
        <planeGeometry args={[PAREDE_LARGURA, PAREDE_ALTURA]} />
        <meshStandardMaterial
          map={parede.mapa}
          normalMap={parede.normal}
          normalScale={
            new THREE.Vector2(parede.escalaNormal, parede.escalaNormal)
          }
          roughness={0.96}
          metalness={0}
          // A luz da parede foi FOTOGRAFADA no bake (pool, gobo,
          // declive): ela emite uma fração disso por conta própria, e o
          // jogo de luzes reais só tempera — sem isso, o cenário de
          // entardecer virava um breu (a parede dependia de uma key que
          // aponta para a OBRA, não para ela).
          emissive="#FFFFFF"
          emissiveMap={parede.mapa}
          emissiveIntensity={config.paredeAutoLuz}
        />
      </mesh>

      {/* O CHÃO — madeira com veio, junta e rugosidade variada. O plano
          vai até a parede e para: a quina existe, como numa sala. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.002, (CHAO_LADO / 2 + PAREDE_Z) / 2]}
        receiveShadow
      >
        <planeGeometry args={[PAREDE_LARGURA, CHAO_LADO / 2 - PAREDE_Z]} />
        <meshStandardMaterial
          map={mapaChao}
          normalMap={chao.normal}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          roughnessMap={chao.rugosidade}
          roughness={1}
          metalness={0}
          envMapIntensity={0}
        />
      </mesh>

      {/* Faixa de oclusão na quina: o chão também escurece ao encostar
          na parede (a parede já escurece pelo bake do rodapé). */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, PAREDE_Z + 1.7]}
      >
        <planeGeometry args={[PAREDE_LARGURA, 3.4]} />
        <meshBasicMaterial transparent opacity={0.32} color="#000000" />
      </mesh>

      {/* Sombra de contato macia sob a obra (todas as referências). */}
      <ContactShadows
        position={[0, 0.004, 0]}
        opacity={0.85}
        scale={10}
        blur={1.9}
        far={3.4}
        color={config.sombraContato}
      />

      {/* Poeira no ar da Galeria — a referência clara tem partículas. */}
      {config.poeira && (
        <Sparkles
          count={70}
          scale={[10, 6, 8]}
          position={[0, 3, -2]}
          size={1.6}
          speed={0.18}
          opacity={0.5}
          color="#FFF7EA"
        />
      )}
    </>
  );
}
