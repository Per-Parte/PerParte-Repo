# Per Parte

**Criado por você, feito por partes.** A Per Parte começa por luminárias de mesa impressas em 3D sob demanda. A pessoa compõe ou inventa a obra no configurador; a fabricação começa depois da criação. A marca fala da autoria do cliente com acabamento premium acessível.

Este repositório foi reiniciado em 13/10/2026 para começar pela pesquisa, pelo contexto e pelo sistema visual. Ele reúne uma landing visual de três luminárias, um quadro de projeto e o workspace reservado ao configurador. A revisão é local; a publicação foi adiada.

## Fonte de verdade

- [Revista de Marca, edição 01](docs/fonte/Per-Parte-Revista-de-Marca.pdf): documento mestre de visão, marca, público e direção de produto.
- [Texto extraído](docs/fonte/revista-texto-extraido.md): apoio para busca por página; imagens e tabelas devem ser conferidas no PDF.
- [Visão de projeto](.claude/project.md), [requisitos e estados](.claude/requirements.md), [estado da sessão](.claude/state.md) e [roadmap](.claude/roadmap.md): contexto operacional.
- [Design system](docs/design-system.md): regras visuais e de uso, com tokens importáveis em `packages/design-system`.
- [Gantri](docs/pesquisa/gantri.md): benchmark externo, medido em 13/10/2026.
- [Direção da landing](docs/site-direcao-conteudo.md): conteúdo, três composições e distinção entre fonte da revista e propostas visuais.

## Monorepo

```text
apps/
  site/             Landing visual estática com interações locais
  configurador/     Aplicação de criação; ainda vazia
  quadro/           Quadro visual interativo do projeto
packages/
  design-system/    Tokens de cor, tipografia e regras; sem componentes
docs/
  fonte/            PDF mestre e transcrição pesquisável
  pesquisa/         Referências externas e método
.claude/            Contexto de trabalho, requisitos, estado, fluxos e decisões
```

Os workspaces npm estão declarados na raiz. O protótipo e o quadro usam Node nativo, sem framework de aplicação. A stack do configurador e da futura operação comercial permanece em aberto.

## Executar localmente

| Comando na raiz | Resultado |
|---|---|
| `npm run site` | Landing em `http://127.0.0.1:4174` |
| `npm run site:build` | Arquivos estáticos em `apps/site/dist` |
| `npm run site:check` | Sintaxe, IDs, âncoras, imagens e presença do modo de movimento reduzido |
| `npm run preview --workspace @perparte/site` | Prévia do build na porta 4174 |
| `npm run quadro` | Quadro em `http://127.0.0.1:4173` |
| `npm run tokens:verificar` | Consistência dos artefatos do design system |

### Landing

A página apresenta Marco, Duna e Farol com fotografias conceituais geradas, narrativa editorial, seleção de ambientes, acordeão, detalhes, busca, favoritos e menu móvel. A composição foi pesquisada na Gantri por capturas da extensão do Chrome e adaptada à marca Per Parte. Marco tem nome e composição-base na revista; Duna e Farol são propostas. Nenhuma imagem comprova um produto fabricado.

As interações funcionam localmente. Não há checkout, conta, cadastro enviado, produção ou configurador conectado. Preço, prazo e condições comerciais aguardam definição. Veja o [fluxo do site](.claude/fluxo-site.md) e a [decisão técnica do protótipo](.claude/adr/0003-site-visual-estatico.md).

### Quadro

O quadro permite criar notas, links, decisões e cartões de arquivos, mover e conectar itens, pesquisar e importar/exportar cópias. Arquivos adicionados e edições ficam no navegador em que foram feitos; a exportação JSON serve para transporte e backup. Veja [instruções do quadro](apps/quadro/README.md).

## Estado das decisões

A revista diferencia decisões, propostas e pontos em aberto. Este repositório preserva isso: o PDF manda na direção da marca; os arquivos de contexto tornam a direção navegável; tokens derivados são marcados como provisórios quando a revista ainda pede validação.
