# Fluxo: infraestrutura do monorepo

**Estado:** organização de pastas e quadro local independente; site e configurador ainda sem runtime.

## Árvore atual

- `apps/site`: workspace reservado ao site.
- `apps/configurador`: workspace reservado ao aplicativo de criação.
- `apps/quadro`: quadro visual de contexto, servido por Node sem dependências externas.
- `packages/design-system`: tokens iniciais e gerador sem dependências externas.
- `docs/fonte`: documento mestre e extração textual.
- `docs/pesquisa`: benchmark e fontes externas.
- `.claude`: visão, requisitos, estado, glossário, fluxos e ADRs.

O root usa npm workspaces. O quadro usa HTML/CSS/JS e um servidor estático local; edições e anexos ficam em IndexedDB no navegador, com importação/exportação JSON. Não há Next.js, React, banco, API, deploy ou pacote de geometria instalado. As escolhas de site e configurador serão registradas quando houver escopo de implementação. O sistema de tokens é consumível por CSS e JavaScript; não inclui fontes ou componentes.

## Regra de extensão

Adicione um workspace somente quando tiver responsabilidade concreta. Antes de introduzir dependência entre site, configurador e produção, registre contrato e razão. A futura lógica de geometria e fabricação precisa ser única entre prévia e arquivo de produção, conforme Revista pp. 7–8 e 14.
