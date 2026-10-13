# ADR 0002 — Quadro local para contexto visual

**Data:** 13/10/2026
**Estado:** aceito para a primeira versão do quadro; colaboração compartilhada em aberto.

## Contexto

O projeto precisava de um quadro branco digital, interativo, para reunir fontes e informações úteis desde o reinício. Site e configurador ainda não têm stack escolhida, banco nem infraestrutura. A Revista de Marca e os documentos de `.claude/` continuam como fontes oficiais.

## Decisão

Criar `apps/quadro` como workspace independente em HTML, CSS e JavaScript. Servir apenas arquivos locais explicitamente mapeados por Node, em `127.0.0.1`. Iniciar o canvas com cartões dos documentos oficiais e benchmark Gantri. Guardar cartões, posições, conexões e anexos em IndexedDB do navegador. Oferecer exportação/importação JSON para transporte e backup.

## Consequências

O quadro funciona sem dependências, conta ou backend e pode evoluir sem escolher a stack do produto comercial. Edições ficam restritas ao navegador atual; outras pessoas não as veem automaticamente. O JSON exportado é o mecanismo inicial de compartilhamento. Uma etapa futura deve decidir se haverá persistência no repositório, servidor compartilhado e edição simultânea. Alterar um cartão não altera o documento oficial que ele referencia.
