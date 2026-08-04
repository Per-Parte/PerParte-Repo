# Design do site — especificação v1 (04-08-2026)

> **Para quê**: brief de implementação do novo design de `apps/web` (Next.js 16 + React Three Fiber). Davi sobe este documento no VS Code e desenvolve com o Claude Code.
> **Fontes**: 2 prints de referência enviados pelo Davi (04/08) + notas do cofre Obsidian: [[Branding — paleta v0.1 (04-08-2026)]] · [[Branding — guia de voz]] · [[Branding — copies fundadoras (04-08-2026)]] · [[Decisões]].

---

## 1. Interpretação das referências

### Print 1 — festival "Edgy Vibrations" (inspiração da landing)
O que a referência faz: fundo em **gradiente vertical saturado→creme**; tipografia display gigante centralizada por cima de tudo; e a assinatura da página — **dezenas de cards fotográficos em pé, enfileirados ao longo de um caminho elíptico** que recua em perspectiva, como um carrossel circular contínuo; CTA pequeno de cor de choque; header com pills.

**O que aproveitamos**: o anel de cards em movimento (vira o **Anel de Obras** — cada card uma luminária diferente = "infinitas possibilidades" demonstrada, não declarada), o gradiente tom-sobre-tom, o título central dominante, o CTA de contraste.
**O que NÃO copiamos**: a tipografia blackletter (não é a Per Parte — nossa display é geométrica/modular), o excesso de itens de nav.

### Print 2 — game UI "BMO" (inspiração do configurador)
O que a referência faz: **viewport 3D dominante à esquerda** (sujeito num estúdio neutro, sombras suaves), **painel branco arredondado à direita** com ferramentas/estatísticas em cards orgânicos, **cards flutuantes de status** no canto inferior esquerdo, tudo redondo, macio, respirando.

**O que aproveitamos**: a arquitetura viewport + painel direito branco; os cards flutuantes (viram **preço evolutivo vivo**); a leveza toy-like (ecoa a LEGO).
**Tradução-chave do Davi**: ao **scrollar o painel de ferramentas, a câmera se move**, dando visibilidade ao que está sendo criado.
**Nota de decisão**: isto muda o configurador do tema escuro atual para **claro** (território loja — "o configurador é a nossa loja amarela"). Compensação: toggle "apagar a luz do ambiente" (ver §4.4) para ver a obra brilhando no escuro. ⚑ validar com Caio antes de descartar o tema escuro.

---

## 2. Fundamentos aplicados (obrigatórios em tudo)

- **Sistema aberto de cor**: o site muda de cor por **família** ([[Branding — paleta v0.1 (04-08-2026)]]). O gradiente do herói e os acentos trocam de família; a estrutura nunca muda.
- **Luz Acesa `#F6E7C4` é a única cor fixa** — aparece em toda tela (glow, acentos, CTA-texto).
- **Cor delimita, não decora**; **partes visíveis** (as junções do design — bordas, recortes — são celebradas).
- **Voz**: todo microcopy sai do [[Branding — guia de voz]]. Registro do site: 6,5–7.
- **Noise**: grain sutil **só no herói/campanha** (overlay 4–6% de opacidade, toggle `--grain` fácil de remover — decisão final é do moodboard, D8). Nunca em áreas de leitura/ferramentas.
- **Fosco por padrão**: nada de glassmorphism/brilhos; sombras suaves e superfícies chapadas.

### Tokens (colar no CSS)
```css
:root {
  /* Constantes */
  --luz-acesa: #F6E7C4;
  --areia: #E4DCCB;
  --palco-claro: #E7DFD0;
  --palco-escuro: #1E1E1E;

  /* Família ativa (default: Marco) — trocável por data-familia */
  --dominante: #7D8C6F;      /* Verde Marco */
  --acento: #D9A441;         /* Âmbar Marco */
  --profundo: #2F4A3E;       /* Verde Profundo (topo de gradiente) */

  /* Derivados */
  --grad-hero: linear-gradient(180deg, var(--profundo) 0%, var(--areia) 62%);
  --glow: radial-gradient(closest-side, var(--luz-acesa), transparent);
  --raio-painel: 24px;
  --raio-card: 12px;
  --grain: 0.05; /* 0 desliga */
}
[data-familia="brasa"] { --dominante:#B03A2E; --acento:#E5B22B; --profundo:#7B241C; }
[data-familia="sol"]   { --dominante:#CC6B2C; --acento:#E5B22B; --profundo:#8C3D14; }
```

### Tipografia (placeholder até B4)
- **Display**: Clash Display (Fontshare) — geométrica com personalidade, aguenta futuro "jogo de partes". Peso 600 para títulos.
- **UI/corpo**: Inter variable. Números tabulares no preço.
- A serifada premium atual sai. B4 (tipografia própria) substitui os placeholders depois — usar variáveis de fonte para troca barata.

