"use client";

/**
 * Único componente da manipulação direta dentro do Canvas (§2.1).
 *
 * Seleção: listeners de ponteiro no gl.domElement, raycast próprio contra a
 * cena filtrando userData.pp (nenhum handler por mesh), clique seco
 * seleciona/deseleciona (§4.1), glow emissivo da seleção e do hover (§4.2)
 * e cursor (§4.3).
 *
 * Gestos (§5): com Arrastar/Mover/Girar, o pointerdown sobre parte vira um
 * gesto — planejarGesto() escolhe o parâmetro (tabela §5.3), a trava de
 * eixo decide vertical × horizontal, e cada movimento vira pedido →
 * dirigir() → grampear* do núcleo → setter do painel (fonte única, §1.1).
 * Durante o gesto os OrbitControls desligam e o rig fica suspenso (§5.4);
 * empurrar o limite mostra o motivo didático no ToastLimite (§5.2/§6).
 * Arrastar no vazio segue SEMPRE órbita; gesto sem mapeamento também cai em
 * órbita e explica uma vez por sessão (§3.5); 2 dedos = sempre câmera (§5.5).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ComponentRef,
  type RefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  atualizarSelecao,
  deselecionar,
  lerEstado,
  lerPonte,
  mesmaParte,
  mostrarToast,
  pairar,
  selecionar,
  useManipulacao,
  type MarcaParte,
} from "./estado";
import {
  alturasDaPilhaMm,
  dirigir,
  planejarGesto,
  reordenarPilha,
  type MapeamentoGesto,
  type PlanoGesto,
} from "./dirigir";
import {
  deltaLateralMm,
  deltaRadialMm,
  deltaVerticalMm,
  destinoNaPilha,
  eixoDominante,
  intersecaoEstavel,
  planoHorizontalDeArrasto,
  planoVerticalDeArrasto,
  EMPURRAO_TOAST_PX,
  MM,
  ZONA_MORTA_PX,
} from "./gestos";
import { motivoDoLimite, MOTIVO_SNAP_JUNTA } from "./motivos";

/** A cor do glow — a mesma luz quente do difusor aceso (§4.2). */
const COR_GLOW = new THREE.Color("#F6E7C4");

/** Período do pulso lento da seleção, em segundos (§4.2). */
const PERIODO_PULSO_S = 2.4;

/** Amortecimento do entra/sai do glow (THREE.MathUtils.damp). */
const LAMBDA_GLOW = 8;

/** Zona morta do clique seco, em px (§4.1 — mesmo padrão do sheet). */
const CLIQUE_SECO_PX = 6;

/** Hints didáticos de gesto sem mapeamento: uma vez por sessão (§3.5). */
const hintsMostrados = new Set<string>();

/** Um gesto de parte em andamento (§5.1) — vive fora do React. */
interface GestoDeParte {
  ponteiroId: number;
  marca: MarcaParte;
  plano: PlanoGesto;
  /** Posição do ponteiro no pointerdown, em px. */
  x0: number;
  y0: number;
  /** Ponto de pega no mundo e eixo X da parte (unidades de cena). */
  hit0: THREE.Vector3;
  eixoX: number;
  /** Planos de arrasto (§5.1), fixados no início do gesto. */
  planoV: THREE.Plane;
  planoH: THREE.Plane;
  /** Trava de eixo (Arrastar/Mover); Girar dispensa e usa `girando`. */
  eixo: "h" | "v" | null;
  girando: boolean;
  /** Pilha (Montar): ordem no início do gesto e posição corrente da peça. */
  ordem0: number[];
  k0: number;
  kAtual: number;
  alturasMm: number[];
  /** Onde o ponteiro estava quando o pedido encostou no limite (§5.2). */
  limiteAncora: { x: number; y: number } | null;
}

/** prefers-reduced-motion como store externo — réplica do hook da Cena3D (§4.2). */
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

interface PropsControlador {
  /** Ref dos OrbitControls — desligados durante o gesto de parte (§5.4). */
  controlesRef: RefObject<ComponentRef<typeof OrbitControls> | null>;
  /** Instante até o qual o rig fica suspenso — renovado a cada frame de gesto (§5.4). */
  suspensoAteRef: RefObject<number>;
}

