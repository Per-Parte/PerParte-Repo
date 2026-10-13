# ADR 0001 — Reinício estrutural e fonte mestre

**Data:** 13/10/2026

**Estado:** aceito para esta etapa, conforme pedido do responsável pelo projeto.

## Contexto

O responsável pediu limpeza integral do código anterior, começo de um monorepo com aplicativos separados para site e configurador e a Revista de Marca como documento mestre. O repositório anterior tinha código, documentação e alterações locais não registradas.

## Decisão

Criar uma branch a partir da `main` remota atualizada, proteger alterações locais anteriores em stash e remover o conteúdo do checkout, mantendo `.git` e o histórico. Guardar o PDF original no repositório e oferecer uma extração textual apenas para busca. Manter os aplicativos vazios. Usar `.claude/` para contexto no padrão observado em projetos de `Desktop/fainow-projects` e `packages/design-system` para tokens próprios. Gantri fica em pesquisa isolada.

## Consequências

O site publicado anteriormente não é representado pelo novo checkout. Não há aplicação para compilar ou migrar. Decisões de stack e implementação voltarão a ser feitas explicitamente, enquanto o histórico antigo continua recuperável via Git.
