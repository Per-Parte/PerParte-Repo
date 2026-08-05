# Manipulação direta v1 — spec de interação + arquitetura

Documento de trabalho (05/08/2026). Fase seguinte implementa **exatamente** o que está aqui.
Insumos: mapa gestos→parâmetros (núcleo de hoje) e auditoria UX de friendliness.
Regra inviolável: **nenhuma alteração em `packages/nucleo`**; edições em arquivos quentes
(`Configurador.tsx`, `Cena3D.tsx`, painéis) são mínimas e aditivas — código novo mora em
`apps/web/src/components/manipulacao/`.

## 0. A visão (Davi)

Qualquer luminária da base de referências deve poder nascer aqui dentro — leque grande,
mas **friendly acima de tudo**: a pessoa comum pega a obra com a mão. Tocar uma parte
seleciona e o painel vem junto; arrastar a parte esculpe o parâmetro certo; o limite físico
nunca é erro, é a geometria "encostando" com uma explicação humana. Princípio-mestre
intacto: **se a ferramenta deixou criar, a Per Parte fabrica** — todo gesto passa pelos
mesmos `grampear*`/setters do painel. O gesto que a v1 ainda não cobre (arrastar o corpo
livremente pela superfície da base) está proposto ao Caio no §10.

## 1. Princípios de implementação

1. **Fonte única de verdade**: gesto nunca escreve valor cru no estado. Todo gesto roteia
   `pedido → grampear*/teto derivado → setter do Configurador` — o MESMO caminho de
   `decodificarCriacao` (lib/criacao.ts) e dos sliders. O `?c=` não muda.
2. **A câmera é do usuário**: arrastar no vazio SEMPRE orbita, em qualquer ferramenta.
   Durante manipulação de parte, o rig suspende (mecanismo dos 4 s que já existe).
3. **Limite = explicação, nunca erro**: reusar os textos `motivoMin`/`motivoMax` dos
   sliders num toast ancorado ao cursor (§6).
4. **Aditivo nos arquivos quentes**: pontos de toque enumerados no §2.3 — nada além deles.

## 2. Arquitetura — `components/manipulacao/`

### 2.1 Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `estado.ts` | Store fora do React (padrão `useSyncExternalStore`): `ferramenta` (`"selecionar" \| "arrastar" \| "mover" \| "girar"`), `selecao: MarcaParte \| null`, `hover: MarcaParte \| null`, `toast: { texto, x, y } \| null`, e o **registro da ponte** (valores atuais + setters + refs vindos do Configurador). Ações: `setFerramenta`, `selecionar`, `deselecionar`, `mostrarToast`. Zero prop-drilling entre Configurador (DOM) e Cena3D (Canvas). |
| `PonteManipulacao.tsx` | Componente que renderiza `null` dentro do Configurador; a cada render registra no store o snapshot: `{ modo, criar, setCriar, estruturais, setEstruturais, separacaoMm, setSeparacaoMm, placa, setPlaca, pontosDeLuz, corpoEfetivo, difusorEfetivo, refRolagem, setAlturaSheet, alturaSheet }`. Se a parte selecionada deixou de existir (trocou de modo, placa removida, estrutural removido), deseleciona. |
| `dirigir.ts` | O roteador (fonte única): `dirigir(parte, parametro, pedido)` aplica `grampearBase/grampearCorpo/grampearDifusor/grampearJunta/grampearPlaca` (ou clamp de catálogo p/ `separacaoMm` 70–160 e permutação p/ `estruturais`), chama o setter registrado, arredonda ao passo do slider correspondente e devolve `{ efetivo, limitou: "min" \| "max" \| null }` para o feedback. |
| `gestos.ts` | Matemática pura: planos de raycast, conversões delta→valor (§5.1), regiões do corpo, trava de eixo, ganhos angulares. Sem React. |
| `ControladorGestos.tsx` | Único componente dentro do Canvas. Listeners `pointerdown/move/up/cancel` no `gl.domElement`; raycast próprio contra a cena filtrando `mesh.userData.pp` (nenhum handler por mesh); glow da seleção e do hover (§4.2); cursor; `controlesRef.current.enabled = false` durante gesto de parte e `suspensoAteRef.current = performance.now() + 4000` a cada frame do gesto; chama `dirigir()`. |
| `BarraFerramentas.tsx` | Toolbar (§3). Vive no DOM do Configurador, fora do Canvas. |
| `ToastLimite.tsx` | Toast flutuante do canvas (§6). Vive no DOM do Configurador. |
| `motivos.ts` | Textos didáticos de limite por `parte.parametro` — **copiar os textos exatos** das props `motivoMin`/`motivoMax` dos painéis (não mover os originais: os painéis ficam intocados; duplicar é aditivo e barato). Onde o painel não tem texto, usar os do §5. |
| `DicaOrbita.tsx` | Quick-win QW9 (§8). |

