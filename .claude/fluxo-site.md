# Fluxo: site

**Estado:** protótipo visual local em `apps/site`, sem integrações comerciais. **Atualização:** 13/10/2026. **Decisão técnica:** ADR 0003.

## Fonte e direção

Revista de Marca pp. 26–28 (voz/cópia), 44–47 (fotografia) e 57–59 (landing e navegação). A página 57 mostra a landing “Infinitas possibilidades”; a página 58 propõe alternância de saturado, papel e escuro e uma anatomia da página da obra. A publicação de cópia fundadora depende de aprovação dos sócios (p. 25).

O pedido desta etapa é apresentar três luminárias usando a composição editorial da Gantri com identidade Per Parte. As capturas feitas pela extensão do Chrome estão em `docs/pesquisa/gantri-capturas/`; a pesquisa fica em `docs/pesquisa/gantri.md`. A revisão posterior aprofundou menu, seletor de cores, rodapé e processo: evidências em `docs/pesquisa/gantri-revisao/`, análise em `docs/pesquisa/gantri-revisao.md` e acompanhamento em `docs/revisao-landing-2026-10-13.md`. O conteúdo e a procedência das afirmações estão em `docs/site-direcao-conteudo.md`. O benchmark orienta hierarquia, respiro, navegação e transições; os tokens da marca permanecem em `packages/design-system`.

## Executar e construir

- `npm run site`: inicia o servidor nativo Node em `http://127.0.0.1:4174`.
- `npm run site:build`: gera a versão estática em `apps/site/dist`.
- `npm run site:check`: verifica sintaxe JavaScript, IDs únicos, âncoras, arquivos de imagem referenciados e presença do modo de movimento reduzido. A interação e a composição exigem verificação no navegador.
- `npm run preview --workspace @perparte/site`: serve o build na mesma porta, após encerrar a instância de desenvolvimento.
- `npm run quadro`: mantém o quadro independente em `http://127.0.0.1:4173`.

Arquivos principais: `index.html` para estrutura e conteúdo, `styles.css` para composição responsiva e movimento, `fonts.css` para fontes locais, `app.js` para interações locais, `servidor.mjs` para prévia e `construir.mjs` para build. Os assets ficam em `public/images/` e `public/fonts/`. Não há framework nem dependências de aplicação nesta etapa.

## Percurso da página

1. Navegação sobre a fotografia, destaque com três cenas e título “Criado por você,” / “Feito por partes” em duas linhas, com entrada para a coleção; menu desktop escuro com vidro/desfoque.
2. Três fotografias em colunas imediatamente após o hero; princípios da marca e introdução editorial.
3. Ambientes com seleção de cenas.
4. Coleção de Marco, Duna e Farol e acesso ao detalhe de cada obra.
5. Processo em três momentos: no desktop, a rolagem escolhe o único painel aberto e sua imagem; versão móvel e movimento reduzido mantêm navegação manual.
6. Campanha, exploração por composição, ambientes de inspiração e seção Missão explícita.
7. Encerramento e rodapé com grupos de links acima do wordmark Per Parte em grande escala.
8. Seletor flutuante de 25 cores como estudo visual da referência, independente das imagens e de qualquer catálogo comercial.

## Comportamentos locais

