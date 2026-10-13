# Per Parte

**Criado por você, feito por partes.** A Per Parte começa por luminárias de mesa impressas em 3D sob demanda. A pessoa compõe ou inventa a obra no configurador; a fabricação começa depois da criação. A marca fala da autoria do cliente com acabamento premium acessível.

Este repositório foi reiniciado em 13/10/2026 para começar pela pesquisa, pelo contexto e pelo sistema visual. O quadro de projeto é a primeira interface; site e configurador continuam reservados.

## Fonte de verdade

- [Revista de Marca, edição 01](docs/fonte/Per-Parte-Revista-de-Marca.pdf): documento mestre de visão, marca, público e direção de produto.
- [Texto extraído](docs/fonte/revista-texto-extraido.md): apoio para busca por página; imagens e tabelas devem ser conferidas no PDF.
- [Visão de projeto](.claude/project.md), [requisitos e estados](.claude/requirements.md), [estado da sessão](.claude/state.md) e [roadmap](.claude/roadmap.md): contexto operacional.
- [Design system](docs/design-system.md): regras visuais e de uso, com tokens importáveis em `packages/design-system`.
- [Gantri](docs/pesquisa/gantri.md): benchmark externo, medido em 13/10/2026.

## Monorepo

```text
apps/
  site/             Aplicação do site; ainda vazia
  configurador/     Aplicação de criação; ainda vazia
  quadro/           Quadro visual interativo do projeto
packages/
  design-system/    Tokens de cor, tipografia e regras; sem componentes
docs/
  fonte/            PDF mestre e transcrição pesquisável
  pesquisa/         Referências externas e método
.claude/            Contexto de trabalho, requisitos, estado, fluxos e decisões
```

Os workspaces npm estão declarados na raiz. Rode `npm run quadro` e abra `http://127.0.0.1:4173` para usar o quadro. Ele permite criar notas, links, decisões e cartões de arquivos, mover e conectar itens, pesquisar e importar/exportar cópias. Os arquivos adicionados e as edições ficam no navegador em que foram feitos; a exportação JSON serve para transporte e backup. Veja [instruções do quadro](apps/quadro/README.md). Site e configurador seguem sem stack definida. Para verificar os artefatos de tokens: `npm run tokens:verificar`.

## Estado das decisões

A revista diferencia decisões, propostas e pontos em aberto. Este repositório preserva isso: o PDF manda na direção da marca; os arquivos de contexto tornam a direção navegável; tokens derivados são marcados como provisórios quando a revista ainda pede validação.