### 2.2 Marcação das partes (contrato de raycast)

```ts
// estado.ts
export type MarcaParte =
  | { parte: "base" }
  | { parte: "pastilha"; coluna: -1 | 1 }
  | { parte: "estrutural"; indice: number; coluna: -1 | 0 | 1 }
  | { parte: "corpo"; coluna: -1 | 0 | 1 }
  | { parte: "difusor"; coluna: -1 | 0 | 1; inclinada: boolean }
  | { parte: "placa" };
```

Cada mesh de parte carrega `userData.pp = marca`. O raycast do `ControladorGestos` usa
`raycaster.intersectObjects(scene.children, true)` e sobe pela hierarquia até achar
`userData.pp` (primeiro hit com marca vence; cenário/chão não têm marca e são ignorados —
hit sem marca = "vazio").

### 2.3 Pontos de toque nos arquivos quentes (lista fechada)

`Cena3D.tsx` — aditivo:
1. `import ControladorGestos from "./manipulacao/ControladorGestos";`
2. `ParteProps`/`PartePlaca`/`ParteCabecaInclinada` ganham prop opcional
   `marca?: MarcaParte`, aplicada no mesh: `userData={marca ? { pp: marca } : undefined}`.
3. Cada instância no JSX passa a `marca` (base, pastilhas com `coluna`, estruturais com
   `indice`+`coluna` — `coluna = 0` quando só há uma —, corpo, difusor/cabeça, placa).
4. Dentro do `<Canvas>`, antes do `<OrbitControls>`:
   `<ControladorGestos controlesRef={refControles} suspensoAteRef={suspensoAte} />`.

`Configurador.tsx` — aditivo:
1. `<BarraFerramentas />` (irmã do `<ToggleCena/>` no desktop; no mobile dentro do wrapper
   de baixo — §3.2).
2. `<PonteManipulacao ...snapshot />` (render nulo).
3. `<ToastLimite />` (overlay).
4. `<DicaOrbita />` (QW9).
5. Strings dos quick-wins (§8).

Painéis (`PainelCriar.tsx`, `PainelMontar.tsx`, `controles.tsx`): **somente** as strings
dos quick-wins (§8). Nenhuma mudança de comportamento.

## 3. Barra de ferramentas

Quatro ferramentas: **Selecionar** (padrão) · **Arrastar** (pega livre) · **Mover** (eixos
fixos) · **Girar**.

### 3.1 Desktop (md+)

Rail **vertical na borda esquerda, a meia altura do palco**:
`md:absolute md:left-6 md:top-1/2 md:-translate-y-1/2 z-10`. Não colide com nada: painel é
a faixa direita de 416 px (`w-[400px]` + `right-4`); cards de preço em `bottom-6 left-6`;
interruptor em `bottom-6 right-[432px]`; ToggleCena no topo central
(`left-[calc((100%-416px)/2)] top-[4.25rem]`); wordmark `left-6 top-5` — o rail centrado
verticalmente não alcança nenhum deles.

- Container: `flex flex-col gap-1 rounded-full bg-white p-1 ${SOMBRA_CARD}` (mesma
  linguagem do ToggleCena/interruptor).
- Botões `h-11 w-11 rounded-full`; ativo `bg-palco-escuro text-luz-acesa`; inativo
  `text-palco-escuro hover:text-[#8A5F10]`.
- Rótulo no hover/focus-visible: pill à direita do botão (`absolute left-full ml-2`,
  `rounded-full bg-palco-escuro px-2.5 py-1 text-[11px] text-luz-acesa whitespace-nowrap`):
  "Selecionar (V)", "Arrastar (G)", "Mover (M)", "Girar (R)".

### 3.2 Mobile (<md)

Linha horizontal **ancorada ao topo do sheet** (diretriz da auditoria: nunca a faixa
inferior nem o canto do interruptor): dentro do wrapper `flex-col` da borda de baixo do
Configurador, **acima da barra compacta** (preço + interruptor), como
`mb-2 self-center pointer-events-auto flex gap-1 rounded-full bg-white p-1 ${SOMBRA_CARD}`.
Sobe e desce com o sheet — nunca fica coberta. Botões `h-11 w-11` (≥44 px), gap ≥ 8 px
efetivo entre áreas de toque. Rótulo só via `aria-label` (não há hover no toque).