| Interação | Efeito esperado | Limite |
|---|---|---|
| Navegação e menus | Menu desktop escuro/translúcido com desfoque de 15 px no fundo; menu móvel e links para as seções. Setas em SVG próprio de 12 × 12 px, alinhadas ao texto e giradas 180° ao expandir. | Sem rotas comerciais ou configurador; preservar seleção, estado expandido e redução de movimento. |
| Slideshow do destaque | Alternar cenas, selecionar uma cena e pausar a alternância. | Respeitar preferência por menos movimento. |
| Seleção de ambientes | Trocar a cena e o contexto apresentados. | Não é personalização do produto. |
| Processo por rolagem | Avançar entre os três passos mantendo somente o painel ativo aberto e sua imagem correspondente. Em móvel/movimento reduzido, manter seleção manual. | Imagens são estudos, não registro da fábrica; preferência reduzida ainda requer confirmação em runtime na revisão. |
| Detalhe da luminária | Abrir janela com raio de 24 px, imagem e descrição, fechável por teclado. Enquanto aberta, ocultar os CTAs sobre as fotos e o seletor de cores. | Sem preço, pedido ou pagamento. |
| Paleta flutuante | Expandir 25 botões em sete colunas com transição de 420 ms, selecionar cor/rótulo e recolher por Escape ou controle de fechar; estado compacto com círculo de 48 px. | Não altera `src` das imagens de Marco, Duna e Farol; não confirma filamento, variante ou disponibilidade comercial. |
| Busca | Encontrar as três composições da página. | Sem catálogo remoto. |
| Favoritos | Salvar e rever escolhas no mesmo navegador. | Sem conta ou sincronização. |
| Entrada de blocos | Revelar conteúdo ao rolar, com versão de movimento reduzido. | Conteúdo deve continuar acessível sem animação. |

As setas da navbar substituem os caracteres tipográficos por chevrons vetoriais próprios: `viewBox="0 0 12 12"`, caminho `M3 4.5 6 7.5 9 4.5`, traço de 1,5 px em `currentColor`, extremidades e junções arredondadas. A caixa fixa de 12 px mantém o alinhamento independente da fonte; a rotação acompanha o estado expandido do menu e respeita movimento reduzido.

## Produtos e imagens

Marco tem nome e composição-base descritos na revista. Duna e Farol são **PROPOSTAS** de nomes e desenhos; as três representações são conceituais. O conjunto tem 20 PNGs gerados: os dez anteriores preservados, três campanhas, quatro imagens de inspiração e três fundos coloridos de estúdio. As campanhas entram no hero, nas três fotografias seguintes, nos destaques dos menus e na Missão; a galeria tem oito cards. Os três produtos de catálogo permanecem como referência. A nota “Coleção em estudo · imagens conceituais” deve permanecer acessível. Ver `docs/site-imagens.md` para dimensões, referências e hashes.

O pedido posterior de mais cor foi aplicado a `#categorias`, “Qual é a sua luz?”, com `categoria-marco-violeta.png`, `categoria-duna-verde.png` e `categoria-farol-ambar.png`. O cenário muda para violeta/lavanda, verde e vinho/laranja/âmbar, respectivamente; desenho e cores dos produtos são preservados. Não são novas variantes ou filamentos. As três imagens não têm pessoas, e esta alteração preserva as campanhas com persona e a galeria de oito cards. Cada PNG mede 1122 × 1402 e corresponde por SHA-256 ao original registrado em `docs/imagens-prompts-fundos.json`.

A direção artística aprovada pelo usuário combina expressões individualizadas, roupas dramáticas/artísticas e cenários surrealistas coloridos. Em seguida, o usuário pediu alterar somente as personagens das três campanhas para se aproximarem da persona das pp. 16–18 da revista, preservando produto, cenário e câmera. Esse refinamento foi gerado e os arquivos finais tiveram dimensões e correspondência SHA-256 com os originais conferidas. O casting é uma proposta criativa; a fonte não impõe gênero, etnia ou aparência física. Direção e limites em `docs/direcao-artistica-imagens.md`; prompts literais em `docs/imagens-prompts-campanha.json` e `docs/imagens-prompts-inspiracoes.json`.

As fotografias recebem borda fina de 1 px e cantos arredondados. O cartão Marco em “Qual é a sua luz?” teve texto branco confirmado por estilo computado `rgb(255, 255, 255)`. A seção “Nossa missão” foi conferida com imagem de Farol e seu texto.

