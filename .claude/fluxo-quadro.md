# Fluxo: quadro de projeto

**Estado:** primeira interface funcional em `apps/quadro`, sem backend ou autenticação.

## Papel

O quadro é o mapa visual do projeto. Ele inicia com cartões que apontam para a Revista de Marca, visão geral, design system, requisitos, roadmap, fluxos de site e configurador e pesquisa Gantri. O PDF segue como fonte primária; o quadro é um índice editável e uma área de trabalho, não um substituto das decisões oficiais em `.claude/`.

## Funcionamento

- Rodar `npm run quadro` na raiz e abrir `http://127.0.0.1:4173`.
- Arrastar o topo de cartões para reorganizar; arrastar o fundo e usar a roda do mouse para navegar; clicar em um cartão para editar no painel lateral.
- Criar nota, link, arquivo ou decisão. Selecionar um cartão, clicar em **Conectar** e selecionar o destino para desenhar uma relação.
- Buscar pelo título, descrição ou categoria; abrir documentos oficiais pelos cartões.
- Estado e anexos adicionados pelo usuário ficam no IndexedDB do navegador local. **Exportar quadro** gera JSON com cartões, conexões e anexos; **Importar quadro** restaura a cópia.

## Limites atuais

Não há sincronização entre navegadores nem edição simultânea. O quadro não grava alterações nos documentos oficiais do repositório. Exportação é necessária para levar alterações a outro computador ou guardar um backup. O servidor estático só expõe os arquivos listados em `serve.mjs` e escuta em `127.0.0.1`.

## Regra de manutenção

Quando um documento oficial mudar de lugar ou ganhar substituto, atualize o mapa de rotas em `serve.mjs` e os cartões iniciais em `app.js`. A fonte de verdade de marca permanece `docs/fonte/Per-Parte-Revista-de-Marca.pdf`.