### 3.3 Ícones (SVG geométrico inline, `viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth={1.7}`, `fill="none"`, `strokeLinecap="round"`)

- **Selecionar**: seta de cursor — triângulo `M6.5 4l11 7.5-5.2 1.2L9.6 19.5 6.5 4z`.
- **Arrastar**: ponto central (`circle r=2` em 12,12) + 4 setas diagonais curtas
  apontando para fora (pega solta em qualquer direção).
- **Mover**: cruz ortogonal de setas (↑ ↓ ← →) a partir do centro (eixos fixos).
- **Girar**: arco circular ~270° (`r≈7`) com ponta de seta no fim.

### 3.4 Atalhos e aria

- `V` Selecionar · `G` Arrastar · `M` Mover · `R` Girar · `Esc` deseleciona; segundo `Esc`
  volta a Selecionar. Listener global `keydown` que **ignora** eventos vindos de
  `input/textarea/select` ou `isContentEditable` (o campo "nome da obra" digita V/G/M/R).
- Container `role="toolbar" aria-label="Ferramentas do palco"` +
  `aria-orientation="vertical"` (desktop) / `"horizontal"` (mobile). Botões com
  `aria-pressed`, `aria-label="Selecionar — clique numa parte para editar"` etc. e
  `aria-keyshortcuts="v"`…
- Navegação por setas dentro da toolbar (padrão toolbar WAI): opcional na v1; Tab entre
  botões basta.
- Acessibilidade honesta: a manipulação no canvas é via ponteiro; o caminho acessível
  completo continua sendo o painel (todo gesto tem slider equivalente — nada só-gesto).

### 3.5 Disponibilidade por modo

Todas as ferramentas sempre habilitadas. Gesto sem mapeamento para a parte/modo (ex.:
Girar na base) **cai em órbita** e mostra uma vez por sessão o hint didático da parte
(ex.: "Essa peça é redonda — girar não muda a forma. O corpo com textura torce.").

## 4. Selecionar

### 4.1 Clique e deseleção

- **Clique seco** (< 6 px de movimento, qualquer duração) sobre parte → seleciona
  (`estado.selecionar(marca)`). Vale em QUALQUER ferramenta; nas ferramentas de gesto,
  iniciar um arrasto sobre a parte também a seleciona.
- Clique seco no vazio → deseleciona. `Esc` → deseleciona. Arrastar (não-seco) no vazio →
  orbita, sem mexer na seleção.
- Trocar de modo Montar↔Inventar → deseleciona (a ponte cuida).

### 4.2 Glow leve da seleção — técnica escolhida: **emissive sutil pulsando devagar** (sem pós, sem dependência)

Decisão: **NÃO** usar `onBeforeCompile`/rim-fresnel. Justificativa de perf e robustez:
`emissive`/`emissiveIntensity` são uniforms do `meshStandardMaterial` — mudar por frame
custa zero recompilação de shader e zero draw call extra; já é exatamente o mecanismo que
o difusor aceso usa (`emissiveIntensity 0.85`). `onBeforeCompile` criaria variantes de
programa novas e brigaria com o padrão existente de `key=` no material do `Parte` (o
material é REMONTADO a cada mudança de facetado/luz/vazado — cada remontagem recompilaria
o shader custom de novo, com risco de hitch visível em mobile).

Implementação no `ControladorGestos` (`useFrame`):

- Ao selecionar, coletar os meshes com `userData.pp` igual à marca (nota: em obra dupla o
  corpo/difusor existem 2×; **as duas colunas brilham juntas** — é a mesma parte).
- Por mesh, guardar num `WeakMap<Material, {emissive, intensity}>` o estado original na
  primeira vez que o material é visto (o material troca quando o `key=` remonta — se
  trocou, o novo é capturado e o velho morre com o GC; nada a restaurar).
- **Parte opaca** (emissive preto de fábrica): `emissive = corDaPeça.lerp(#F6E7C4, 0.5)`;
  `emissiveIntensity` pulsando `0,05 → 0,12` com período de **2,4 s**
  (`0,085 + 0,035·sin(2π·t/2,4)`), amortecido com `THREE.MathUtils.damp(…, 8, dt)` para
  entrar/sair suave.
