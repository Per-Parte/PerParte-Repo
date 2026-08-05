"use client";

import { useState } from "react";
import {
  amostrarRaiosCorpo,
  deslocamentoMaximoMm,
  DIFUSORES,
  golaMaximaMm,
  JUNTA_PADRAO,
  LIMITES_JUNTA,
  perfilDifusor,
  FACETAS,
  FAMILIAS_TEXTURA,
  LIMITES_CORTE_BORDA,
  LIMITES_CRIAR,
  LIMITES_VAZADO,
  NOMES_FAMILIAS,
  PADROES_VAZADO,
  profundidadeMaximaCorteMm,
  REGRAS,
  TIPOS_CORTE_BORDA,
  type CurvaBase,
  type FamiliaTextura,
  type ParametrosPlaca,
  type ResultadoEstabilidade,
} from "@per-parte/nucleo";
import {
  Chips,
  PaletaFamilias,
  PontosDeLuzCtl,
  Secao,
  SliderCtl,
  SubRotulo,
} from "./controles";
import EditorSilhueta from "./EditorSilhueta";
import type { AlvoCor, CoresPartes, EstadoCriar } from "./Configurador";

const cm = (mm: number) => (mm / 10).toFixed(1).replace(".", ",");
const fmtPos = (v: number) => (v < -0.15 ? "baixo" : v > 0.15 ? "alto" : "centro");

const CURVAS: { valor: CurvaBase; nome: string }[] = [
  { valor: "reta", nome: "Reta" },
  { valor: "cone", nome: "Cone" },
  { valor: "concava", nome: "Côncava" },
  { valor: "degrau", nome: "Degrau" },
];

const ALVOS: { id: AlvoCor; rotulo: string }[] = [
  { id: "all", rotulo: "tudo" },
  { id: "base", rotulo: "base" },
  { id: "corpo", rotulo: "corpo" },
  { id: "difusor", rotulo: "difusor" },
];

interface Props {
  criar: EstadoCriar;
  aoMudar: (c: EstadoCriar) => void;
  remixDe: string;
  iFaceta: number;
  setIFaceta: (i: number) => void;
  estab: ResultadoEstabilidade;
  /** E3: gramas de inserto na base (0 = fica de pé sozinha). */
  contrapesoG: number;
  cores: CoresPartes;
  alvoCor: AlvoCor;
  setAlvoCor: (a: AlvoCor) => void;
  escolherCor: (i: number) => void;
  pontosDeLuz: number;
  separacaoMm: number;
  setPontosDeLuz: (n: 1 | 2) => void;
  setSeparacaoMm: (v: number) => void;
  placa: ParametrosPlaca | null;
  setPlaca: (p: ParametrosPlaca | null) => void;
  luzAcesa: boolean;
  setLuzAcesa: (v: boolean) => void;
}

