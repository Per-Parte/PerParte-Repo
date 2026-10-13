# Fluxo: design system

**Estado:** tokens iniciais em `packages/design-system`; sem biblioteca de componentes.

## Fonte

Revista de Marca pp. 30–46, 53–56. A documentação de uso está em `docs/design-system.md`. `packages/design-system/tokens.json` é a fonte técnica; `tokens.css` e `tokens.mjs` são gerados por `gerar.mjs`.

## Processo

1. Confirme a regra no PDF e anote página e estado da decisão em `docs/design-system.md`.
2. Altere `tokens.json` somente para valor medido/expresso na revista; marque derivados e propostas no próprio JSON.
3. Rode `npm run tokens:gerar` e depois `npm run tokens:verificar`.
4. Antes de usar famílias em produto físico, confronte o hex com o filamento impresso e a decisão de Davi/Caio (p. 39).

Gantri é referência externa, não fonte de tokens oficiais. O extrator automático falhou em reconhecer suas cores; medições de navegador estão documentadas separadamente.