- **Difusor** (já usa emissive p/ luz): pulso **aditivo** sobre a intensidade capturada:
  `base + 0,05 + 0,04·sin(…)` — aceso ou apagado, o glow soma por cima e restaura direito.
- `prefers-reduced-motion` (hook `useMovimentoReduzido` já existe em Cena3D — replicar
  a leitura da media query no controlador): **sem pulso**, intensidade fixa `0,09`
  (aditiva no difusor).
- Deselecionar → damp de volta ao estado capturado e restaurar `emissive` original.

### 4.3 Hover

- Cursor: `pointer` sobre parte na ferramenta Selecionar; `grab`/`grabbing` nas
  ferramentas de gesto (via `gl.domElement.style.cursor`); vazio segue o QW10 (`grab`).
- Tint ainda mais leve que a seleção: `emissiveIntensity` fixa `0,04` (sem pulso), mesma
  cor. Hover nunca aparece em parte já selecionada (a seleção vence). Sem hover no toque.

## 5. Sincronia 3D ↔ painel (a alma friendly) e gestos

### 5.0 Selecionar parte → painel vem junto

Ao selecionar, a ponte executa:

```ts
const SECAO_POR_PARTE = {
  base: "base", pastilha: "base", estrutural: "corpo", corpo: "corpo",
  difusor: "difusor", placa: "luz",           // PontosDeLuzCtl mora na seção Luz
} as const;
const el = refRolagem.current?.querySelector<HTMLDetailsElement>(`[data-secao="${secao}"]`);
if (el) { el.open = true; el.scrollIntoView({ behavior: reduzido ? "auto" : "smooth", block: "start" }); }
if (window.innerWidth < 768 && alturaSheet === 15) setAlturaSheet(45); // sheet sai do pico
```

O resto é de graça: o scroll dispara o `onScroll` do contêiner (`refSinalRolagem++` →
rig re-sincroniza na hora) e o `IntersectionObserver` elege a seção → a pose da câmera já
enquadra a parte. **Zero mudança no mecanismo existente.** Selecionar também define o alvo
de cor quando fizer sentido (`base/corpo/difusor` → `setAlvoCor` correspondente;
estrutural/placa/pastilha não mexem no alvo) — a ponte recebe `setAlvoCor`.

**O inverso NÃO existe: abrir/rolar seção não seleciona.** Justificativa: (a) anti-loop —
seleção rola o painel; se rolagem selecionasse, todo scroll manual re-selecionaria e
re-rolaria, brigando com o dedo do usuário; (b) intenção — rolar é ler/navegar; um glow
não pedido parece defeito; (c) o benefício já existe — a câmera já segue a seção no
scroll, então "ver a parte" não precisa de seleção. Deselecionar nunca rola o painel de
volta.

### 5.1 Conversões delta de tela → delta de valor (em `gestos.ts`; 1 unidade de cena = 100 mm, `MM = 100`)

No `pointerdown` sobre parte com ferramenta de gesto: capturar ponto de pega `hit0`
(mundo), valor inicial do parâmetro, e escolher o **plano de arrasto**:

