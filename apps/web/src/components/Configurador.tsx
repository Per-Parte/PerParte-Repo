"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  BASES,
  CORPOS,
  DIFUSORES,
  ESTRUTURAIS,
  FACETAS,
  PALETA,
  ajustarComposicaoDupla,
  ajustarGolaAoDifusor,
  contrapesoNecessarioG,
  desvioCabecaMm,
  estabilidade,
  estimarPreco,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  perfilEstrutural,
  perfisPlacaParaPeso,
  RAIO_LIVRE_MIOLO_MM,
  separacaoMaximaMm,
  type ParametrosBase,
  type ParametrosCorpo,
  type ParametrosDifusor,
  type ParametrosPlaca,
} from "@per-parte/nucleo";
import PainelMontar from "./PainelMontar";
import PainelCriar from "./PainelCriar";
import BotaoSalvar from "./BotaoSalvar";
import ToggleCena from "./cena/ToggleCena";
import { CHAVE_CENA, cenaValida, type CenaId } from "./cena/tipos";
import { NumeroAnimado } from "./controles";
import { codificarCriacao, decodificarCriacao } from "@/lib/criacao";

export type ParteAlvo = "base" | "corpo" | "difusor";
export type AlvoCor = "all" | ParteAlvo;
export type CoresPartes = Record<ParteAlvo, number>;

export interface EstadoCriar {
  base: ParametrosBase;
  corpo: ParametrosCorpo;
  difusor: ParametrosDifusor;
}

type Modo = "montar" | "criar";

/** Loading do palco (§4.5) enquanto o WebGL sobe. */
function CarregandoCena() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="text-[14px] font-medium text-[#6D675C] motion-safe:animate-pulse">
        Dando forma…
      </span>
    </div>
  );
}

// A cena só existe no cliente (WebGL): o import dinâmico dá o "Dando forma…"
// enquanto o estúdio claro (§4.4) e a scroll-driven camera (§4.3) sobem.
const Cena3D = dynamic(() => import("./Cena3D"), {
  ssr: false,
  loading: CarregandoCena,
});

/**
 * Os modos como o visitante lê (rótulo "Inventar" é só apresentação — o
 * estado interno, o ?c= e o núcleo continuam falando "criar").
 */
const MODOS: [Modo, string][] = [
  ["montar", "Montar"],
  ["criar", "Inventar"],
];

/** Sombra suave e fosca dos elementos que flutuam sobre o palco (§2). */
const SOMBRA_CARD = "shadow-[0_16px_44px_-20px_rgba(30,30,30,0.45)]";

/** Alturas do bottom sheet em <md (§5), em % da tela: pico · meia · cheia. */
const ALTURAS_SHEET = [15, 45, 85];

/** Pills discretas do bloco de produção (STL / kit F5). */
const PILL_PRODUCAO =
  "rounded-full border border-black/10 bg-black/[0.02] px-2.5 py-1 text-[#6D675C] transition-colors hover:border-black/30 hover:text-palco-escuro disabled:opacity-40";

