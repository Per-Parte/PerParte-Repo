# ADR 0004 — Configurador local com desenho paramétrico SVG

- **Data:** 14/10/2026.
- **Estado:** **PROVISÓRIO**, decisão reversível de implementação da interface local.
- **Escopo autorizado:** **DECIDIDO** pelo pedido do usuário: construir a interface completa em um aplicativo separado dentro de `apps`; login adiado.

## Contexto

O configurador estava reservado desde o reinício de 13/10/2026. O usuário solicitou painel de criações, três presets e criação livre, montagem independente de base/corpo/difusor, famílias e variações geométricas, edição dimensional por cotas, rotação com estilo Hairline, cores por parte, conclusão/salvamento e seleção para pedido. Pediu linguagem clean, poucas cores e blocos com glassmorphism.

A pesquisa com a abordagem REA examinou as fontes públicas de Hairline 0.5.0. O pacote oferece figuras prontas; o motor interno usa projeção 3D ortográfica, SVG e ordenação de superfícies. Não oferece um configurador CAD genérico nem contrato de produção. Evidências, licença e limites em `docs/pesquisa/hairline.md`.

## Decisão

Implementar o protótipo em `apps/configurador`, com HTML, CSS e JavaScript ESM vanilla. Servir arquivos por Node nativo em `127.0.0.1:4175`, sem backend de negócio. Gerar build estático independente. Essa escolha permite revisar a experiência local sem instituir a stack do futuro produto comercial.

Criar renderizador autoral que calcula geometria paramétrica e projeção ortográfica, com superfícies ordenadas e traço fino inspirado no Hairline. Não depender do pacote nem copiar suas figuras. Miniaturas e palco usam o mesmo modelo. A rotação horizontal é real na projeção; cotas alteram os parâmetros da parte ativa. Não há mesh de produção, STL ou exportação CAD.

Concentrar catálogo e regras do estudo em `src/dominio.mjs`: base/corpo/difusor; círculo/quadrado/triângulo; liso/ondulado/vazado/perfurado; largura, altura e cor por parte; presets Marco/Duna/Farol e composição livre. As faixas são **PROVISÓRIAS**, não limites industriais homologados.

Persistir obras e rascunhos em `localStorage` versionado, com validação estrita da leitura e bloqueio de sobrescrita de conteúdo inválido. Pedidos guardam cópias independentes das composições e podem ser baixados em JSON; ficam explicitamente como rascunhos locais, sem envio e sem autorização de fabricação.

Usar tokens Per Parte, tipografia provisória e vidro discreto nos blocos conforme a orientação explícita desta sessão. Essa direção amplia o tratamento fosco padrão da revista para a interface do editor; não altera acabamento físico nem introduz sombras decorativas.

## Consequências

- A interface funciona sem login, serviço de conta ou dependências de aplicação instaladas.
- Obras pertencem ao armazenamento do navegador/origem; não há acesso entre dispositivos nem recuperação por conta.
- Formas, cores, cotas e miniaturas podem ser revisadas antes de definir a cadeia de produção.
- A proteção contra corrupção preserva os dados ilegíveis até uma reinicialização explícita; não substitui backup ou sincronização.
- A prévia permanece um estudo. Os requisitos de equivalência com produção, segurança e estabilidade exigem contrato/engenharia posterior.
- O servidor local é de arquivos estáticos; este ADR não cria uma API comercial.

## Limites preservados

LED até 9 W, mínimo de 25 mm entre lâmpada e parede impressa e nenhum condutor desenhado pelo cliente continuam como guardas para engenharia. A prévia não atesta seu cumprimento. Não há IA no produto, preço inventado, orçamento enviado, estoque ou prazo comercial.

Login foi explicitamente adiado; stack comercial, backend, fabricação e checkout permanecem em aberto. Duna/Farol são propostas de composição. A landing e seus fluxos locais continuam separados.

Publicação e push permanecem adiados por orientação anterior. A primeira tentativa de `git pull` encontrou `.git/FETCH_HEAD: Permission denied`; repetida com a permissão necessária do sandbox, concluiu com `Already up to date`.

## Validação

Os comandos de check, build, tokens e 12 testes de domínio/renderização passaram. Um teste E2E em Chrome headless isolado percorreu criar, editar, girar, dimensionar por mouse/teclado, colorir, persistir após recarga, preparar pedido de duas obras e baixar JSON. Desktop de 1440 px e fluxo móvel completo de 320 px, capturas também em 390 px, sem overflow horizontal e sem pageerror. Movimento reduzido foi emulado.

A primeira revisão detectou altura intrínseca excessiva do SVG; foi corrigida antes da rodada aprovada. Resultados e capturas estão em docs/pesquisa/configurador-capturas, roteiro em apps/configurador/tests/navegador.mjs. CUA/Playwright MCP falharam na conexão; a execução que comprovou os fluxos usou Chrome isolado e dados de teste descartáveis. Aprovação de produto/engenharia continua separada dos testes da interface.
