# Fluxo: site

**Estado:** protótipo visual local em `apps/site`, sem integrações comerciais. **Atualização:** 13/10/2026. **Decisão técnica:** ADR 0003.

## Fonte e direção

Revista de Marca pp. 26–28 (voz/cópia), 44–47 (fotografia) e 57–59 (landing e navegação). A página 57 mostra a landing “Infinitas possibilidades”; a página 58 propõe alternância de saturado, papel e escuro e uma anatomia da página da obra. A publicação de cópia fundadora depende de aprovação dos sócios (p. 25).

O pedido desta etapa é apresentar três luminárias usando a composição editorial da Gantri com identidade Per Parte. As capturas feitas pela extensão do Chrome estão em `docs/pesquisa/gantri-capturas/`; a pesquisa fica em `docs/pesquisa/gantri.md`. O conteúdo e a procedência das afirmações estão em `docs/site-direcao-conteudo.md`. O benchmark orienta hierarquia, respiro, navegação e transições; os tokens da marca permanecem em `packages/design-system`.

## Executar e construir

- `npm run site`: inicia o servidor nativo Node em `http://127.0.0.1:4174`.
- `npm run site:build`: gera a versão estática em `apps/site/dist`.
- `npm run site:check`: verifica sintaxe JavaScript, IDs únicos, âncoras, arquivos de imagem referenciados e presença do modo de movimento reduzido. A interação e a composição exigem verificação no navegador.
- `npm run preview --workspace @perparte/site`: serve o build na mesma porta, após encerrar a instância de desenvolvimento.
- `npm run quadro`: mantém o quadro independente em `http://127.0.0.1:4173`.

Arquivos principais: `index.html` para estrutura e conteúdo, `styles.css` para composição responsiva e movimento, `app.js` para interações locais, `servidor.mjs` para prévia e `construir.mjs` para build. Os assets ficam em `public/images/`. Não há framework nem dependências de aplicação nesta etapa.

## Percurso da página

1. Navegação sobre a fotografia, destaque com duas cenas e entrada para a coleção.
2. Princípios da marca e introdução editorial com imagens.
3. Ambientes com seleção de cenas.
4. Coleção de Marco, Duna e Farol e acesso ao detalhe de cada obra.
5. Processo em três momentos, com acordeão e imagem associada.
6. Campanha, exploração por composição, ambientes de inspiração e essência da marca.
7. Encerramento e rodapé com retorno à coleção e esclarecimentos do estudo.

## Comportamentos locais

| Interação | Efeito esperado | Limite |
|---|---|---|
| Navegação e menu móvel | Abrir o menu e chegar às seções da própria página. | Sem rotas comerciais ou configurador. |
| Slideshow do destaque | Alternar cenas, selecionar uma cena e pausar a alternância. | Respeitar preferência por menos movimento. |
| Seleção de ambientes | Trocar a cena e o contexto apresentados. | Não é personalização do produto. |
| Acordeão de processo | Mostrar um passo e sua imagem correspondente. | Imagens são estudos, não registro da fábrica. |
| Detalhe da luminária | Abrir uma janela com imagem e descrição, fechável por teclado. | Sem preço, pedido ou pagamento. |
| Busca | Encontrar as três composições da página. | Sem catálogo remoto. |
| Favoritos | Salvar e rever escolhas no mesmo navegador. | Sem conta ou sincronização. |
| Entrada de blocos | Revelar conteúdo ao rolar, com versão de movimento reduzido. | Conteúdo deve continuar acessível sem animação. |

## Produtos e imagens

Marco tem nome e composição-base descritos na revista. Duna e Farol são **PROPOSTAS** de nomes e desenhos; as três representações são conceituais. O conjunto visual desta etapa prevê oito imagens originais geradas, cobrindo catálogo, campanha, ambientes e detalhe. A nota “Coleção em estudo · imagens conceituais” deve permanecer acessível.

Use Luz Acesa, neutros e Brasa conforme `docs/design-system.md`. A landing usa Unbounded nos títulos e Figtree no texto; em 13/10/2026 o usuário decidiu substituir todos os rótulos DM Mono por Figtree Light 300. Essa escolha do site não redefine a tipografia final da marca nem o token técnico compartilhado. Não converter imagens geradas em prova de acabamento real, alegação ambiental ou especificação industrial. Não adicionar preços, avaliações, estoque, prazos ou garantias sem fonte validada.

## Verificação e pendências

Registrar em `.claude/state.md` os resultados reais de build, código, assets e navegação em desktop/mobile. Conferir todas as interações acima, acesso por teclado, ausência de overflow horizontal, legibilidade sobre imagens e redução de movimento. A documentação do fluxo não substitui a execução dessas verificações.

A revisão é local. Publicação e push foram adiados pelo usuário. Permanecem em aberto a coleção homologada, logo e tipografia finais, conteúdo aprovado pelos sócios, domínio/hospedagem, arquitetura comercial, checkout, contas e configurador.