Use Luz Acesa, neutros e Brasa conforme `docs/design-system.md`. A landing usa Unbounded nos títulos e Figtree no texto; em 13/10/2026 o usuário decidiu substituir todos os rótulos DM Mono por Figtree Light 300. Essa escolha do site não redefine a tipografia final da marca nem o token técnico compartilhado. Não converter imagens geradas em prova de acabamento real, alegação ambiental ou especificação industrial. Não adicionar preços, avaliações, estoque, prazos ou garantias sem fonte validada.

## Verificação e pendências

**Fundos coloridos:** arquivos e hashes conferidos; QA dos três cards concluído no navegador integrado. Desktop 1280 × 720: três imagens carregadas, nomes brancos (`rgb(255, 255, 255)`), peças inteiras e sem overflow. Móvel 390 × 844: três cards em uma coluna, sem overflow, luminárias inteiras e título Farol separado da cúpula. Marco no desktop e Farol no móvel abriram o detalhe correto e fecharam por Escape; console sem erros. `npm run site:check` e `npm run site:build` passaram. Evidências: `21-categorias-fundos-desktop.jpg`, `22-categorias-fundos-mobile.jpg` e `23-categoria-farol-mobile.jpg`, em `docs/pesquisa/perparte-capturas/`.

A revisão artística foi conferida com as personagens finais: campanhas desktop em Chrome pela extensão (Duna/Farol, 1482 × 734) e navegador integrado (Marco, 1280 × 720); móvel integrado em 390 × 844, com rostos/luminárias inteiros, fundos corretos e sem overflow. A galeria mostrou oito cards e os quatro novos assets carregados, avanço por seta (`scrollLeft` 0 → 339) e link do trio para `#colecao`. Console integrado sem erros; `site:check`, `site:build` e `git diff --check` passaram. Capturas 13–20 e limites da verificação em `docs/revisao-landing-2026-10-13.md`.

Registrar em `.claude/state.md` os resultados reais de build, código, assets e navegação em desktop/mobile. Conferir todas as interações acima, acesso por teclado, ausência de overflow horizontal, legibilidade sobre imagens e redução de movimento. A documentação do fluxo não substitui a execução dessas verificações.

A revisão é local. Publicação e push foram adiados pelo usuário. O vídeo real de pessoa dançando com luminária foi explicitamente **ADIADO pelo usuário em 13/10/2026**: manter a fotografia atual e retomar somente quando solicitado. Não há gerador de vídeo conectado nem clipe produzido. Não declarar slideshow/zoom ou fotografia como entrega de vídeo; consultar `docs/pesquisa/video-campanha-disponibilidade.md`.

Verificação desktop da revisão confirmou processo por PageDown em janela com 678 px de altura (avanços de 518 px), sequência 0 → 1 → 2, somente painel ativo aberto e mudança de imagens; paleta com 25 botões, seleção Cobalto sem mudar imagens, recolhimento por Escape e ocultação durante modal. Em móvel real, 351 × 760 CSS px, menu abriu/navegou/fechou e a paleta expandiu a 272 px sem overflow. O foco entrou em Flor; ArrowRight passou a Cânion, Enter selecionou e Escape recolheu. Redução de movimento foi conferida no código, sem simular a preferência do sistema.

`npm run site:check` e `npm run site:build` finais passaram após a correção de foco; build repetido após o último ajuste CSS também passou. `git diff --check` passou e o console Chrome ficou sem erros. O enquadramento da cabeça na cena masculina do hero móvel foi conferido abaixo da navbar; o fundo Vinho `#670700` une a faixa superior. Evidências em `09-mobile-hero-homem.jpg` e `11-hero-homem-desktop.jpg`, junto das demais capturas locais. Esses resultados registram a revisão anterior da interface; a revisão artística posterior é acompanhada em `docs/revisao-landing-2026-10-13.md`. O vídeo real está adiado por decisão do usuário.

Permanecem em aberto a coleção homologada, logo e tipografia finais, conteúdo aprovado pelos sócios, domínio/hospedagem, arquitetura comercial, checkout, contas e configurador.