- **Eixo vertical** (alturas, pescoço, posições normalizadas): plano vertical contendo
  `hit0`, com normal = direção câmera→alvo projetada no plano XZ (o plano "de frente para
  a câmera" que contém o eixo Y). `deltaMm = (hit.y − hit0.y) · 100` → soma 1:1 em mm.
- **Radial** (raios, barriga): plano horizontal `y = hit0.y`;
  `deltaMm = (distânciaAoEixoDaParte(hit) − distânciaAoEixoDaParte(hit0)) · 100`.
  Eixo da parte = `x = xColuna` (mundo), então distância = `|hit.x − xColuna|` combinada
  com z: usar `hypot(hit.x − xColuna, hit.z)`.
- **Lateral X** (curva S, deslocamento da cabeça, separação — tudo vive no eixo X do
  mundo): mesmo plano horizontal; `deltaMm = (hit.x − hit0.x) · 100`.
- **Angular** (torção, inclinações): sem raycast — `deltaGraus = deltaPx · ganho` do
  ponteiro na tela (ganhos na tabela 5.3), sinal pela direção.
- **Normalizados** (`posicaoBojo`, `posicaoDobra` ∈ ±1): `delta = 2 · deltaYmm / corpo.alturaMm`
  (percorrer a altura do corpo leva o valor de −1 a +1).
- **Trava de eixo** (ferramentas Arrastar e Mover): zona morta de 6 px; o eixo dominante
  do primeiro movimento > 6 px trava o gesto até o `pointerup` (mesmo padrão do
  `refArrastou` do sheet).
- **Passo**: antes do setter, arredondar ao passo do slider correspondente (mm inteiro,
  grau inteiro, 0,05 nos normalizados) — sem tremido.
- Aplicar o valor **continuamente** durante o arrasto (mesmo custo dos sliders, que já
  regeneram a malha no `onChange`).

### 5.2 Clamp e feedback (fonte única)

`dirigir.ts` monta o objeto com o pedido e passa pelo grampeador do núcleo — ex.:

```ts
// corpo (modo Inventar)
setCriar(c => ({ ...c, corpo: grampearCorpo({ ...c.corpo, [campo]: pedido }) }));
// junta:  grampearJunta · placa: grampearPlaca · base: grampearBase · difusor: grampearDifusor
// separacaoMm: clamp 70–160 (o teto físico e a efetiva ficam com ajustarComposicaoDupla, padrão pedido×efetivo)
// estruturais: permutação do array (nunca valor)
```

`limitou` = pedido ≠ efetivo. Se o dedo continua empurrando ≥ 12 px além do limite,
mostrar o motivo no `ToastLimite` (§6) — textos de `motivos.ts`. Os feedbacks físicos são
herdados de graça: E2 alarga a base ao vivo, E3 pede contrapeso, aviso de tombamento com
direção — nada a codificar.

### 5.3 Tabela de gestos v1 (só itens "VIÁVEIS HOJE" do mapa)

Regiões do corpo pelo `t` vertical do ponto de pega (0 = pé, 1 = topo): **topo** `t ≥ 0,7`,
**meio** `0,3–0,7`, **pé** `t < 0,3`.

| Parte (modo) | Ferramenta + direção | Parâmetro | Conversão | Clamp (fonte) | Motivo no limite |
|---|---|---|---|---|---|
| Base | Arrastar/Mover radial | `criar.base.raioMm` | radial 1:1 mm | 60–110 · `grampearBase` | máx: "Mais larga não cabe no prato da impressora." · mín: "Menor que isso a base não segura o conjunto em pé." (mostrar o raio **nominal**; E2 escala por cima) |
| Base | Mover vertical | `criar.base.alturaMm` | vertical 1:1 mm | 20–60 · `grampearBase` | textos do PainelCriar |
| Corpo topo (Inventar) | Arrastar/Mover horizontal | `corpo.deslocamentoMm` (espinha S) | lateral X 1:1 mm | ±`deslocamentoMaximoMm(h)`; na dupla, "para dentro" pára via composição | "Debruçada além disso, nem a base alargada segura — o corpo curva até onde fica em pé." |
| Corpo topo | Arrastar/Mover vertical | `corpo.alturaMm` | vertical 1:1 mm | 100–240 · `grampearCorpo` (re-clampa a curva S, padrão A9) | máx: "A impressora vai até 24 cm — para ir mais alto, some hastes no Montar." |
| Corpo meio | Arrastar radial | `volumeBojoMm` — ou `perfilLivre[i]` se silhueta livre ativa (`i = round((t−0,1)/0,2)` clamp 0–4) | radial 1:1 mm | −12..35 / 16–60 · `grampearCorpo` (cascata: miolo elétrico 15,5 mm e F4 "encostam") | textos do PainelCriar |
| Corpo meio | Arrastar vertical | `posicaoBojo` | normalizado ±1 | `grampearCorpo` | — (curso curto, sem motivo) |
| Corpo pé | Arrastar vertical | `posicaoDobra` (se `deslocamentoMm ≠ 0`; senão `posicaoBojo`) | normalizado ±1 | `grampearCorpo` | — |
| Corpo (Inventar, com textura) | Girar horizontal | `torcaoGraus` | 0,5°/px | ±90 · `grampearCorpo` | "A espiral vai até 90° — mais que isso a parede helicoidal pediria suporte." |
| Corpo/difusor/estrutural em coluna dupla | Mover horizontal (e Arrastar horizontal no Montar) | `separacaoMm` | `Δsep = 2·ΔXmm·sign(xColuna)` | 70–160 pedido; teto `separacaoMaximaMm`; efetiva sobe via `ajustarComposicaoDupla` | padrão pedido×efetivo já pronto ("ajustada para cima: as colunas precisam de ar") |
| Difusor reto | Arrastar/Mover radial | `difusor.raioMm` | radial 1:1 mm | 40–90 (raseia na dupla) · `grampearDifusor` | textos do PainelCriar |
| Difusor reto | Arrastar/Mover vertical | `difusor.alturaMm` | vertical 1:1 mm | 60–130 · `grampearDifusor` | idem |
| Cabeça inclinada (Inventar) | Arrastar/Mover horizontal | `junta.deslocamentoMm` | lateral X 1:1 mm (sentido +X da coluna; espelhado na coluna girada) | 0–min(40, raio−25) · `grampearJunta` | "Mais para o lado que isso, a cabeça sairia de cima do próprio pescoço." |
| Cabeça inclinada | Girar vertical | `junta.inclinacaoGraus` | 0,2°/px (arrastar p/ cima endireita) | 5–25 · `grampearJunta`; **abaixo de 5° → snap: junta removida** | toast neutro no snap: "Endireitou — a cabeça voltou a assentar reta." · máx: "Mais deitada que isso, as paredes pediriam suporte." |
| Placa (ambos os modos) | Arrastar/Mover vertical | `placa.pescocoMm` | vertical 1:1 mm | 20–60 · `grampearPlaca` | textos do PontosDeLuzCtl |
| Placa | Arrastar/Mover horizontal (afastar da luz) | `separacaoMm` | lateral X 1:1 mm (placa mora em −X) | como acima | pedido×efetivo |
| Placa borda (pega a > 0,7·raio do eixo) | Arrastar radial | `placa.raioMm` | radial 1:1 mm | 80–120 · `grampearPlaca` | — |
| Placa | Girar vertical | `placa.inclinacaoGraus` | 0,15°/px | 0–18 · `grampearPlaca` | "Mais deitado que isso o peso do disco sai de cima da base." |
| Estrutural (Montar) | Arrastar vertical | reordenar `estruturais` (permutação) | swap ao cruzar o meio da vizinha (fronteiras `yK` já calculadas na cena) | máx 3; qualquer ordem é válida (F5) | — |

**Fora da v1** (mapeados, mas gesto pontual/fino demais para a primeira leva — ficam no
painel): corte oblíquo puxando a boca (`corte.profundidadeMm`), gola por gesto, remover
estrutural por drag-out, torção a dois dedos, double-tap para acender, `proporcao` por
pinça. Entram numa v1.1 sem mudar arquitetura.

### 5.4 Câmera durante o gesto

- `pointerdown` em parte (ferramenta de gesto): `controles.enabled = false` e, a cada
  frame do arrasto, `suspensoAteRef.current = performance.now() + 4000`.
- `pointerup/cancel`: `controles.enabled = true`; o rig volta sozinho depois dos 4 s, ou
  na hora no próximo scroll do painel (mecanismos existentes, zero código novo no rig).
- Arrasto no vazio: não tocar em nada — OrbitControls seguem donos (o `onStart` deles já
  suspende o rig).

### 5.5 Mobile

- Manipulação **só com ferramenta de gesto ativa** (Arrastar/Mover/Girar na toolbar).
- **1 dedo sobre parte** → manipula (regras acima). **1 dedo no vazio** → orbita.
  **2 dedos** → SEMPRE câmera: ao entrar o segundo toque, o gesto de parte é finalizado
  (valor corrente fica), `controles.enabled = true` e o pinch/rotate segue para os
  OrbitControls.
- Toque seco em parte seleciona em qualquer ferramenta (e o sheet sobe do pico, §5.0).

## 6. ToastLimite — o motivo didático no canvas

- Mesma linguagem visual do motivo do `SliderCtl`:
  `rounded-lg border border-acento/40 bg-acento/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-[#6B4E12]`
  com o `!` em `font-bold text-[#8A5F10]`, mais `${SOMBRA_CARD}` e `pointer-events-none`.
- **Desktop**: `position: fixed`, ancorado ao cursor (`clientX + 14, clientY − 40`),
  clampado ao viewport e nunca sob a faixa do painel (max `right: 432px`).
- **Mobile**: posição fixa centrada acima da toolbar/barra compacta (o dedo cobre o ponto
  de toque): `bottom: calc(var(--altura-sheet) + 72px)`, `left: 50%`, translate.
- Some sozinho em **4 s** (mesmo tempo do slider); um por vez; re-empurrar o limite
  renova o texto sem repiscar. `role="status"` (aria-live polite).
- Textos: `motivos.ts` — cópias exatas dos `motivoMin`/`motivoMax` dos painéis + os novos
  do §5.3.

## 7. Registro de voz

Todos os textos novos seguem o guia: pt-BR registro 6,5–7, honesto-técnico no limite
físico ("a cabeça sairia de cima do próprio pescoço"), nunca código interno (E2/F4…),
nunca nome de concorrente.

## 8. Quick-wins UX que entram JÁ nesta fase (da auditoria; baratos, alto impacto)

1. **QW2 — tirar códigos internos do microcopy**: apagar "(E2)" (PainelCriar.tsx:200),
   "vem de F4" (:330), "(F1)" (controles.tsx:321), "(F5)" (PainelMontar.tsx:204) — manter
   as frases.
2. **QW3 — tirar referências à Gantri**: PainelCriar.tsx:393 → "como um vaso que abraça o
   difusor"; :463 → "a boca desce em diagonal — fica bonito com uma esfera assentada
   dentro"; :593 → "a cabeça inteira pende sobre a coluna, como uma luminária de
   escritório".
3. **QW4 — renomes de rótulo (strings apenas)**: "Separação das colunas"→"Distância entre
   as luzes" (controles.tsx:293); "Volume do bojo"→"Barriga (bojo)"; "Posição do
   bojo"→"Altura da barriga"; "Deslocamento do topo"→"Debruçar o topo"; "Berço no topo
   (gola)"→"Berço do difusor (gola)" + "Altura do berço"/"Abertura da boca"; "Esticar a
   seção"→"Achatar a peça (vista de cima)"; "Vazios"→"Quantidade de furos"; "modo
   hard"→"avançado"; "arestas"→"pontos" (PainelCriar.tsx:294); "Torção"→"Girar em espiral
   (torção)".
4. **QW6 — seção Regras**: `titulo="Regras"` → `"Pronto para fabricar"`
   (PainelMontar.tsx:260, PainelCriar.tsx:931; `id="regras"` INTACTO — a pose de câmera é
   por id); "Balanço ≤ 25°" → "Paredes seguram o próprio peso (inclinação ≤ 25°)" (:947).
5. **QW8 — microlegenda do switch** (Configurador.tsx, sob o switch de modos, ~:804):
   "Montar combina partes prontas; Inventar esculpe cada uma."
6. **QW9 — DicaOrbita** (`components/manipulacao/DicaOrbita.tsx` + 1 linha no
   Configurador): pill branca `${SOMBRA_CARD}` centrada no palco visível (desktop
   `left-[calc((100%-416px)/2)] bottom-24`; mobile acima da barra compacta). Texto:
   "Arraste para girar a obra · role para chegar perto" (mobile: "Arraste para girar ·
   belisque para chegar perto") + ✕ "Entendi". Some no primeiro pointerdown+move sobre o
   canvas, no ✕ ou após 10 s; grava `localStorage["pp.dicaOrbita"]="vista"`; só aparece
   com a cena montada; sem pulso em `prefers-reduced-motion`.
7. **QW10 — cursor no canvas** (globals.css): `grab` no idle, `grabbing` no arrasto (o
   ControladorGestos sobrepõe pointer/move conforme §4.3).
8. **QW11 — alvos de toque mobile** (CSS/classes): swatches 28→32 px (controles.tsx,
   `h-8 w-8`), bolinhas da pilha 18→≥24 px (PainelMontar.tsx:174–180), slider `.ctl` com
   input de 28 px de altura (trilho desenhado ao centro) + `touch-action: none`
   (globals.css).

Bônus de 2 linhas se sobrar fôlego: **QW12** — `aberta={false}` nas seções "Pronto para
fabricar" e "Publicar no catálogo" do Inventar. Ficam para combinar com o Caio (mexem mais
fundo em arquivo quente): QW1/rotulos de chips do núcleo, QW7 (Produção em `<details>`),
QW13 (`Afinar`).

## 9. Mapa resumido gesto → parâmetro (o que o núcleo permite hoje)

| Parte | Parâmetros dirigíveis por gesto | Limite (grampeador) |
|---|---|---|
| Base | `alturaMm` 20–60 · `raioMm` 60–110 (nominal; E2 alarga sozinho até 1,45×) | `grampearBase` |
| Pilha (Montar) | reordenar/duplicar/remover `estruturais` (máx 3; índices de catálogo — esticar contínuo NÃO serializa hoje) | catálogo |
| Corpo | `alturaMm` 100–240 · `volumeBojoMm` −12..35 · `posicaoBojo` ±1 · `perfilLivre` 16–60 · **`deslocamentoMm` = espinha em S** ±min(85, ~0,35·h) · `posicaoDobra` ±1 · `torcaoGraus` ±90 | `grampearCorpo` + cascata (miolo 15,5 mm, F4) |
| Difusor | `alturaMm` 60–130 · `raioMm` 40–90 (raseia na dupla) · corte 4–min(60, 0,35·h) | `grampearDifusor` / `grampearCorteBorda` |
| Cabeça (junta) | `inclinacaoGraus` 5–25 (≤0 remove) · `deslocamentoMm` 0–min(40, raio−25); pescoço é DERIVADO | `grampearJunta` |
| Placa | `pescocoMm` 20–60 · `inclinacaoGraus` 0–18 · `raioMm` 80–120 · posição só via `separacaoMm` | `grampearPlaca` |
| Colunas | `separacaoMm` 70–160 pedido; teto `separacaoMaximaMm`; efetiva sobe sozinha (pedido×efetivo) | `ajustarComposicaoDupla` |
| Global | `proporcao` 0,55–1 (pinça — v1.1) | `grampearProporcao` |

**Não existe hoje**: offset lateral livre do corpo sobre a base (`deslocamentoMm` é a
espinha curva — o pé fica cravado no centro; o corpo se debruça, nunca desliza). É a
proposta nº 1 abaixo.

## 10. Precisa do núcleo (proposta para o Caio — NADA disso se implementa na web antes do núcleo)

1. **Encaixe deslocado — o Grab de verdade do Davi** (prioridade ALTA). Arrastar o corpo
   livremente pela superfície da base, com encaixe deslocado (o corpo desliza, não
   flutua). O mecanismo já existe embrionário: a base dupla monta colunas em **pastilhas a
   ±separação/2** (`perfilBase(comMacho=false)` + pastilhas). Generalizar: pastilha em
   `(x, y)` qualquer do prato; limite = pastilha inteira sobre a face (mesma conta de
   `separacaoMaximaMm`: raio útil − 30) + E1/E3 no CG (o termo lateral já existe em
   `estabilidade`). Custo: geração/STL da base com pastilha excêntrica + **2 campos
   opcionais retrocompatíveis no `?c=`** (ex.: `offsetCorpoXMm`, `offsetCorpoZMm` — só
   opcionais, F5 intocado). Na web, o gesto Arrastar-horizontal do corpo migraria da
   espinha S para o offset real (a espinha continua existindo como "Debruçar").
2. **Azimute da cabeça/placa** (MÉDIA): hoje a junta pende sempre para +X e a placa para
   −X (fixo na malha). Um `anguloGraus` opcional + rotação em Z na malha daria o gesto
   "girar a cabeça ao redor da coluna" — fecha a ferramenta Girar. Campo novo opcional no
   `?c=`.
3. **Esticar peça da pilha por gesto** (MÉDIA): `grampearEstrutural` e
   `LIMITES_CRIAR.estrutural` (altura 20–160, barriga −10..14) já existem no núcleo, mas o
   `?c=` serializa só índices do catálogo. Campo opcional `estruturaisCriar`
   (retrocompatível) destravaria "puxar uma haste" contínuo. Sem isso, a pilha fica em
   reordenar/trocar/duplicar.
4. **Placa com posição própria no prato** (junto com o item 1): desacoplar da separação —
   mesma extensão de pastilha excêntrica.
5. **Fase das facetas `faseGraus`** (BAIXA): girar um corpo facetado/esticado em torno do
   próprio eixo hoje é no-op; a modulação r(θ) aceitaria uma fase. Campo novo opcional.
6. **Gap vertical difusor↔corpo (pescoço reto)** (BAIXA): não existe; a junta já cobre o
   caso inclinado — só se o catálogo pedir.

## 11. Critérios de aceite da v1

- Clicar em cada parte seleciona (glow leve pulsando; fixo em reduced-motion), abre/rola a
  seção certa do painel e a câmera enquadra; Esc/clique no vazio deseleciona.
- Com Arrastar/Mover/Girar: cada linha da tabela 5.3 dirige o parâmetro certo, os valores
  ficam idênticos aos dos sliders (fonte única), e empurrar o limite mostra o motivo em
  4 s junto ao cursor.
- Arrastar no vazio orbita em qualquer ferramenta; 2 dedos sempre câmera; o rig suspende
  durante o gesto e volta como hoje.
- `?c=` byte a byte compatível: nenhuma criação salva muda de forma.
- Nenhum arquivo de `packages/nucleo` tocado; edições nos arquivos quentes restritas à
  lista do §2.3 + strings do §8.