/** Painel do modo Criar (rótulo "Inventar") — seções num único scroll (§4.2). */
export default function PainelCriar({
  criar,
  aoMudar,
  remixDe,
  iFaceta,
  setIFaceta,
  estab,
  contrapesoG,
  cores,
  alvoCor,
  setAlvoCor,
  escolherCor,
  pontosDeLuz,
  separacaoMm,
  setPontosDeLuz,
  setSeparacaoMm,
  placa,
  setPlaca,
  luzAcesa,
  setLuzAcesa,
}: Props) {
  const [nomePeca, setNomePeca] = useState("");
  const [publicada, setPublicada] = useState<string | null>(null);
  const corSelecionada = alvoCor === "all" ? cores.corpo : cores[alvoCor];

  const LB = LIMITES_CRIAR.base;
  const LC = LIMITES_CRIAR.corpo;
  const LD = LIMITES_CRIAR.difusor;

  const mudarBase = (campo: "alturaMm" | "raioMm", v: number) =>
    aoMudar({ ...criar, base: { ...criar.base, [campo]: v } });
  const mudarCorpo = (
    campo: Exclude<keyof EstadoCriar["corpo"], never>,
    v: number
  ) => aoMudar({ ...criar, corpo: { ...criar.corpo, [campo]: v } });
  const mudarDifusor = (
    campo: "alturaMm" | "raioMm" | "gomos" | "profundidadeGomosMm",
    v: number
  ) => aoMudar({ ...criar, difusor: { ...criar.difusor, [campo]: v } });

  const iForma = DIFUSORES.findIndex((d) => d.forma === criar.difusor.forma);
  const facetadoComGomos =
    iFaceta > 0 &&
    (criar.corpo.gomos > 0 ||
      !!criar.corpo.familiaTextura ||
      criar.difusor.gomos > 0);
  const modoLivre = !!criar.corpo.perfilLivre;
  const dMax = deslocamentoMaximoMm(criar.corpo.alturaMm);
  // Teto da gola vem do difusor escolhido: a parede nunca encosta nele.
  const tetoGolaMm = criar.corpo.gola
    ? Math.floor(
        golaMaximaMm(perfilDifusor(criar.difusor), criar.corpo.gola.raioMm)
      )
    : LIMITES_CRIAR.corpo.golaAlturaMm.max;
  // E3: a escada da estabilidade — base alarga, contrapeso entra, e só
  // depois disso o aviso de tombamento é honesto.
  const comContrapeso =
    contrapesoG > 0 && contrapesoG <= REGRAS.E.contrapesoMaximoG;
  const tombaMesmo = contrapesoG > REGRAS.E.contrapesoMaximoG;

  return (
    <div>
      <div className="mx-5 mt-3 rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-3.5 py-2.5 text-[11.5px] text-[#6D675C]">
        Você está remixando{" "}
        <b className="text-palco-escuro">{remixDe}</b>. Os encaixes ficam
        travados — o miolo é todo seu.
      </div>

      <Secao id="base" titulo="Base">
        <Chips
          nomes={CURVAS.map((c) => c.nome)}
          selecionado={Math.max(
            0,
            CURVAS.findIndex((c) => c.valor === criar.base.curva)
          )}
          aoEscolher={(i) =>
            aoMudar({ ...criar, base: { ...criar.base, curva: CURVAS[i].valor } })
          }
        />
        <div className="mt-3">
          <SliderCtl
            rotulo="Altura da base"
            valorFmt={`${cm(criar.base.alturaMm)} cm`}
            valor={criar.base.alturaMm}
            min={LB.alturaMm.min}
            max={LB.alturaMm.max}
            passo={LB.alturaMm.passo}
            aoMudar={(v) => mudarBase("alturaMm", v)}
          />
          <SliderCtl
            rotulo="Largura da base"
            valorFmt={`Ø ${Math.round(criar.base.raioMm / 5)} cm`}
            valor={criar.base.raioMm}
            min={LB.raioMm.min}
            max={LB.raioMm.max}
            passo={LB.raioMm.passo}
            aoMudar={(v) => mudarBase("raioMm", v)}
            nota="se a criação ficar pesada no topo, a base alarga sozinha (E2)"
            motivoMax="Mais larga não cabe no prato da impressora."
            motivoMin="Menor que isso a base não segura o conjunto em pé — e o encaixe precisa caber nela."
          />
        </div>
      </Secao>

      <Secao id="corpo" titulo="Corpo">
        <SliderCtl
          rotulo="Altura"
          valorFmt={`${cm(criar.corpo.alturaMm)} cm`}
          valor={criar.corpo.alturaMm}
          min={LC.alturaMm.min}
          max={LC.alturaMm.max}
          passo={LC.alturaMm.passo}
          aoMudar={(v) => mudarCorpo("alturaMm", v)}
          nota={`regra: ${LC.alturaMm.min / 10}–${LC.alturaMm.max / 10} cm — acima disso a peça não cabe na impressora`}
          motivoMax={`A impressora vai até ${LC.alturaMm.max / 10} cm por peça. Quer mais alta? No modo Montar, some hastes na seção Corpo — é assim que a luminária passa de meio metro.`}
        />
        {!modoLivre && (
        <>
        <SliderCtl
          rotulo="Volume do bojo"
          valorFmt={`${criar.corpo.volumeBojoMm >= 0 ? "+" : ""}${cm(criar.corpo.volumeBojoMm)} cm`}
          valor={criar.corpo.volumeBojoMm}
          min={LC.volumeBojoMm.min}
          max={LC.volumeBojoMm.max}
          passo={LC.volumeBojoMm.passo}
          aoMudar={(v) => mudarCorpo("volumeBojoMm", v)}
          nota="regra: parede mínima e distância do miolo elétrico preservadas"
          motivoMax="Mais volume inclinaria a parede além do que imprime sem suporte — e suporte estraga o acabamento."
          motivoMin="Afinar mais encostaria no miolo elétrico, que precisa de folga livre por segurança."
        />
        <SliderCtl
          rotulo="Posição do bojo"
          valorFmt={fmtPos(criar.corpo.posicaoBojo)}
          valor={criar.corpo.posicaoBojo}
          min={LC.posicaoBojo.min}
          max={LC.posicaoBojo.max}
          passo={LC.posicaoBojo.passo}
          aoMudar={(v) => mudarCorpo("posicaoBojo", v)}
        />
        <SliderCtl
          rotulo="Ondulação"
          valorFmt={`${criar.corpo.ondulacao} ondas`}
          valor={criar.corpo.ondulacao}
          min={LC.ondulacao.min}
          max={LC.ondulacao.max}
          passo={LC.ondulacao.passo}
          aoMudar={(v) => mudarCorpo("ondulacao", v)}
        />
        <SliderCtl
          rotulo="Profundidade da onda"
          valorFmt={`${criar.corpo.amplitudeOndaMm.toFixed(1).replace(".", ",")} mm`}
          valor={criar.corpo.amplitudeOndaMm}
          min={LC.amplitudeOndaMm.min}
          max={LC.amplitudeOndaMm.max}
          passo={LC.amplitudeOndaMm.passo}
          aoMudar={(v) => mudarCorpo("amplitudeOndaMm", v)}
          nota={`regra: até ${LC.amplitudeOndaMm.max} mm — mais que isso vira balanço > ${REGRAS.F.balancoMaximoGraus}° e não imprime limpo`}
          motivoMax={`Onda mais profunda inclinaria a parede além de ${REGRAS.F.balancoMaximoGraus}° e a peça pediria suporte, que estraga o acabamento.`}
        />
        </>
        )}

        <SubRotulo>Silhueta livre (modo hard)</SubRotulo>
        {!modoLivre ? (
          <button
            onClick={() =>
              aoMudar({
                ...criar,
                corpo: {
                  ...criar.corpo,
                  perfilLivre: amostrarRaiosCorpo(criar.corpo),
                },
              })
            }
            className="w-full rounded-full border border-acento/60 bg-acento/10 py-2.5 text-[12.5px] font-semibold text-[#8A5F10] transition-colors hover:bg-acento/20"
          >
            Esculpir a silhueta — arrastar as arestas
          </button>
        ) : (
          <div>
            <EditorSilhueta
              corpo={criar.corpo}
              aoMudar={(raios) =>
                aoMudar({
                  ...criar,
                  corpo: { ...criar.corpo, perfilLivre: raios },
                })
              }
            />
            <button
              onClick={() =>
                aoMudar({
                  ...criar,
                  corpo: { ...criar.corpo, perfilLivre: undefined },
                })
              }
              className="mt-2 w-full rounded-full border border-black/10 bg-black/[0.02] py-2 text-[12px] text-[#6D675C] transition-colors hover:border-black/30 hover:text-palco-escuro"
            >
              voltar aos controles simples
            </button>
          </div>
        )}

        <SubRotulo>Curvar o corpo (S)</SubRotulo>
        <SliderCtl
          rotulo="Deslocamento do topo"
          valorFmt={`${criar.corpo.deslocamentoMm >= 0 ? "+" : ""}${cm(criar.corpo.deslocamentoMm)} cm`}
          valor={criar.corpo.deslocamentoMm}
          min={-dMax}
          max={dMax}
          passo={LC.deslocamentoMm.passo}
          aoMudar={(v) => mudarCorpo("deslocamentoMm", v)}
          nota={`o difusor vai junto para o lado; limite de ±${cm(dMax)} cm vem de F4 e cresce com a altura`}
          motivoMax="Mais inclinado que isso, a espinha pediria suporte. O limite cresce com a altura — um corpo mais alto pode se deslocar mais."
          motivoMin="Mais inclinado que isso, a espinha pediria suporte. O limite cresce com a altura — um corpo mais alto pode se deslocar mais."
        />
        {comContrapeso && (
          <div className="mt-2 text-[10px] text-[#A85A1E]">
            debruçada assim, ela leva um contrapeso de ~{contrapesoG} g dentro
            da base — vai montado, você não vê
          </div>
        )}
        <SliderCtl
          rotulo="Altura da dobra"
          valorFmt={fmtPos(criar.corpo.posicaoDobra)}
          valor={criar.corpo.posicaoDobra}
          min={LC.posicaoDobra.min}
          max={LC.posicaoDobra.max}
          passo={LC.posicaoDobra.passo}
          aoMudar={(v) => mudarCorpo("posicaoDobra", v)}
        />

        <SubRotulo>Berço no topo (gola)</SubRotulo>
        <Chips
          nomes={["Sem berço", "Com berço"]}
          selecionado={criar.corpo.gola ? 1 : 0}
          aoEscolher={(i) =>
            aoMudar({
              ...criar,
              corpo: {
                ...criar.corpo,
                gola:
                  i === 0
                    ? undefined
                    : criar.corpo.gola ?? { alturaMm: 30, raioMm: 50 },
                corte: i === 0 ? undefined : criar.corpo.corte,
              },
            })
          }
        />
        {criar.corpo.gola && (
          <div className="mt-3">
            <SliderCtl
              rotulo="Altura da gola"
              valorFmt={`${cm(criar.corpo.gola.alturaMm)} cm`}
              valor={criar.corpo.gola.alturaMm}
              min={LC.golaAlturaMm.min}
              max={Math.max(
                LC.golaAlturaMm.min,
                Math.min(LC.golaAlturaMm.max, tetoGolaMm)
              )}
              passo={LC.golaAlturaMm.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  corpo: {
                    ...criar.corpo,
                    gola: { ...criar.corpo.gola!, alturaMm: v },
                  },
                })
              }
              nota="a parede sobe acima do encaixe e abraça o difusor — o berço do gesto Weight"
              motivoMax="Mais alto que isso a gola encostaria no difusor — alargue a boca ou escolha um difusor mais fechado."
            />
            <SliderCtl
              rotulo="Boca da gola"
              valorFmt={`Ø ${cm(criar.corpo.gola.raioMm * 2)} cm`}
              valor={criar.corpo.gola.raioMm}
              min={LC.golaRaioMm.min}
              max={LC.golaRaioMm.max}
              passo={LC.golaRaioMm.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  corpo: {
                    ...criar.corpo,
                    gola: { ...criar.corpo.gola!, raioMm: v },
                  },
                })
              }
            />
            <SubRotulo>Borda da gola</SubRotulo>
            <Chips
              nomes={["Reta", ...TIPOS_CORTE_BORDA.map((t) => t.nome)]}
              selecionado={
                criar.corpo.corte
                  ? 1 +
                    TIPOS_CORTE_BORDA.findIndex(
                      (t) => t.id === criar.corpo.corte?.tipo
                    )
                  : 0
              }
              aoEscolher={(i) =>
                aoMudar({
                  ...criar,
                  corpo: {
                    ...criar.corpo,
                    corte:
                      i === 0
                        ? undefined
                        : {
                            tipo: TIPOS_CORTE_BORDA[i - 1].id,
                            profundidadeMm:
                              criar.corpo.corte?.profundidadeMm ?? 14,
                            repeticao: criar.corpo.corte?.repeticao ?? 8,
                          },
                  },
                })
              }
            />
            {criar.corpo.corte && (
              <div className="mt-3">
                <SliderCtl
                  rotulo="Profundidade do corte"
                  valorFmt={`${Math.round(criar.corpo.corte.profundidadeMm)} mm`}
                  valor={criar.corpo.corte.profundidadeMm}
                  min={LIMITES_CORTE_BORDA.profundidadeMm.min}
                  max={Math.max(
                    LIMITES_CORTE_BORDA.profundidadeMm.min,
                    criar.corpo.gola.alturaMm - 8
                  )}
                  passo={LIMITES_CORTE_BORDA.profundidadeMm.passo}
                  aoMudar={(v) =>
                    aoMudar({
                      ...criar,
                      corpo: {
                        ...criar.corpo,
                        corte: { ...criar.corpo.corte!, profundidadeMm: v },
                      },
                    })
                  }
                  nota="oblíqua + esfera dentro = o gesto do Weight"
                  motivoMax="Mais fundo que isso o corte alcançaria o assento do encaixe, que fica rebaixado dentro da gola."
                />
                {criar.corpo.corte.tipo === "dentes" && (
                  <SliderCtl
                    rotulo="Dentes"
                    valorFmt={`${criar.corpo.corte.repeticao ?? 8} dentes`}
                    valor={criar.corpo.corte.repeticao ?? 8}
                    min={LIMITES_CORTE_BORDA.repeticao.min}
                    max={LIMITES_CORTE_BORDA.repeticao.max}
                    passo={LIMITES_CORTE_BORDA.repeticao.passo}
                    aoMudar={(v) =>
                      aoMudar({
                        ...criar,
                        corpo: {
                          ...criar.corpo,
                          corte: { ...criar.corpo.corte!, repeticao: v },
                        },
                      })
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Secao>

      <Secao id="difusor" titulo="Difusor">
        <Chips
          nomes={DIFUSORES.map((d) => d.nome)}
          selecionado={iForma}
          aoEscolher={(i) => aoMudar({ ...criar, difusor: { ...DIFUSORES[i] } })}
        />
        <div className="mt-3">
          <SliderCtl
            rotulo="Altura do difusor"
            valorFmt={`${cm(criar.difusor.alturaMm)} cm`}
            valor={criar.difusor.alturaMm}
            min={LD.alturaMm.min}
            max={LD.alturaMm.max}
            passo={LD.alturaMm.passo}
            aoMudar={(v) => mudarDifusor("alturaMm", v)}
          />
          <SliderCtl
            rotulo="Abertura / largura"
            valorFmt={`Ø ${Math.round(criar.difusor.raioMm / 5)} cm`}
            valor={criar.difusor.raioMm}
            min={LD.raioMm.min}
            max={LD.raioMm.max}
            passo={LD.raioMm.passo}
            aoMudar={(v) => mudarDifusor("raioMm", v)}
            motivoMax="Mais aberto não cabe no prato da impressora."
            motivoMin="Mais fechado que isso, o difusor encostaria na lâmpada — ela precisa de folga livre por segurança."
          />
          <SliderCtl
            rotulo="Plissê (gomos)"
            valorFmt={criar.difusor.gomos === 0 ? "liso" : `${criar.difusor.gomos} gomos`}
            valor={criar.difusor.gomos}
            min={LD.gomos.min}
            max={LD.gomos.max}
            passo={LD.gomos.passo}
            aoMudar={(v) => mudarDifusor("gomos", v)}
          />
          <SliderCtl
            rotulo="Profundidade do plissê"
            valorFmt={`${criar.difusor.profundidadeGomosMm.toFixed(1).replace(".", ",")} mm`}
            valor={criar.difusor.profundidadeGomosMm}
            min={LD.profundidadeGomosMm.min}
            max={LD.profundidadeGomosMm.max}
            passo={LD.profundidadeGomosMm.passo}
            aoMudar={(v) => mudarDifusor("profundidadeGomosMm", v)}
            nota="com a luz acesa, o plissê vira desenho de sombra na parede"
          />
        </div>
        <SubRotulo>Inclinar a cabeça</SubRotulo>
        <Chips
          nomes={["Reta", "Inclinada"]}
          selecionado={criar.difusor.junta ? 1 : 0}
          aoEscolher={(i) =>
            aoMudar({
              ...criar,
              difusor: {
                ...criar.difusor,
                junta: i === 0 ? undefined : criar.difusor.junta ?? { ...JUNTA_PADRAO },
                // A cabeça inclinada é lisa nesta versão. ⚑
                ...(i === 1 ? { vazado: undefined, corte: undefined } : {}),
              },
            })
          }
        />
        {criar.difusor.junta && (
          <div className="mt-3">
            <SliderCtl
              rotulo="Inclinação"
              valorFmt={`${criar.difusor.junta.inclinacaoGraus}°`}
              valor={criar.difusor.junta.inclinacaoGraus}
              min={LIMITES_JUNTA.inclinacaoGraus.min}
              max={LIMITES_JUNTA.inclinacaoGraus.max}
              passo={LIMITES_JUNTA.inclinacaoGraus.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  difusor: {
                    ...criar.difusor,
                    junta: { ...criar.difusor.junta!, inclinacaoGraus: v },
                  },
                })
              }
              nota="a cabeça inteira pende sobre a coluna — o gesto de task light"
              motivoMax="Mais inclinada que isso, as paredes da cabeça pediriam suporte na impressão."
            />
            <SliderCtl
              rotulo="Deslocar a cabeça"
              valorFmt={`${cm(criar.difusor.junta.deslocamentoMm)} cm`}
              valor={criar.difusor.junta.deslocamentoMm}
              min={LIMITES_JUNTA.deslocamentoMm.min}
              max={Math.min(
                LIMITES_JUNTA.deslocamentoMm.max,
                Math.max(0, criar.difusor.raioMm - 25)
              )}
              passo={LIMITES_JUNTA.deslocamentoMm.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  difusor: {
                    ...criar.difusor,
                    junta: { ...criar.difusor.junta!, deslocamentoMm: v },
                  },
                })
              }
              nota="o pescoço cresce sozinho o necessário — a borda nunca toca o encaixe"
              motivoMax="Mais para o lado que isso, a cabeça sairia de cima do próprio pescoço."
            />
            <div className="mt-1 text-[10px] text-[#6D675C]">
              a cabeça inclinada é lisa nesta versão — textura, vazado e borda
              cortada ficam para a cabeça reta ⚑
            </div>
          </div>
        )}
        {!criar.difusor.junta && (
        <>
        <SubRotulo>Borda de cima</SubRotulo>
        <Chips
          nomes={["Reta", ...TIPOS_CORTE_BORDA.map((t) => t.nome)]}
          selecionado={
            criar.difusor.corte
              ? 1 +
                TIPOS_CORTE_BORDA.findIndex(
                  (t) => t.id === criar.difusor.corte?.tipo
                )
              : 0
          }
          aoEscolher={(i) =>
            aoMudar({
              ...criar,
              difusor: {
                ...criar.difusor,
                corte:
                  i === 0
                    ? undefined
                    : {
                        tipo: TIPOS_CORTE_BORDA[i - 1].id,
                        profundidadeMm:
                          criar.difusor.corte?.profundidadeMm ?? 12,
                        repeticao: criar.difusor.corte?.repeticao ?? 8,
                      },
              },
            })
          }
        />
        {criar.difusor.corte && (
          <div className="mt-3">
            <SliderCtl
              rotulo="Profundidade do corte"
              valorFmt={`${Math.round(criar.difusor.corte.profundidadeMm)} mm`}
              valor={criar.difusor.corte.profundidadeMm}
              min={LIMITES_CORTE_BORDA.profundidadeMm.min}
              max={profundidadeMaximaCorteMm(criar.difusor.alturaMm)}
              passo={LIMITES_CORTE_BORDA.profundidadeMm.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  difusor: {
                    ...criar.difusor,
                    corte: { ...criar.difusor.corte!, profundidadeMm: v },
                  },
                })
              }
              nota={
                criar.difusor.corte.tipo === "obliquo"
                  ? "a boca vira um plano inclinado — o corte cresce com a altura do difusor"
                  : "coroa de dentes na borda — o corte cresce com a altura do difusor"
              }
              motivoMax="Mais fundo que isso o corte chegaria perto do encaixe — a borda de baixo é dele."
            />
            {criar.difusor.corte.tipo === "dentes" && (
              <SliderCtl
                rotulo="Dentes"
                valorFmt={`${criar.difusor.corte.repeticao ?? 8} dentes`}
                valor={criar.difusor.corte.repeticao ?? 8}
                min={LIMITES_CORTE_BORDA.repeticao.min}
                max={LIMITES_CORTE_BORDA.repeticao.max}
                passo={LIMITES_CORTE_BORDA.repeticao.passo}
                aoMudar={(v) =>
                  aoMudar({
                    ...criar,
                    difusor: {
                      ...criar.difusor,
                      corte: { ...criar.difusor.corte!, repeticao: v },
                    },
                  })
                }
              />
            )}
          </div>
        )}
        <SubRotulo>Vazado</SubRotulo>
        <Chips
          nomes={["Nenhum", ...PADROES_VAZADO.map((p) => p.nome)]}
          selecionado={
            criar.difusor.vazado
              ? 1 +
                PADROES_VAZADO.findIndex(
                  (p) => p.id === criar.difusor.vazado?.padrao
                )
              : 0
          }
          aoEscolher={(i) =>
            aoMudar({
              ...criar,
              difusor: {
                ...criar.difusor,
                vazado:
                  i === 0
                    ? undefined
                    : {
                        padrao: PADROES_VAZADO[i - 1].id,
                        densidade: criar.difusor.vazado?.densidade ?? 0.45,
                        gradiente: criar.difusor.vazado?.gradiente ?? 0,
                      },
              },
            })
          }
        />
        {criar.difusor.vazado && (
          <div className="mt-3">
            <SliderCtl
              rotulo="Vazios"
              valorFmt={`${Math.round(criar.difusor.vazado.densidade * 100)}%`}
              valor={criar.difusor.vazado.densidade}
              min={LIMITES_VAZADO.densidade.min}
              max={LIMITES_VAZADO.densidade.max}
              passo={LIMITES_VAZADO.densidade.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  difusor: {
                    ...criar.difusor,
                    vazado: { ...criar.difusor.vazado!, densidade: v },
                  },
                })
              }
              motivoMax="Mais aberto que isso a peça perde estrutura — e a lâmpada ficaria exposta demais."
            />
            <SliderCtl
              rotulo="Distribuição"
              valorFmt={
                Math.abs(criar.difusor.vazado.gradiente) < 0.06
                  ? "igual em toda a altura"
                  : criar.difusor.vazado.gradiente > 0
                    ? "mais aberto em cima"
                    : "mais aberto embaixo"
              }
              valor={criar.difusor.vazado.gradiente}
              min={LIMITES_VAZADO.gradiente.min}
              max={LIMITES_VAZADO.gradiente.max}
              passo={LIMITES_VAZADO.gradiente.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  difusor: {
                    ...criar.difusor,
                    vazado: { ...criar.difusor.vazado!, gradiente: v },
                  },
                })
              }
            />
            <div className="mt-1 rounded-lg border border-acento/40 bg-acento/[0.08] px-2.5 py-1.5 text-[10px] leading-relaxed text-[#4A463D]">
              O vazado é o que desenha a sombra na parede — acenda a luz para
              ver. <b className="text-[#8A5F10]">Produção em preparação ⚑</b>:
              o STL deste difusor fica travado enquanto o vazado estiver
              ligado.
            </div>
          </div>
        )}
        </>
        )}
      </Secao>

      <Secao id="cor" titulo="Cor & acabamento">
        <div className="mb-3 flex gap-1.5">
          {ALVOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlvoCor(a.id)}
              aria-pressed={alvoCor === a.id}
              className={`flex-1 rounded-full py-1.5 text-[11.5px] transition-all ${
                alvoCor === a.id
                  ? "bg-palco-escuro font-semibold text-luz-acesa"
                  : "border border-black/10 bg-black/[0.02] text-[#4A463D] hover:border-black/30"
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <PaletaFamilias selecionado={corSelecionada} aoEscolher={escolherCor} />

        <SubRotulo>Textura do corpo</SubRotulo>
        <Chips
          nomes={NOMES_FAMILIAS.map((f) => FAMILIAS_TEXTURA[f].nome)}
          selecionado={Math.max(
            0,
            NOMES_FAMILIAS.indexOf(criar.corpo.familiaTextura ?? "gomos")
          )}
          aoEscolher={(i) => {
            const f: FamiliaTextura = NOMES_FAMILIAS[i];
            aoMudar({
              ...criar,
              corpo: {
                ...criar.corpo,
                familiaTextura: f === "gomos" ? undefined : f,
                repeticaoTextura:
                  f === "gomos" ? undefined : (criar.corpo.repeticaoTextura ?? 12),
                // Ao entrar numa família, a textura já aparece.
                gomos:
                  f === "gomos" && criar.corpo.gomos === 0
                    ? 12
                    : criar.corpo.gomos,
                profundidadeGomosMm:
                  criar.corpo.profundidadeGomosMm === 0
                    ? 2
                    : criar.corpo.profundidadeGomosMm,
              },
            });
          }}
        />
        <div className="mt-3" />
        {!criar.corpo.familiaTextura ? (
          <SliderCtl
            rotulo="Gomos"
            valorFmt={criar.corpo.gomos === 0 ? "liso" : `${criar.corpo.gomos} gomos`}
            valor={criar.corpo.gomos}
            min={LC.gomos.min}
            max={LC.gomos.max}
            passo={LC.gomos.passo}
            aoMudar={(v) => mudarCorpo("gomos", v)}
          />
        ) : (
          <SliderCtl
            rotulo="Repetição"
            valorFmt={`${criar.corpo.repeticaoTextura ?? 12}×`}
            valor={criar.corpo.repeticaoTextura ?? 12}
            min={LC.repeticaoTextura.min}
            max={LC.repeticaoTextura.max}
            passo={LC.repeticaoTextura.passo}
            aoMudar={(v) => mudarCorpo("repeticaoTextura", v)}
            motivoMax="Mais fino que isso a impressora não desenha limpo — o traço dela tem largura fixa. E repetir mais também inclinaria a parede."
          />
        )}
        <SliderCtl
          rotulo="Profundidade"
          valorFmt={`${criar.corpo.profundidadeGomosMm.toFixed(1).replace(".", ",")} mm`}
          valor={criar.corpo.profundidadeGomosMm}
          min={LC.profundidadeGomosMm.min}
          max={LC.profundidadeGomosMm.max}
          passo={LC.profundidadeGomosMm.passo}
          aoMudar={(v) => mudarCorpo("profundidadeGomosMm", v)}
          nota={
            criar.corpo.familiaTextura
              ? "a textura só esculpe para dentro; se ela variar com a altura, paga o próprio balanço e o perfil aplaina sozinho (F4)"
              : "gomos esculpem para dentro — sulcos verticais imprimem limpos"
          }
          motivoMax="Mais fundo furaria a parede — o vale da textura precisa deixar material — ou pediria suporte."
        />
        <SliderCtl
          rotulo="Torção"
          valorFmt={`${criar.corpo.torcaoGraus}°`}
          valor={criar.corpo.torcaoGraus}
          min={LC.torcaoGraus.min}
          max={LC.torcaoGraus.max}
          passo={LC.torcaoGraus.passo}
          aoMudar={(v) => mudarCorpo("torcaoGraus", v)}
          nota="gira a textura em espiral da base ao topo"
        />
        <SubRotulo>Acabamento</SubRotulo>
        <Chips
          nomes={FACETAS.map((f) => f.nome)}
          selecionado={iFaceta}
          aoEscolher={setIFaceta}
        />
        {facetadoComGomos && (
          <div className="mt-2 text-[10px] text-[#A85A1E]">
            acabamento facetado desliga a textura — escolha Liso para vê-la
          </div>
        )}
      </Secao>

      <Secao id="luz" titulo="Luz">
        <PontosDeLuzCtl
          pontosDeLuz={pontosDeLuz}
          separacaoMm={separacaoMm}
          sepMin={LIMITES_CRIAR.luminaria.separacaoMm.min}
          sepMax={LIMITES_CRIAR.luminaria.separacaoMm.max}
          sepPasso={LIMITES_CRIAR.luminaria.separacaoMm.passo}
          aoMudarPontos={setPontosDeLuz}
          aoMudarSep={setSeparacaoMm}
          placa={placa}
          aoMudarPlaca={setPlaca}
        />
        <SubRotulo>Luz acesa</SubRotulo>
        <Chips
          nomes={["Acesa", "Apagada"]}
          selecionado={luzAcesa ? 0 : 1}
          aoEscolher={(i) => setLuzAcesa(i === 0)}
        />
      </Secao>

      <Secao id="regras" titulo="Regras">
        <div
          className={`rounded-2xl border px-4 py-3 ${
            tombaMesmo
              ? "border-[#B23B28]/40 bg-[#B23B28]/[0.06]"
              : "border-black/[0.08] bg-black/[0.02]"
          }`}
        >
          <div className="flex justify-between py-1 text-xs text-[#4A463D]">
            <span>
              Parede mínima ({String(REGRAS.F.paredeDifusorMm.min).replace(".", ",")}–
              {String(REGRAS.F.paredeEstruturalMm.max).replace(".", ",")} mm)
            </span>
            <span className="font-semibold text-[#4F7A44]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#4A463D]">
            <span>Balanço ≤ {REGRAS.F.balancoMaximoGraus}°</span>
            <span className="font-semibold text-[#4F7A44]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#4A463D]">
            <span>Distância do miolo elétrico</span>
            <span className="font-semibold text-[#4F7A44]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#4A463D]">
            <span>Estabilidade</span>
            <span
              className={`font-semibold ${
                tombaMesmo
                  ? "text-[#B23B28]"
                  : comContrapeso || estab.pertoDoLimite
                    ? "text-[#A85A1E]"
                    : "text-[#4F7A44]"
              }`}
            >
              {tombaMesmo
                ? `⚠ tombando para a ${estab.ladoTombando}`
                : comContrapeso
                  ? `contrapeso de ~${contrapesoG} g ✓`
                  : estab.ajustada
                    ? "base ajustada ✓"
                    : "✓"}
            </span>
          </div>
          <div
            className={`mt-2 text-[10.5px] ${
              tombaMesmo ? "text-[#B23B28]" : "text-[#6D675C]"
            }`}
          >
            {tombaMesmo
              ? "Do jeito atual ela cai — nem base larga nem contrapeso seguram tanto peso fora do eixo. Reduza o deslocamento do topo ou alargue a base."
              : comContrapeso
                ? "Debruçada assim, ela ganha um inserto de peso dentro da base para o conjunto ficar firme — a regra é a ferramenta."
                : estab.ajustada
                  ? "A base foi alargada automaticamente para o conjunto não tombar — a regra é a ferramenta."
                  : "Tudo que estes controles permitem criar, a Per Parte fabrica."}
          </div>
        </div>
      </Secao>

      <Secao id="publicar" titulo="Publicar no catálogo">
        <div>
          <input
            type="text"
            value={nomePeca}
            onChange={(e) => setNomePeca(e.target.value)}
            placeholder="dê um nome à sua peça (ex.: Duna)"
            aria-label="Nome da sua peça"
            className="mb-2 w-full rounded-full border border-black/10 bg-black/[0.02] px-4 py-2.5 text-[13px] text-palco-escuro placeholder-[#6D675C] outline-none transition-colors focus:border-acento"
          />
          <button
            onClick={() => setPublicada(nomePeca.trim() || "Sem nome")}
            className="w-full rounded-full bg-palco-escuro py-2.5 text-[13px] font-semibold text-luz-acesa transition-colors duration-300 ease-padrao hover:bg-acento hover:text-palco-escuro"
          >
            Publicar minha parte
          </button>
          {publicada && (
            <div className="mt-2.5 rounded-2xl border border-acento/40 bg-acento/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-[#4A463D]">
              <b className="text-[#8A5F10]">“{publicada}”</b> entrou na fila de
              curadoria. Quando aprovada, sua parte fica disponível para
              qualquer pessoa usar nas montagens dela — e você recebe{" "}
              <b className="text-palco-escuro">royalty por parte</b> a cada
              luminária vendida que usar uma criação sua.
            </div>
          )}
        </div>
      </Secao>
    </div>
  );
}
