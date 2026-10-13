# Per Parte

**Criado por você, feito por partes.** A Per Parte começa por luminárias de mesa impressas em 3D sob demanda. A pessoa compõe ou inventa a obra no configurador; a fabricação começa depois da criação. A marca fala da autoria do cliente com acabamento premium acessível.

Este repositório foi reiniciado em 13/10/2026 para começar pela pesquisa, pelo contexto e pelo sistema visual. Ainda não há aplicação implementada.

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
packages/
  design-system/    Tokens de cor, tipografia e regras; sem componentes
docs/
  fonte/            PDF mestre e transcrição pesquisável
  pesquisa/         Referências externas e método
.claude/            Contexto de trabalho, requisitos, estado, fluxos e decisões
```

Os workspaces npm estão declarados na raiz. Stack de aplicação, backend, hospedagem e contratos entre apps serão escolhidos em uma etapa posterior. Para verificar os artefatos de tokens: `npm run tokens:verificar`.

## Estado das decisões

A revista diferencia decisões, propostas e pontos em aberto. Este repositório preserva isso: o PDF manda na direção da marca; os arquivos de contexto tornam a direção navegável; tokens derivados são marcados como provisórios quando a revista ainda pede validação.