---

## 3. Landing — página `/`

### 3.1 Header
Barra transparente sobre o herói. Esquerda: wordmark "Per Parte" (texto em display até o logo B3 existir). Centro: 3 pills — **Como funciona · Obras · Criadores**. Direita: pill CTA **"Criar minha obra"** → `/configurador`.
Pills: fundo `--palco-escuro`, texto `--luz-acesa`, raio total; hover: fundo `--acento`.

### 3.2 Herói "Infinitas possibilidades"
- **Fundo**: `--grad-hero` (família Marco default) + `--glow` radial atrás do título (a luz acesa por trás das palavras — a marca literal). Grain overlay opcional (§2).
- **Título** (display, ~clamp(56px, 9vw, 128px), centralizado): **"Infinitas possibilidades"** — cor `--palco-escuro` (o título assenta na zona clara do gradiente, como no print).
- **Corpo** (abaixo, máx. 52ch, centralizado): *"Escolha cada parte — ou invente as suas. A gente imprime em 3D, sob demanda, e entrega uma obra que é só sua."* (das [[Branding — copies fundadoras (04-08-2026)]]).
- **CTA primário**: pill grande **"Criar minha obra"** (fundo `--palco-escuro`, texto `--luz-acesa`; hover `--acento`). Secundário em texto: "Ver obras de outros criadores ↓".
- **Ordem em z**: fundo → anel de obras → glow → título/corpo/CTA (o título passa POR CIMA dos cards do fundo, como no print).

### 3.3 O Anel de Obras (assinatura da página)
Cards enfileirados percorrendo um **caminho elíptico contínuo**, cada card uma luminária diferente.

**Geometria** (CSS 3D puro — não precisa de WebGL):
- Container com `perspective: 1200px`; centro do anel ~58% da altura do herói.
- **N = 18 cards** (proporção 5:7, ~200×280 px desktop) distribuídos em ângulos θ uniformes.
- Posição por card: `x = rx·sin(θ)`, `z = rz·cos(θ) − rz` com `rx ≈ 42vw`, `rz ≈ 30vw`; escala e brilho caem com a profundidade (`scale 1 → 0.55`, `filter: brightness(1 → .8)`); `z-index` por profundidade. Cards sempre de frente para a câmera (billboard — sem rotação Y individual).
- **Animação**: θ avança continuamente — **1 volta a cada 75 s** (lento, hipnótico), via `requestAnimationFrame` atualizando uma CSS custom property única. Pausa suave no `hover` do anel (desacelera para 30%, não congela).
- **`prefers-reduced-motion`**: anel estático com 7 cards em leque.

**Conteúdo dos cards**: renders quadrados/retrato de obras — na v1, imagens estáticas em `/public/obras/` (usar os renders mood-pp + presets do catálogo; depois: obras reais de criadores). Card: imagem full-bleed, raio `--raio-card`, borda 1px `--palco-escuro` a 10%.
**Interação**: clique no card abre a obra no configurador via link `?c=` (o estado serializado já existe — cada card carrega seu link). Cursor: "Abrir esta obra".

### 3.4 Seções seguintes (mesma página, ordem)
1. **Manifesto** (fundo `--palco-escuro`, texto `--areia`, Luz Acesa nos destaques): o texto do manifesto das copies, terminando em "Bem-vindo à era do criar."
2. **Como funciona** — os 3 passos das copies (Monte ou invente · Veja nascer · Receba sua obra), 3 cards com ícone/mini-render.
3. **Obras dos criadores** — grade simples (placeholder: mood-pp), CTA "Ver todas".
4. **Footer** — assinatura **"Criado por você, feito por partes."** + links mínimos.

---

## 4. Configurador — página `/configurador`

