# Per Parte

**Criado por você, feito por partes.** A Per Parte começa por luminárias de mesa impressas em 3D sob demanda. A pessoa compõe ou inventa a obra no configurador; a fabricação começa depois da criação. A marca fala da autoria do cliente com acabamento premium acessível.

Este repositório foi reiniciado em 13/10/2026 para começar pela pesquisa, pelo contexto e pelo sistema visual. Ele reúne uma landing visual de três luminárias, um quadro de projeto e um configurador local de luminárias. A revisão é local; a publicação foi adiada.

## Fonte de verdade

- [Revista de Marca, edição 01](docs/fonte/Per-Parte-Revista-de-Marca.pdf): documento mestre de visão, marca, público e direção de produto.
- [Texto extraído](docs/fonte/revista-texto-extraido.md): apoio para busca por página; imagens e tabelas devem ser conferidas no PDF.
- [Visão de projeto](.claude/project.md), [requisitos e estados](.claude/requirements.md), [estado da sessão](.claude/state.md) e [roadmap](.claude/roadmap.md): contexto operacional.
- [Design system](docs/design-system.md): regras visuais e de uso, com tokens importáveis em `packages/design-system`.
- [Gantri](docs/pesquisa/gantri.md): benchmark externo, medido em 13/10/2026.
- [Hairline](docs/pesquisa/hairline.md): pesquisa de fonte para desenho SVG e interação do configurador, em 14/10/2026.
- [Direção da landing](docs/site-direcao-conteudo.md): conteúdo, três composições e distinção entre fonte da revista e propostas visuais.

## Monorepo

```text
apps/
  site/             Landing visual estática com interações locais
  configurador/     Ateliê local com composição paramétrica SVG
  quadro/           Quadro visual interativo do projeto
packages/
  design-system/    Tokens de cor, tipografia e regras; sem componentes
docs/
  fonte/            PDF mestre e transcrição pesquisável
  pesquisa/         Referências externas e método
.claude/            Contexto de trabalho, requisitos, estado, fluxos e decisões
```

Os workspaces npm estão declarados na raiz. Os três aplicativos locais usam Node nativo. O configurador é um protótipo HTML/CSS/JavaScript ESM reversível, sem framework de aplicação; sua stack comercial, backend e infraestrutura de operação permanecem em aberto.

## Executar localmente

| Comando na raiz | Resultado |
|---|---|
| `npm run site` | Landing em `http://127.0.0.1:4174` |
| `npm run site:build` | Arquivos estáticos em `apps/site/dist` |
| `npm run site:check` | Sintaxe, IDs, âncoras, imagens e presença do modo de movimento reduzido |
| `npm run preview --workspace @perparte/site` | Prévia do build na porta 4174 |
| `npm run configurador` | Ateliê local em `http://127.0.0.1:4175` |
| `npm run configurador:build` | Build estático em `apps/configurador/dist` |
| `npm run configurador:check` | Verificações estáticas do configurador |
| `npm run configurador:test` | Testes de domínio e renderização |
| `npm run preview --workspace @perparte/configurador` | Prévia do build na porta 4175 |
| `npm run quadro` | Quadro em `http://127.0.0.1:4173` |
| `npm run tokens:verificar` | Consistência dos artefatos do design system |

### Landing

A página apresenta Marco, Duna e Farol com fotografias conceituais geradas, narrativa editorial, seleção de ambientes, acordeão, detalhes, busca, favoritos e menu móvel. A composição foi pesquisada na Gantri por capturas da extensão do Chrome e adaptada à marca Per Parte. Marco tem nome e composição-base na revista; Duna e Farol são propostas. Nenhuma imagem comprova um produto fabricado.

As interações funcionam localmente. Não há checkout, conta, cadastro enviado, produção ou configurador conectado. Preço, prazo e condições comerciais aguardam definição. Veja o [fluxo do site](.claude/fluxo-site.md) e a [decisão técnica do protótipo](.claude/adr/0003-site-visual-estatico.md).

### Configurador

O ateliê abre sem login, inicialmente vazio. A pessoa escolhe Marco, Duna, Farol ou começa livremente, combina base/corpo/difusor, ajusta formas e dimensões, escolhe cores por parte e salva a composição. O painel mostra miniaturas do modelo, permite reabrir criações e destaca a composição mais recentemente criada como Nova. A tag permanece após recarregar e não muda ao editar uma obra antiga.

A peça usa desenho SVG paramétrico autoral inspirado no Hairline, com rotação por arrasto, cotas arrastáveis, zoom e controles de teclado. Os blocos de vidro discreto seguem o pedido do usuário. Presets, cores e dimensões são estudos; não constituem geometria homologada, mesh fabril ou arquivo STL.

Criações e rascunhos de pedido ficam no `localStorage` deste navegador/origem. Selecionar obras permite preparar, salvar e baixar um pedido local; nada é enviado à Per Parte. Login foi adiado, e conta, sincronização, orçamento e fabricação permanecem em aberto. Veja as [instruções do ateliê](apps/configurador/README.md), o [fluxo](.claude/fluxo-configurador.md) e a [decisão técnica](.claude/adr/0004-configurador-local-svg.md).

### Quadro

O quadro permite criar notas, links, decisões e cartões de arquivos, mover e conectar itens, pesquisar e importar/exportar cópias. Arquivos adicionados e edições ficam no navegador em que foram feitos; a exportação JSON serve para transporte e backup. Veja [instruções do quadro](apps/quadro/README.md).

## Estado das decisões

A revista diferencia decisões, propostas e pontos em aberto. Este repositório preserva isso: o PDF manda na direção da marca; os arquivos de contexto tornam a direção navegável; tokens derivados são marcados como provisórios quando a revista ainda pede validação.