export default function Configurador() {
  const [modo, setModo] = useState<Modo>("montar");
  const [iBase, setIBase] = useState(0);
  const [iCorpo, setICorpo] = useState(0);
  const [iDifusor, setIDifusor] = useState(0);
  const [cores, setCores] = useState<CoresPartes>({
    base: 0,
    corpo: 0,
    difusor: 1,
  });
  /** Pilha de estruturais entre a base e o corpo (índices, de baixo para cima). */
  const [estruturais, setEstruturais] = useState<number[]>([]);
  /** Cor de cada bloco da pilha (modo blocos: cada peça imprime separada). */
  const [coresEstruturais, setCoresEstruturais] = useState<number[]>([]);
  const [alvoCor, setAlvoCor] = useState<AlvoCor>("all");
  const [iFaceta, setIFaceta] = useState(0);
  /** ESTICAR: proporção da seção (1 = redonda; <1 = oval/retângulo). */
  const [proporcao, setProporcao] = useState(1);
  const [luzAcesa, setLuzAcesa] = useState(true);
  const [pontosDeLuz, setPontosDeLuz] = useState<1 | 2>(1);
  const [separacaoMm, setSeparacaoMm] = useState(100);
  /** Refletor (PLACA) na segunda coluna — null = sem refletor. */
  const [placa, setPlaca] = useState<ParametrosPlaca | null>(null);
  const [remixDe, setRemixDe] = useState("");
  /** Nome da obra — só apresentação e conta; não entra no ?c=. */
  const [nomeObra, setNomeObra] = useState("");
  const [criar, setCriar] = useState<EstadoCriar>({
    base: { ...BASES[0] },
    corpo: { ...CORPOS[0] },
    difusor: { ...DIFUSORES[0] },
  });
  /** Estúdio aceso? false = "apagar a luz do ambiente" (§4.4). */
  const [ambienteAceso, setAmbienteAceso] = useState(true);
  /** Cenário ao redor da obra (§4.4) — preferência local, fora do ?c=. */
  const [cena, setCena] = useState<CenaId>("estudio");
  /** O quarto (GLB) já chegou? Enquanto não, o toggle mostra "Dando forma…". */
  const [quartoPronto, setQuartoPronto] = useState(false);
  /** Seção visível no scroll do painel — guia a câmera (§4.3). */
  const [secaoAtiva, setSecaoAtiva] = useState("base");
  const refRolagem = useRef<HTMLDivElement>(null);
  /** Avança a cada scroll do painel; a cena lê para re-sincronizar a câmera. */
  const refSinalRolagem = useRef(0);

  /** Altura do bottom sheet em <md (§5), em % da tela — começa em meia. */
  const [alturaSheet, setAlturaSheet] = useState(45);
  const refSheet = useRef<HTMLElement>(null);
  /** Arrasto vivo do handle: ponto de partida e altura corrente (em %). */
  const refArrasto = useRef<{ y0: number; h0: number; h: number } | null>(
    null
  );
  /** O click que fecha um arrasto real não deve também ciclar a altura. */
  const refArrastou = useRef(false);

  // O arrasto mexe no DOM direto (60 Hz sem re-render); o snap vira estado.
  function iniciarArrasto(e: PointerEvent<HTMLButtonElement>) {
    refArrasto.current = { y0: e.clientY, h0: alturaSheet, h: alturaSheet };
    refArrastou.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Durante o dedo, o sheet segue na hora — a transição volta no soltar.
    refSheet.current?.style.setProperty("transition", "none");
  }

  function moverArrasto(e: PointerEvent<HTMLButtonElement>) {
    const a = refArrasto.current;
    if (!a) return;
    if (Math.abs(e.clientY - a.y0) > 6) refArrastou.current = true;
    a.h = Math.min(
      85,
      Math.max(15, a.h0 + ((a.y0 - e.clientY) / window.innerHeight) * 100)
    );
    refSheet.current?.style.setProperty(
      "--altura-sheet",
      `${a.h.toFixed(2)}dvh`
    );
  }

  function soltarArrasto() {
    const a = refArrasto.current;
    if (!a) return;
    refArrasto.current = null;
    refSheet.current?.style.removeProperty("transition");
    // Snap para a altura mais próxima (§5) — a transição CSS leva até lá.
    const destino = ALTURAS_SHEET.reduce((m, h) =>
      Math.abs(h - a.h) < Math.abs(m - a.h) ? h : m
    );
    setAlturaSheet(destino);
    refSheet.current?.style.setProperty("--altura-sheet", `${destino}dvh`);
  }

  /** Teclado no handle: ↑ sobe um degrau, ↓ desce (§6 — foco operável). */
  function alturaPeloTeclado(e: KeyboardEvent<HTMLButtonElement>) {
    const i = ALTURAS_SHEET.indexOf(alturaSheet);
    if (e.key === "ArrowUp" && i < ALTURAS_SHEET.length - 1) {
      e.preventDefault();
      setAlturaSheet(ALTURAS_SHEET[i + 1]);
    } else if (e.key === "ArrowDown" && i > 0) {
      e.preventDefault();
      setAlturaSheet(ALTURAS_SHEET[i - 1]);
    }
  }

  /** Toque seco (ou Enter/Espaço) no handle cicla pico → meia → cheia. */
  function ciclarAltura() {
    if (refArrastou.current) {
      refArrastou.current = false;
      return;
    }
    const i = ALTURAS_SHEET.indexOf(alturaSheet);
    setAlturaSheet(ALTURAS_SHEET[(i + 1) % ALTURAS_SHEET.length]);
  }

  // A seção ativa vem de um IntersectionObserver no contêiner de scroll do
  // painel (root = o próprio contêiner): vence a seção que mais ocupa o
  // terço de cima; com o painel todo rolado, vence a última (§4.3).
  useEffect(() => {
    const raiz = refRolagem.current;
    if (!raiz) return;
    const secoes = Array.from(
      raiz.querySelectorAll<HTMLElement>("[data-secao]")
    );
    if (secoes.length === 0) return;
    const visiveis = new Map<string, number>();
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const id = (e.target as HTMLElement).dataset.secao;
          if (id) {
            visiveis.set(id, e.isIntersecting ? e.intersectionRect.height : 0);
          }
        }
        const noFim =
          raiz.scrollTop > 0 &&
          raiz.scrollTop + raiz.clientHeight >= raiz.scrollHeight - 8;
        let ativa: string | undefined;
        if (noFim) {
          ativa = secoes[secoes.length - 1].dataset.secao;
        } else {
          let maior = 0;
          for (const s of secoes) {
            const id = s.dataset.secao;
            const v = id ? (visiveis.get(id) ?? 0) : 0;
            if (v > maior) {
              maior = v;
              ativa = id;
            }
          }
        }
        if (ativa) setSecaoAtiva(ativa);
      },
      // A faixa de leitura é o terço de cima do painel.
      {
        root: raiz,
        rootMargin: "0px 0px -70% 0px",
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    );
    secoes.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [modo]);

  // Hidrata a preferência de cenário do localStorage (só existe no cliente;
  // o SSR renderiza "estudio" e o cliente corrige na montagem, sem mismatch).
  useEffect(() => {
    const guardada = cenaValida(window.localStorage.getItem(CHAVE_CENA));
    if (guardada && guardada !== "estudio") {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- sincronização
         única localStorage→estado na montagem: o storage é o sistema externo. */
      setCena(guardada);
    }
  }, []);

  /** Troca o cenário e guarda a escolha — ela NÃO entra no ?c= (link). */
  function trocarCena(c: CenaId) {
    setCena(c);
    try {
      window.localStorage.setItem(CHAVE_CENA, c);
    } catch {
      // Sem storage (modo privado etc.): a troca vale só nesta visita.
    }
  }

  /** O cenário pedido terminou de carregar — o pill "Dando forma…" sai. */
  const aoProntoCena = useCallback((id: CenaId) => {
    if (id === "quarto") setQuartoPronto(true);
  }, []);

  // Carrega a criação do link (?c=...) uma única vez, ao abrir.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("c");
    if (!param) return;
    const c = decodificarCriacao(param);
    if (!c) return;
    /* eslint-disable react-hooks/set-state-in-effect -- sincronização única
       URL→estado na montagem: a URL é o sistema externo aqui, e o estado só
       pode ser lido no cliente (window). */
    setModo(c.modo);
    setIBase(c.iBase);
    setICorpo(c.iCorpo);
    setIDifusor(c.iDifusor);
    setCores(c.cores);
    setEstruturais(c.estruturais);
    setCoresEstruturais(c.coresEstruturais ?? []);
    setIFaceta(c.iFaceta);
    setProporcao(c.proporcao ?? 1);
    setLuzAcesa(c.luzAcesa);
    setPontosDeLuz(c.pontosDeLuz);
    setSeparacaoMm(c.separacaoMm);
    setPlaca(c.placa);
    setCriar(c.criar);
    setRemixDe(
      c.remixDe || `${CORPOS[c.iCorpo].nome} + ${DIFUSORES[c.iDifusor].nome}`
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Espelha a criação atual na URL — o endereço da página é sempre o link dela.
  useEffect(() => {
    const t = setTimeout(() => {
      const codigo = codificarCriacao({
        v: 1,
        modo,
        iBase,
        iCorpo,
        iDifusor,
        cores,
        estruturais,
        coresEstruturais,
        iFaceta,
        proporcao,
        luzAcesa,
        pontosDeLuz,
        separacaoMm,
        placa,
        criar,
        remixDe,
      });
      window.history.replaceState(null, "", `?c=${codigo}`);
    }, 300);
    return () => clearTimeout(t);
  }, [
    modo,
    iBase,
    iCorpo,
    iDifusor,
    cores,
    estruturais,
    coresEstruturais,
    iFaceta,
    proporcao,
    luzAcesa,
    pontosDeLuz,
    separacaoMm,
    placa,
    criar,
    remixDe,
  ]);

  const [copiado, setCopiado] = useState(false);
  async function copiarLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function trocarModo(m: Modo) {
    if (m === "criar" && modo !== "criar") {
      setCriar({
        base: { ...BASES[iBase] },
        corpo: { ...CORPOS[iCorpo] },
        difusor: { ...DIFUSORES[iDifusor] },
      });
      setRemixDe(`${CORPOS[iCorpo].nome} + ${DIFUSORES[iDifusor].nome}`);
    }
    setModo(m);
  }

  // Cor efetiva de cada bloco da pilha (sem cor própria = cor do corpo).
  const coresEstruturaisEfetivas = estruturais.map(
    (_, k) => coresEstruturais[k] ?? cores.corpo
  );
  function setCorEstrutural(k: number, i: number) {
    const nova = estruturais.map(
      (_, j) => coresEstruturais[j] ?? cores.corpo
    );
    nova[k] = i;
    setCoresEstruturais(nova);
  }
  /** Duplicar bloco (×N do modo blocos): nasce igual, logo acima, com a cor. */
  function duplicarEstrutural(k: number) {
    setEstruturais([
      ...estruturais.slice(0, k + 1),
      estruturais[k],
      ...estruturais.slice(k + 1),
    ]);
    const c = coresEstruturaisEfetivas;
    setCoresEstruturais([...c.slice(0, k + 1), c[k], ...c.slice(k + 1)]);
  }
  function removerEstrutural(k: number) {
    setEstruturais(estruturais.filter((_, j) => j !== k));
    setCoresEstruturais(coresEstruturaisEfetivas.filter((_, j) => j !== k));
  }

  function escolherCor(i: number) {
    if (alvoCor === "all") setCores({ base: i, corpo: i, difusor: i });
    else setCores({ ...cores, [alvoCor]: i });
  }

  const base = modo === "montar" ? BASES[iBase] : criar.base;
  const segmentos = modo === "montar" ? 40 : FACETAS[iFaceta].segmentos;
  const expoente = modo === "montar" ? undefined : FACETAS[iFaceta].expoente;
  const proporcaoEfetiva = modo === "montar" || proporcao >= 0.999 ? undefined : proporcao;

  // A pilha de estruturais sobe o corpo e o difusor: para a física (CG,
  // alargamento E2) o efeito é o de um corpo mais alto na mesma coluna.
  const pecasEstruturais = useMemo(
    () => estruturais.map((i) => ESTRUTURAIS[i]),
    [estruturais]
  );

  const difusorBruto = modo === "montar" ? DIFUSORES[iDifusor] : criar.difusor;
  // Gola × difusor: a gola só sobe enquanto o difusor couber dentro dela —
  // mesma função determinística que o backend usa (preview = produção).
  const corpoBruto = useMemo(
    () =>
      ajustarGolaAoDifusor(
        modo === "montar" ? CORPOS[iCorpo] : criar.corpo,
        difusorBruto
      ),
    [modo, iCorpo, criar.corpo, difusorBruto]
  );

  // Composição dupla (2 luzes ou luz + refletor): separação sobe até as
  // colunas terem ar; se nem o teto der conta, o raio do difusor raseia; a
  // curva S "para dentro" para onde o ar acaba — a MESMA função do backend
  // (auditoria A2–A4).
  const dupla = pontosDeLuz === 2 || !!placa;
  const comp = useMemo(
    () =>
      dupla
        ? ajustarComposicaoDupla(corpoBruto, difusorBruto, pecasEstruturais, {
            comPlaca: !!placa,
            separacaoPedidaMm: separacaoMm,
            separacaoTetoMm: separacaoMaximaMm(
              base.raioMm,
              1,
              segmentos <= 16 ? segmentos : 0,
              expoente
            ),
          })
        : null,
    [dupla, corpoBruto, difusorBruto, pecasEstruturais, placa, separacaoMm, base.raioMm, segmentos, expoente]
  );
  const corpo = comp?.corpo ?? corpoBruto;
  const difusor = comp?.difusor ?? difusorBruto;
  const separacaoEfetivaMm = comp?.separacaoMm ?? separacaoMm;

  const texturas = useMemo(
    () => ({
      corpo: {
        gomos: corpo.gomos,
        profundidadeMm: corpo.profundidadeGomosMm,
        torcaoGraus: corpo.torcaoGraus,
        alturaMm: corpo.alturaMm,
        familia: corpo.familiaTextura,
        repeticao: corpo.repeticaoTextura,
        // S2: nem o vale do sulco entra no cilindro do miolo elétrico.
        pisoMm: RAIO_LIVRE_MIOLO_MM,
      },
      difusor: {
        gomos: difusor.gomos,
        profundidadeMm: difusor.profundidadeGomosMm,
        torcaoGraus: 0,
        alturaMm: difusor.alturaMm,
      },
    }),
    [corpo, difusor]
  );

  const alturaEstruturaisMm = pecasEstruturais.reduce(
    (s, p) => s + p.alturaMm,
    0
  );
  const corpoParaFisica = useMemo(
    () =>
      alturaEstruturaisMm > 0
        ? { ...corpo, alturaMm: corpo.alturaMm + alturaEstruturaisMm }
        : corpo,
    [corpo, alturaEstruturaisMm]
  );

  // Com refletor a base é dupla: a estabilidade roda no modo de duas
  // colunas (conservador — a placa é mais leve que uma coluna de luz;
  // o desvio para trás da placa inclinada ainda não entra no CG ⚑).
  // ESTICADA, a base tem eixo curto: E1/E2 usam o raio MENOR (conservador —
  // o tombamento agora tem direção fácil, e a regra olha para ela).
  const estab = useMemo(
    () =>
      estabilidade(
        proporcaoEfetiva
          ? { ...base, raioMm: base.raioMm * proporcaoEfetiva }
          : base,
        corpoParaFisica,
        difusor,
        placa ? 2 : pontosDeLuz,
        desvioCabecaMm(difusor, difusor.junta)
      ),
    [base, corpoParaFisica, difusor, pontosDeLuz, placa, proporcaoEfetiva]
  );
  const perfis = useMemo(
    () => ({
      base: perfilBase(base, estab.escala, pontosDeLuz === 1 && !placa),
      corpo: perfilCorpo(corpo),
      difusor: perfilDifusor(difusor),
      estruturais: pecasEstruturais.map((p) => perfilEstrutural(p)),
    }),
    [base, corpo, difusor, estab.escala, pontosDeLuz, placa, pecasEstruturais]
  );
  const { gramas, precoBRL } = useMemo(
    () =>
      estimarPreco(
        perfis.base,
        perfis.corpo,
        perfis.difusor,
        pontosDeLuz,
        perfis.estruturais,
        placa ? perfisPlacaParaPeso(placa) : []
      ),
    [perfis, pontosDeLuz, placa]
  );
  // E3: corpo debruçado além do que a base alargada segura pede um inserto
  // de peso na base — item de produção, o STL não muda.
  const contrapesoG = useMemo(
    () => contrapesoNecessarioG(estab, base.raioMm, gramas),
    [estab, base.raioMm, gramas]
  );

  // Quantas peças impressas chegam na caixa: a base + (corpo, difusor e
  // pilha) por coluna de luz + o refletor. Só apresentação — o peso já vem
  // do estimarPreco.
  const colunasDeLuz = pontosDeLuz === 2 ? 2 : 1;
  const numPartes =
    1 + colunasDeLuz * (2 + pecasEstruturais.length) + (placa ? 1 : 0);

  const espinhaCorpo = useMemo(
    () => ({
      deslocamentoMm: corpo.deslocamentoMm,
      posicaoDobra: corpo.posicaoDobra,
      alturaMm: corpo.alturaMm,
    }),
    [corpo]
  );

  const [gerandoSTL, setGerandoSTL] = useState<string | null>(null);
  async function baixarSTL(
    parte: ParteAlvo | "estrutural" | "placa",
    indice = 0
  ) {
    const chave = parte === "estrutural" ? `estrutural-${indice}` : parte;
    setGerandoSTL(chave);
    try {
      const resp = await fetch("/api/stl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parte,
          indice,
          base,
          corpo,
          difusor,
          estruturais: pecasEstruturais,
          segmentos,
          expoente,
          proporcao: proporcaoEfetiva,
          pontosDeLuz,
          separacaoMm,
          placa,
        }),
      });
      if (!resp.ok) return;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        parte === "estrutural"
          ? `per-parte-peca-${indice + 1}.stl`
          : `per-parte-${parte}.stl`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGerandoSTL(null);
    }
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-palco-claro text-palco-escuro">
      {/* Viewport 3D full-bleed — o palco ocupa a tela inteira, por trás (§4.1) */}
      <div className="absolute inset-0">
        <Cena3D
          perfis={perfis}
          alturasMm={{
            base: base.alturaMm,
            corpo: corpo.alturaMm,
            difusor: difusor.alturaMm,
            estruturais: pecasEstruturais.map((p) => p.alturaMm),
          }}
          coresHex={{
            base: PALETA[cores.base].hex,
            corpo: PALETA[cores.corpo].hex,
            difusor: PALETA[cores.difusor].hex,
            estruturais: coresEstruturaisEfetivas.map((i) => PALETA[i].hex),
          }}
          segmentos={segmentos}
          expoente={expoente}
          proporcao={proporcaoEfetiva}
          luzAcesa={luzAcesa}
          texturas={texturas}
          espinhaCorpo={espinhaCorpo}
          pontosDeLuz={pontosDeLuz}
          separacaoMm={separacaoEfetivaMm}
          vazadoDifusor={difusor.vazado}
          corteDifusor={difusor.corte}
          corteCorpo={corpo.gola ? corpo.corte : undefined}
          placa={placa}
          difusorInclinado={
            difusor.junta ? { difusor, junta: difusor.junta } : undefined
          }
          secaoAtiva={secaoAtiva}
          ambienteAceso={ambienteAceso}
          sinalRolagem={refSinalRolagem}
          cena={cena}
          aoProntoCena={aoProntoCena}
        />
        {/* Vinheta MUITO sutil nas bordas do palco — profundidade sem pós. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 100% at 50% 44%, transparent 58%, rgba(26,25,23,0.07) 100%)",
          }}
        />
      </div>

      {/* Toggle de cena Estúdio · Cenário — flutua no alto do palco (§4.4). */}
      <ToggleCena
        cena={cena}
        aoTrocar={trocarCena}
        preparando={cena === "quarto" && !quartoPronto}
      />

      {/* Topo esquerdo: wordmark (volta para a landing) */}
      <Link
        href="/"
        className={`absolute left-3 top-4 z-10 rounded-full bg-white px-4 py-2 font-display text-[17px] leading-none text-palco-escuro transition-colors duration-300 ease-padrao hover:text-[#8A5F10] md:left-6 md:top-5 ${SOMBRA_CARD}`}
      >
        Per Parte
      </Link>

      {/* Topo direito do viewport: guardar + copiar link (§4.1/§4.5) */}
      <div className="absolute right-3 top-4 z-10 flex flex-col items-end gap-2 md:right-[432px] md:top-5 md:flex-row md:items-center">
        <BotaoSalvar nome={nomeObra} />
        <button
          onClick={copiarLink}
          className={`rounded-full bg-white px-4 py-2 text-[12.5px] font-medium transition-colors duration-300 ease-padrao ${SOMBRA_CARD} ${
            copiado
              ? "text-[#4F7A44]"
              : "text-palco-escuro hover:text-[#8A5F10]"
          }`}
        >
          {copiado ? "Link da sua obra copiado." : "Copiar link"}
        </button>
      </div>

      {/* Em <md, tudo que mora na borda de baixo (barra compacta + bottom
          sheet) empilha neste wrapper; em md+ ele vira display:contents e
          cada peça volta ao seu canto absoluto — desktop fica como está (§5). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col md:contents">
        {/* Barra compacta acima do sheet: preço sempre visível + chip de
            partes + interruptor (§5); em md+, os cards flutuantes de §4.1 */}
        <div className="mb-2 flex items-end justify-between gap-2 px-3 md:contents">
          {/* Cards do preço: o preço evolutivo virando experiência (§4.1) */}
          <div className="pointer-events-none z-10 flex min-w-0 items-center gap-2 md:absolute md:bottom-6 md:left-6 md:block">
            <div
              className={`w-fit rounded-full bg-white px-4 py-2.5 md:rounded-[var(--raio-painel)] md:px-5 md:py-4 ${SOMBRA_CARD}`}
            >
              <div className="font-display text-[19px] leading-none tabular-nums md:text-[34px]">
                R$ <NumeroAnimado valor={precoBRL} />
              </div>
              <div className="mt-1.5 hidden text-[11px] text-[#6D675C] md:block">
                evolui com a sua criação
              </div>
            </div>
            <div
              className={`w-fit truncate rounded-full bg-white px-3.5 py-2 text-[11.5px] tabular-nums text-[#4A463D] md:mt-2 ${SOMBRA_CARD}`}
            >
              {numPartes} partes · {Math.round(gramas)} g
            </div>
          </div>

          {/* Interruptor do estúdio: apagar a luz do ambiente e ver a obra
              brilhando no escuro — o momento-marca (§4.4). Na barra, nunca
              embaixo do sheet. */}
          <button
            onClick={() => setAmbienteAceso((v) => !v)}
            aria-pressed={!ambienteAceso}
            aria-label={
              ambienteAceso
                ? "Apagar a luz do ambiente"
                : "Acender a luz do ambiente"
            }
            title={
              ambienteAceso
                ? "Apagar a luz do ambiente"
                : "Acender a luz do ambiente"
            }
            className={`pointer-events-auto z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ease-padrao md:absolute md:bottom-6 md:right-[432px] ${SOMBRA_CARD} ${
              ambienteAceso
                ? "bg-white text-palco-escuro hover:text-[#8A5F10]"
                : "bg-palco-escuro text-luz-acesa"
            }`}
          >
            {/* ícone de interruptor — a tecla desce quando o ambiente apaga */}
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              aria-hidden
            >
              <rect
                x="7"
                y="3.5"
                width="10"
                height="17"
                rx="5"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <circle
                cx="12"
                cy={ambienteAceso ? 8.5 : 15.5}
                r="2.4"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Painel de ferramentas — bottom sheet em <md (§5), coluna branca
            à direita em md+ (§4.1) */}
        <aside
          ref={refSheet}
          style={{ "--altura-sheet": `${alturaSheet}dvh` } as CSSProperties}
          className={`pointer-events-auto z-20 flex h-[var(--altura-sheet)] flex-col overflow-hidden rounded-t-[var(--raio-painel)] bg-white transition-[height] duration-300 ease-padrao motion-reduce:transition-none md:absolute md:bottom-4 md:right-4 md:top-4 md:h-auto md:w-[400px] md:rounded-[var(--raio-painel)] md:transition-none ${SOMBRA_CARD}`}
        >
          {/* Handle do sheet (§5): arrasta com snap pico/meia/cheia; toque
              seco cicla as alturas; setas ↑↓ pelo teclado */}
          <button
            type="button"
            aria-label="Ajustar a altura do painel — pico, meia tela ou tela cheia"
            className="block w-full shrink-0 cursor-grab touch-none select-none pb-2 pt-2.5 active:cursor-grabbing md:hidden"
            onPointerDown={iniciarArrasto}
            onPointerMove={moverArrasto}
            onPointerUp={soltarArrasto}
            onPointerCancel={soltarArrasto}
            onClick={ciclarAltura}
            onKeyDown={alturaPeloTeclado}
          >
            <span
              aria-hidden
              className="mx-auto block h-1 w-10 rounded-full bg-black/45"
            />
          </button>

          {/* Topo fixo do painel: switch de modo + nome da obra (§4.1) */}
          <div className="shrink-0 border-b border-black/[0.06] px-5 pb-3.5 pt-2 md:pt-4">
          <div className="flex rounded-full bg-black/[0.05] p-1">
            {MODOS.map(([id, rotulo]) => (
              <button
                key={id}
                onClick={() => trocarModo(id)}
                aria-pressed={modo === id}
                className={`flex-1 rounded-full py-2 text-[13px] transition-all duration-300 ease-padrao ${
                  modo === id
                    ? "bg-palco-escuro font-semibold text-luz-acesa"
                    : "text-[#6D675C] hover:text-palco-escuro"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={nomeObra}
            onChange={(e) => setNomeObra(e.target.value)}
            placeholder="Minha obra"
            maxLength={60}
            aria-label="Nome da obra"
            className="mt-3 w-full border-b border-transparent bg-transparent pb-1 text-[15px] font-medium text-palco-escuro placeholder-[#6D675C] outline-none transition-colors duration-200 ease-padrao focus:border-black/15"
          />
        </div>

        {/* Um único scroll com todas as seções (data-secao) — é ele que guia a câmera (§4.3) */}
        <div
          ref={refRolagem}
          onScroll={() => {
            refSinalRolagem.current += 1;
          }}
          className="rolagem min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {modo === "montar" ? (
            <PainelMontar
              iBase={iBase}
              iCorpo={iCorpo}
              iDifusor={iDifusor}
              escolherBase={setIBase}
              escolherCorpo={setICorpo}
              escolherDifusor={setIDifusor}
              estruturais={estruturais}
              setEstruturais={setEstruturais}
              coresEstruturais={coresEstruturaisEfetivas}
              setCorEstrutural={setCorEstrutural}
              duplicarEstrutural={duplicarEstrutural}
              removerEstrutural={removerEstrutural}
              cores={cores}
              alvoCor={alvoCor}
              setAlvoCor={setAlvoCor}
              escolherCor={escolherCor}
              pontosDeLuz={pontosDeLuz}
              separacaoMm={separacaoMm}
              setPontosDeLuz={setPontosDeLuz}
              setSeparacaoMm={setSeparacaoMm}
              placa={placa}
              setPlaca={setPlaca}
              separacaoEfetivaMm={separacaoEfetivaMm}
              luzAcesa={luzAcesa}
              setLuzAcesa={setLuzAcesa}
            />
          ) : (
            <PainelCriar
              criar={criar}
              aoMudar={setCriar}
              remixDe={remixDe}
              iFaceta={iFaceta}
              setIFaceta={setIFaceta}
              proporcao={proporcao}
              setProporcao={setProporcao}
              estab={estab}
              contrapesoG={contrapesoG}
              cores={cores}
              alvoCor={alvoCor}
              setAlvoCor={setAlvoCor}
              escolherCor={escolherCor}
              pontosDeLuz={pontosDeLuz}
              separacaoMm={separacaoMm}
              setPontosDeLuz={setPontosDeLuz}
              setSeparacaoMm={setSeparacaoMm}
              placa={placa}
              setPlaca={setPlaca}
              separacaoEfetivaMm={separacaoEfetivaMm}
              raioDifusorTetoMm={comp?.raioDifusorTetoMm}
              tetoDeslocInternoMm={comp?.tetoInternoMm}
              luzAcesa={luzAcesa}
              setLuzAcesa={setLuzAcesa}
            />
          )}

          {/* Produção — STL por parte e kit de calibração (mesmo arquivo que imprime) */}
          <div className="border-t border-black/[0.06] px-5 pb-6 pt-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#6D675C]">
              Produção
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#6D675C]">
              <span>STL:</span>
              {(["base", "corpo", "difusor"] as const).map((p) => {
                const travadoPorVazado = p === "difusor" && !!difusor.vazado;
                return (
                  <button
                    key={p}
                    onClick={() => baixarSTL(p)}
                    disabled={gerandoSTL !== null || travadoPorVazado}
                    title={
                      travadoPorVazado
                        ? "difusor vazado: preview pronto, produção em preparação — tire o vazado para gerar o STL"
                        : undefined
                    }
                    className={PILL_PRODUCAO}
                  >
                    {gerandoSTL === p
                      ? "gerando…"
                      : travadoPorVazado
                        ? "difusor ⚑"
                        : p}
                  </button>
                );
              })}
              {pecasEstruturais.map((p, k) => (
                <button
                  key={`estrutural-${k}`}
                  onClick={() => baixarSTL("estrutural", k)}
                  disabled={gerandoSTL !== null}
                  className={PILL_PRODUCAO}
                >
                  {gerandoSTL === `estrutural-${k}`
                    ? "gerando…"
                    : p.nome.toLowerCase()}
                </button>
              ))}
              {placa && (
                <button
                  onClick={() => baixarSTL("placa")}
                  disabled={gerandoSTL !== null}
                  className={PILL_PRODUCAO}
                >
                  {gerandoSTL === "placa" ? "gerando…" : "refletor"}
                </button>
              )}
              <span className="ml-1.5">kit F5:</span>
              {[0.2, 0.3, 0.4].map((f) => (
                <a
                  key={f}
                  href={`/api/calibracao?folgaMm=${f}`}
                  className={PILL_PRODUCAO}
                >
                  {String(f).replace(".", ",")}
                </a>
              ))}
            </div>
          </div>
        </div>

          {/* Rodapé do painel: o CTA da loja */}
          <div className="shrink-0 border-t border-black/[0.06] px-4 py-3">
            <button className="w-full rounded-full bg-palco-escuro py-3 text-[14px] font-semibold text-luz-acesa transition-colors duration-300 ease-padrao hover:bg-acento hover:text-palco-escuro">
              Encomendar
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