### 4.1 Layout (desktop)
- **Viewport 3D**: full-bleed, ocupa a tela inteira por trás.
- **Painel de ferramentas**: coluna direita **branca** (#FFFFFF sobre página `--palco-claro`), largura ~380–420 px, raio `--raio-painel`, inset 16 px das bordas, altura total, sombra suave. Scroll interno próprio.
- **Topo do painel**: switch **Montar / Inventar** (pills) + nome editável da obra.
- **Cards flutuantes** (canto inferior esquerdo do viewport, como o print):
  - **Preço** — grande, `tabular-nums`: "R$ 469" com legenda "evolui com a sua criação". **Atualiza a cada mudança** (anima contagem, 300 ms). É o preço evolutivo virando experiência.
  - **Partes** — chip menor: "3 partes · 458 g".
- **Topo esquerdo**: logo (volta para `/`); **topo direito**: "Guardar minha obra" + "Copiar link".

### 4.2 Painel de ferramentas — seções (ordem = narrativa da obra)
1. **Base** (altura, raio, curva)
2. **Corpo** (altura, perfil livre, gomos, torção, ondulação, deslocar, berço/gola)
3. **Difusor** (forma, altura, raio, borda de cima, inclinar a cabeça)
4. **Cor & acabamento** (swatches **agrupados por família** da paleta — Marco, Brasa, Sol…; acabamentos: liso/canelado/facetas/squircle; texturas)
5. **Luz** (pontos de luz, luz acesa on/off)
6. **Regras** (a seção honesta que já existe: estabilidade, contrapeso, avisos — **sem ironia**, registro técnico)

Componentes: sliders com valor numérico à direita; swatches circulares 28 px; seção colapsável com header sticky. Os controles são os que já existem no núcleo — este redesign **não muda regra nenhuma**, só a casca.

### 4.3 Scroll-driven camera (a interação-assinatura)
Ao **scrollar o painel**, a câmera acompanha a seção visível:

| Seção visível | Câmera (alvo · distância · altura) |
|---|---|
| Base | mira a base · perto · baixa (contra-plongée leve) |
| Corpo | mira o meio · média · à altura do corpo |
| Difusor | mira o difusor · perto · alta |
| Cor & acabamento | obra inteira · longe · levemente alta, **órbita lenta contínua** |
| Luz | obra inteira · média · **ambiente escurece 70%** para o glow protagonizar |
| Regras | obra inteira · longe · neutra |

- Implementação: cada seção registra sua posição de câmera; um `IntersectionObserver` no scroll do painel define a seção ativa; a câmera **lerpa com damping** (~0,8 s até assentar; nunca corta seco).
- **O usuário sempre pode arrastar** (OrbitControls ativos). Interação manual suspende o autoenquadramento por 4 s; o próximo scroll re-sincroniza.
- `prefers-reduced-motion`: câmera muda por crossfade de posições fixas, sem órbita.

### 4.4 Cena 3D placeholder (v1)
- Chão infinito `--palco-claro` fosco + fundo em gradiente suave (`--areia` → branco) — o "estúdio bege" das referências lum-01…08.
- Luz: ambiente suave + key warm + **a própria luminária como fonte** (emissivo no difusor, tom `--luz-acesa`) + `ContactShadows` (drei).
- **Toggle "apagar a luz do ambiente"** (ícone de interruptor no viewport): escurece o estúdio para quase-preto e deixa a obra iluminando — o momento-marca. Mesmo mecanismo que a seção Luz usa.
- **Slot de cenários**: a cena é um componente trocável (`<Cenario id="estudio">`); os cenários realistas que o Davi vai enviar entram aqui depois, sem tocar no resto.

### 4.5 Estados e microcopy (do guia de voz)
- Carregando o 3D: **"Dando forma…"**
- Salvar: **"Guardar minha obra"** · Link copiado: "Link da sua obra copiado."
- Aviso de tombamento/contrapeso: manter o texto técnico honesto atual, sem ironia.
- Obra mínima: "Simples assim. E só sua."

## 5. Responsivo
- **Landing**: anel reduz para 10 cards e `rx` menor; título `clamp` já cobre; seções empilham.
- **Configurador mobile**: painel vira **bottom sheet** (3 alturas: pico 15% · meia 45% · cheia 85%); scroll-camera segue funcionando pelo scroll do sheet; cards flutuantes viram uma barra compacta acima do sheet (preço sempre visível).

## 6. Motion e acessibilidade
- Easing padrão `cubic-bezier(0.22, 1, 0.36, 1)`; durações 200–400 ms para UI, 800 ms para câmera.
- Contraste AA em todo texto (testar `--luz-acesa` sobre `--profundo` nos CTAs escuros; corpo nunca sobre gradiente no meio-tom).
- Todo o anel é decorativo para leitores de tela (`aria-hidden`), com lista alternativa de obras no DOM.
- `prefers-reduced-motion` cobre anel, câmera e contagem de preço.

## 7. Fora desta v1 (não bloqueia)
Logo desmontável (B3 — wordmark em texto até lá) · tipografia própria (B4 — placeholders acima) · cenários realistas (Davi envia) · noise na UI e ○△□ (moodboard, D8) · grade real de obras de criadores (depende do marketplace).

## 8. Ordem de implementação sugerida (para o Claude Code)
1. Tokens + tipografia + header/footer (fundação)
2. Herói com gradiente/glow/título/CTA (sem anel)
3. **Anel de Obras** (CSS 3D + rAF) com imagens placeholder
4. Seções manifesto/como funciona/obras
5. Configurador: painel branco novo com as seções (controles existentes re-skinnados)
6. **Scroll-driven camera** + cards flutuantes de preço
7. Cena placeholder + toggle "apagar a luz"
8. Responsivo + reduced-motion + passada de AA