export default function ControladorGestos({
  controlesRef,
  suspensoAteRef,
}: PropsControlador) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const reduzido = useMovimentoReduzido();

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const vNdc = useMemo(() => new THREE.Vector2(), []);

  /** Posição corrente do ponteiro; o hover raycasta no máximo 1× por frame. */
  const ponteiro = useRef({ x: 0, y: 0, toque: false, precisaHover: false });
  /** Candidato a clique seco (§4.1) — morre ao passar de 6 px ou ao 2º dedo. */
  const gesto = useRef<{
    id: number;
    x0: number;
    y0: number;
    moveu: boolean;
  } | null>(null);
  /** Ponteiros ativos no canvas — 2 dedos = SEMPRE câmera (§5.5). */
  const dedos = useRef(new Set<number>());
  /** Gesto de parte em andamento (Arrastar/Mover/Girar sobre parte, §5). */
  const manip = useRef<GestoDeParte | null>(null);
  /** Ponto de interseção reciclado dos planos de arrasto. */
  const vHit = useMemo(() => new THREE.Vector3(), []);

  /**
   * O raycast do contrato (§2.2): intersecta a cena inteira e sobe pela
   * hierarquia até achar userData.pp — o primeiro hit com marca vence;
   * cenário/chão não têm marca (hit sem marca = "vazio"). Devolve também o
   * ponto de pega e a origem da parte (para região/eixo do gesto, §5.1).
   */
  const raycastParte = useCallback(
    (
      clientX: number,
      clientY: number
    ): { marca: MarcaParte; ponto: THREE.Vector3; origem: THREE.Vector3 } | null => {
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      vNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(vNdc, camera);
      for (const hit of raycaster.intersectObjects(scene.children, true)) {
        let alvo: THREE.Object3D | null = hit.object;
        while (alvo) {
          const pp = (alvo.userData as { pp?: MarcaParte }).pp;
          if (pp) {
            const origem = new THREE.Vector3();
            alvo.getWorldPosition(origem);
            return { marca: pp, ponto: hit.point.clone(), origem };
          }
          alvo = alvo.parent;
        }
      }
      return null;
    },
    [gl, camera, scene, raycaster, vNdc]
  );

  const raycastMarca = useCallback(
    (clientX: number, clientY: number): MarcaParte | null =>
      raycastParte(clientX, clientY)?.marca ?? null,
    [raycastParte]
  );

  /** Raio do ponteiro cruzando um plano de arrasto (§5.1). */
  const raioNoPlano = useCallback(
    (
      clientX: number,
      clientY: number,
      plano: THREE.Plane
    ): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      vNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(vNdc, camera);
      return intersecaoEstavel(raycaster.ray, plano, vHit);
    },
    [gl, camera, raycaster, vNdc, vHit]
  );

  useEffect(() => {
    const el = gl.domElement;

    /** Fim do gesto de parte (§5.4): a câmera volta a ser do usuário. */
    const finalizarManipulacao = () => {
      if (!manip.current) return;
      manip.current = null;
      const controles = controlesRef.current;
      if (controles) controles.enabled = true;
    };

    /** Pointerdown sobre parte com ferramenta de gesto: nasce um gesto (§5). */
    const iniciarManipulacao = (
      e: PointerEvent,
      alvo: { marca: MarcaParte; ponto: THREE.Vector3; origem: THREE.Vector3 }
    ) => {
      const ponte = lerPonte();
      const alturaCorpoMm = Math.max(1, ponte?.corpoEfetivo.alturaMm ?? 1);
      const t = THREE.MathUtils.clamp(
        ((alvo.ponto.y - alvo.origem.y) * MM) / alturaCorpoMm,
        0,
        1
      );
      const distEixoMm =
        Math.hypot(alvo.ponto.x - alvo.origem.x, alvo.ponto.z) * MM;
      const plano = planejarGesto(alvo.marca, lerEstado().ferramenta, {
        t,
        distEixoMm,
      });
      if (!plano) return;
      if ("hint" in plano) {
        // Sem mapeamento: o arrasto cai em órbita e o hint didático aparece
        // uma vez por sessão (§3.5).
        if (!hintsMostrados.has(plano.hint)) {
          hintsMostrados.add(plano.hint);
          mostrarToast(plano.hint, e.clientX, e.clientY);
        }
        return;
      }
      // §5.4: durante o gesto de parte a órbita desliga e o rig suspende.
      const controles = controlesRef.current;
      if (controles) controles.enabled = false;
      suspensoAteRef.current = performance.now() + 4000;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Sem capture (ponteiro já morto): o gesto ainda funciona no canvas.
      }
      const k0 = alvo.marca.parte === "estrutural" ? alvo.marca.indice : 0;
      manip.current = {
        ponteiroId: e.pointerId,
        marca: alvo.marca,
        plano: plano.plano,
        x0: e.clientX,
        y0: e.clientY,
        hit0: alvo.ponto,
        eixoX: alvo.origem.x,
        planoV: planoVerticalDeArrasto(
          alvo.ponto,
          camera.getWorldDirection(new THREE.Vector3())
        ),
        planoH: planoHorizontalDeArrasto(alvo.ponto),
        eixo: null,
        girando: false,
        ordem0: ponte ? [...ponte.estruturais] : [],
        k0,
        kAtual: k0,
        alturasMm: ponte ? alturasDaPilhaMm(ponte) : [],
        limiteAncora: null,
      };
    };

    /** Cada movimento do gesto vira pedido → dirigir() → setter (§5.1/§5.2). */
    const moverManipulacao = (e: PointerEvent) => {
      const m = manip.current;
      if (!m || m.ponteiroId !== e.pointerId) return;
      suspensoAteRef.current = performance.now() + 4000;
      const dx = e.clientX - m.x0;
      const dy = e.clientY - m.y0;

      let mapa: MapeamentoGesto | null = null;
      if (m.plano.angular) {
        // Girar: sem trava de eixo — só a zona morta antes de começar.
        if (!m.girando && Math.hypot(dx, dy) <= ZONA_MORTA_PX) return;
        m.girando = true;
        mapa = m.plano.angular;
      } else {
        if (!m.eixo) m.eixo = eixoDominante(dx, dy);
        if (!m.eixo) return;
        if (m.eixo === "v" && m.plano.pilha) {
          // Reordenar a pilha (§5.3): swap ao cruzar o meio da vizinha.
          const hit = raioNoPlano(e.clientX, e.clientY, m.planoV);
          if (!hit) return;
          const destino = destinoNaPilha(
            m.alturasMm,
            m.k0,
            deltaVerticalMm(hit, m.hit0)
          );
          if (destino !== m.kAtual) {
            reordenarPilha(m.ordem0, m.k0, destino);
            m.kAtual = destino;
            if (m.marca.parte === "estrutural") {
              atualizarSelecao({ ...m.marca, indice: destino });
            }
          }
          return;
        }
        mapa = (m.eixo === "v" ? m.plano.vertical : m.plano.horizontal) ?? null;
      }
      if (!mapa) return; // eixo travado sem mapeamento: o gesto fica inerte

      let delta: number | null = null;
      switch (mapa.fonte) {
        case "pxX":
          delta = dx;
          break;
        case "pxY":
          delta = dy;
          break;
        case "vertical": {
          const hit = raioNoPlano(e.clientX, e.clientY, m.planoV);
          delta = hit ? deltaVerticalMm(hit, m.hit0) : null;
          break;
        }
        case "lateral": {
          const hit = raioNoPlano(e.clientX, e.clientY, m.planoH);
          delta = hit ? deltaLateralMm(hit, m.hit0) : null;
          break;
        }
        case "radial": {
          const hit = raioNoPlano(e.clientX, e.clientY, m.planoH);
          delta = hit ? deltaRadialMm(hit, m.hit0, m.eixoX) : null;
          break;
        }
      }
      if (delta == null) return;

      const res = dirigir(mapa.alvo, mapa.v0 + delta * mapa.escala);
      if (!res) return;
      if (res.snap) {
        // A cabeça endireitou e a junta saiu — estado válido, toast neutro.
        mostrarToast(MOTIVO_SNAP_JUNTA, e.clientX, e.clientY);
        finalizarManipulacao();
        return;
      }
      if (!res.limitou) {
        m.limiteAncora = null;
        return;
      }
      // §5.2: o motivo só aparece se o dedo continua empurrando ≥ 12 px
      // além do limite — e renova sem repiscar enquanto empurra.
      if (!m.limiteAncora) {
        m.limiteAncora = { x: e.clientX, y: e.clientY };
        return;
      }
      const empurrao = Math.hypot(
        e.clientX - m.limiteAncora.x,
        e.clientY - m.limiteAncora.y
      );
      if (empurrao >= EMPURRAO_TOAST_PX) {
        const texto = motivoDoLimite(mapa.alvo, res.limitou);
        if (texto) mostrarToast(texto, e.clientX, e.clientY);
      }
    };

    const aoDescer = (e: PointerEvent) => {
      dedos.current.add(e.pointerId);
      if (dedos.current.size > 1) {
        // 2 dedos = SEMPRE câmera (§5.5): o gesto de parte é finalizado
        // (o valor corrente fica), o clique seco em curso morre e o
        // pinch/rotate segue para os OrbitControls.
        gesto.current = null;
        finalizarManipulacao();
        const controles = controlesRef.current;
        if (controles) controles.enabled = true;
        return;
      }
      if (e.pointerType === "mouse" && e.button !== 0) return;
      gesto.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moveu: false };
      // Nas ferramentas de gesto, iniciar um arrasto sobre a parte também a
      // seleciona (§4.1) — e nasce o gesto que dirige o parâmetro (§5).
      if (lerEstado().ferramenta !== "selecionar") {
        const alvo = raycastParte(e.clientX, e.clientY);
        if (alvo) {
          selecionar(alvo.marca);
          iniciarManipulacao(e, alvo);
        }
      }
    };

    const aoMover = (e: PointerEvent) => {
      const g = gesto.current;
      if (
        g &&
        g.id === e.pointerId &&
        !g.moveu &&
        Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > CLIQUE_SECO_PX
      ) {
        g.moveu = true; // deixou de ser clique seco
        // O arrasto que nasceu sobre uma parte mostra a "mão fechada" (§4.3).
        const est = lerEstado();
        if (est.hover) {
          el.style.cursor =
            est.ferramenta === "selecionar" ? "" : "grabbing";
        }
      }
      ponteiro.current.x = e.clientX;
      ponteiro.current.y = e.clientY;
      ponteiro.current.toque = e.pointerType === "touch";
      // Durante um arrasto (órbita ou gesto) o hover congela — reavalia no soltar.
      if (e.buttons === 0) ponteiro.current.precisaHover = true;
      moverManipulacao(e);
    };

    const aoSubir = (e: PointerEvent) => {
      dedos.current.delete(e.pointerId);
      if (manip.current?.ponteiroId === e.pointerId) finalizarManipulacao();
      ponteiro.current.x = e.clientX;
      ponteiro.current.y = e.clientY;
      ponteiro.current.toque = e.pointerType === "touch";
      ponteiro.current.precisaHover = true;
      // Soltou: a mão abre de novo (o hover do próximo frame reconfirma).
      const est = lerEstado();
      el.style.cursor = est.hover
        ? est.ferramenta === "selecionar"
          ? "pointer"
          : "grab"
        : "";
      const g = gesto.current;
      if (!g || g.id !== e.pointerId) return;
      gesto.current = null;
      if (g.moveu) return; // arrasto no vazio = órbita; seleção fica como está
      // Clique seco (§4.1): parte seleciona (em QUALQUER ferramenta),
      // vazio deseleciona.
      const marca = raycastMarca(e.clientX, e.clientY);
      if (marca) selecionar(marca);
      else deselecionar();
    };

    const aoCancelar = (e: PointerEvent) => {
      dedos.current.delete(e.pointerId);
      if (manip.current?.ponteiroId === e.pointerId) finalizarManipulacao();
      if (gesto.current?.id === e.pointerId) gesto.current = null;
    };

    const aoSair = () => {
      ponteiro.current.precisaHover = false;
      pairar(null);
    };

    el.addEventListener("pointerdown", aoDescer);
    el.addEventListener("pointermove", aoMover);
    el.addEventListener("pointerup", aoSubir);
    el.addEventListener("pointercancel", aoCancelar);
    el.addEventListener("pointerleave", aoSair);
    return () => {
      el.removeEventListener("pointerdown", aoDescer);
      el.removeEventListener("pointermove", aoMover);
      el.removeEventListener("pointerup", aoSubir);
      el.removeEventListener("pointercancel", aoCancelar);
      el.removeEventListener("pointerleave", aoSair);
      finalizarManipulacao();
      el.style.cursor = "";
      pairar(null);
    };
  }, [
    gl,
    camera,
    raycastParte,
    raycastMarca,
    raioNoPlano,
    controlesRef,
    suspensoAteRef,
  ]);

  // Cursor (§4.3): pointer na ferramenta Selecionar, grab nas de gesto, o
  // vazio fica com o CSS da página. Reage ao store (o hover é atualizado
  // pelo raycast do useFrame); o "grabbing" vivo fica com os handlers acima.
  // O canvas chega via ref — só os handlers/efeitos escrevem o cursor nele.
  const refCanvas = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    refCanvas.current = gl.domElement;
  }, [gl]);
  const { hover: hoverAtual, ferramenta: ferramentaAtual } = useManipulacao();
  useEffect(() => {
    const el = refCanvas.current;
    if (!el) return;
    const g = gesto.current;
    const cursor = hoverAtual
      ? ferramentaAtual === "selecionar"
        ? g?.moveu
          ? ""
          : "pointer"
        : g?.moveu
          ? "grabbing"
          : "grab"
      : "";
    if (el.style.cursor !== cursor) el.style.cursor = cursor;
  }, [hoverAtual, ferramentaAtual]);

  /** Estado original de cada material tocado pelo glow — capturado na 1ª vez.
   *  Se o material remonta (padrão key= do Parte), o novo é capturado e o
   *  velho morre com o GC — nada a restaurar (§4.2). */
  const originais = useRef(
    new WeakMap<
      THREE.MeshStandardMaterial,
      { emissiveHex: number; intensidade: number }
    >()
  );
  /** Materiais atualmente em glow (para o damp de saída). */
  const emGlow = useRef(new Set<THREE.MeshStandardMaterial>());
  /** Alvos do quadro corrente — reciclado para não alocar por frame. */
  const alvosQuadro = useRef(new Map<THREE.MeshStandardMaterial, number>());
  const tempoRef = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    tempoRef.current += dt;

    // 0) Rig suspenso a cada frame do gesto de parte (§5.4): ele volta
    //    sozinho 4 s depois do último frame, ou no próximo scroll do painel.
    if (manip.current) {
      suspensoAteRef.current = performance.now() + 4000;
    }

    // 1) Hover: raycast no máximo 1× por frame, só quando o ponteiro mexeu;
    //    sem hover no toque (§4.3).
    const p = ponteiro.current;
    if (p.precisaHover) {
      p.precisaHover = false;
      pairar(p.toque ? null : raycastMarca(p.x, p.y));
    }

    const est = lerEstado();

    // 2) Glow emissivo (§4.2): uniforms do meshStandardMaterial — zero
    //    recompilação de shader, zero draw call extra. Em obra dupla as
    //    duas colunas brilham juntas (mesmaParte ignora a coluna).
    const alvos = alvosQuadro.current;
    alvos.clear();
    if (est.selecao || est.hover) {
      const fase = Math.sin((2 * Math.PI * tempoRef.current) / PERIODO_PULSO_S);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const marca = (mesh.userData as { pp?: MarcaParte }).pp;
        if (!marca) return;
        const selecionada = !!est.selecao && mesmaParte(marca, est.selecao);
        const pairada =
          !selecionada && !!est.hover && mesmaParte(marca, est.hover);
        if (!selecionada && !pairada) return; // hover nunca em parte selecionada
        const material = mesh.material;
        if (
          Array.isArray(material) ||
          !(material as THREE.MeshStandardMaterial).isMeshStandardMaterial
        ) {
          return;
        }
        const m = material as THREE.MeshStandardMaterial;
        let orig = originais.current.get(m);
        if (!orig) {
          orig = {
            emissiveHex: m.emissive.getHex(),
            intensidade: m.emissiveIntensity,
          };
          originais.current.set(m, orig);
        }
        const ehDifusor = marca.parte === "difusor";
        // Seleção: pulso lento 0,05→0,12 (fixo 0,09 em reduced-motion);
        // hover: tint fixo 0,04 sem pulso. No difusor (que já usa emissive
        // para a luz) o glow é ADITIVO sobre a intensidade capturada —
        // aceso ou apagado, soma por cima e restaura direito.
        const glow = selecionada
          ? reduzido
            ? 0.09
            : ehDifusor
              ? 0.05 + 0.04 * fase
              : 0.085 + 0.035 * fase
          : 0.04;
        alvos.set(m, ehDifusor ? orig.intensidade + glow : glow);
        if (!ehDifusor) m.emissive.copy(m.color).lerp(COR_GLOW, 0.5);
      });
    }

    // Entra suave: damp rumo ao alvo do quadro.
    for (const [m, alvo] of alvos) {
      m.emissiveIntensity = THREE.MathUtils.damp(
        m.emissiveIntensity,
        alvo,
        LAMBDA_GLOW,
        dt
      );
      emGlow.current.add(m);
    }
    // Sai suave: quem deixou de ser alvo volta ao estado capturado.
    for (const m of emGlow.current) {
      if (alvos.has(m)) continue;
      const orig = originais.current.get(m);
      if (!orig) {
        emGlow.current.delete(m);
        continue;
      }
      m.emissiveIntensity = THREE.MathUtils.damp(
        m.emissiveIntensity,
        orig.intensidade,
        LAMBDA_GLOW,
        dt
      );
      if (Math.abs(m.emissiveIntensity - orig.intensidade) < 0.004) {
        m.emissiveIntensity = orig.intensidade;
        m.emissive.setHex(orig.emissiveHex);
        emGlow.current.delete(m);
      }
    }
  });

  return null;
}
