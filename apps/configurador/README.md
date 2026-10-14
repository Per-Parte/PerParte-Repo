# Configurador — seu ateliê Per Parte

Protótipo local de criação de luminárias, implementado em 14/10/2026. HTML, CSS e JavaScript ESM, servido por Node nativo na porta **4175**. Esta arquitetura é **PROVISÓRIA** e reversível; não define a stack comercial.

## Executar

Na raiz do monorepo:

```powershell
npm run configurador
```

Abrir [http://127.0.0.1:4175](http://127.0.0.1:4175). O servidor escuta somente na máquina local. Login não foi implementado, conforme o pedido; a aplicação abre no painel.

| Comando na raiz | Função |
|---|---|
| `npm run configurador:build` | Copiar os arquivos estáticos, tokens e fontes para `apps/configurador/dist` |
| `npm run configurador:check` | Verificar os arquivos do aplicativo |
| `npm run configurador:test` | Executar os testes com o runner nativo do Node |
| `npm run preview --workspace @perparte/configurador` | Servir o build na porta 4175 |

O servidor aceita `PORT` para outra porta. Fontes vêm dos assets locais de `apps/site/public/fonts`; o build as copia, junto dos tokens compartilhados, para o destino estático. Não há dependência de aplicação externa para instalar.

## Fluxo disponível

1. **Suas criações:** painel inicialmente vazio, com miniaturas das composições efetivamente salvas, busca, ordenação e seleção para pedido.
2. **Nova luminária:** três presets — Marco, Duna e Farol — ou **Começar do zero**, com uma montagem inicial editável.
3. **Formas:** base, corpo e difusor independentes; círculo, quadrado e triângulo; liso, ondulado, vazado e perfurado; largura e altura por campos, faixas e cotas.
4. **Cores:** paleta visual da marca aplicada independentemente a cada parte.
5. **Concluir:** nomear, salvar e voltar ao painel. A composição com maior data `criadoEm` recebe a tag Nova, inclusive após recarregar. Editar uma obra antiga não transfere essa tag. Abrir uma obra permite editar a mesma identidade.
6. **Preparar pedido:** selecionar obras, revisar, salvar rascunho, abrir em Meus pedidos e baixar JSON.

No palco, arraste horizontalmente para girar; clique em uma parte para selecioná-la e arraste seus puxadores de cotas para dimensionar. Há zoom, restauração de vista, giro em passos, alternância Desenho/Cor e exibição de cotas. A câmera usa inclinação fixa. O modelo responde a desfazer/refazer; sair com alterações não salvas abre um aviso.

O palco focado aceita setas para giro. As cotas são sliders operáveis por teclado; os campos numéricos oferecem uma alternativa ao arrasto. Há tratamento de movimento reduzido. Essas capacidades implementadas devem ser verificadas na matriz funcional; a documentação não substitui o registro da rodada visual.

## Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| `src/dominio.mjs` | Catálogo de estudo, faixas, modelos, pedidos, validação e persistência |
| `src/renderizador.mjs` | Geometria paramétrica, projeção, SVG, miniaturas e interação do palco |
| `src/app.mjs` | Telas, navegação, seleção, histórico, diálogos e salvamento |
| `src/icones.mjs` | Ícones da interface |
| `styles.css`, `fonts.css` | Layout, vidro discreto, tipografia e adaptação de telas |
| `servidor.mjs` | Servidor local de arquivos estáticos |
| `construir.mjs` | Build estático independente |
| `tests/` | Verificações dos contratos de domínio e renderização |

## Dados locais

O armazenamento usa `localStorage`, chave `perparte.configurador.v1`, versão 1. Obras e pedidos ficam neste navegador e nesta origem; mudar entre `localhost`, `127.0.0.1` ou portas muda o armazenamento acessível. Limpar os dados do navegador pode apagar o ateliê.

A leitura valida o conteúdo antes de utilizá-lo. Dados ilegíveis não são sobrescritos automaticamente: a interface permite baixar uma cópia e reiniciar explicitamente o armazenamento. Falhas de quota/gravação são informadas sem concluir falsamente o salvamento.

Pedidos guardam cópias independentes das obras selecionadas, portanto editar uma criação posteriormente não muda um rascunho existente. O JSON exportado declara `fabricacaoAutorizada: false`. Não há importação, sincronização, conta, envio à Per Parte, orçamento ou cobrança.

## Desenho e fabricação

O renderizador é autoral, inspirado na leitura de fonte do [Hairline](../../docs/pesquisa/hairline.md); não importa o pacote nem suas figuras. Ele calcula projeção ortográfica 3D e desenha SVG. Miniaturas e prévia compartilham o modelo.

Presets, cores e dimensões são estudos visuais. As faixas de largura/altura são **PROVISÓRIAS** e não validam parede mínima, encaixes, estabilidade, dissipação térmica ou afastamento interno. Não há mesh de produção, STL ou autorização para imprimir a partir desta interface.

Permanecem as guardas do projeto: LED de até 9 W, pelo menos 25 mm entre lâmpada e parede impressa e nenhuma parte condutora desenhada pelo cliente. Engenharia deve ser confirmada antes de implementar fabricação; não inferir atendimento desses requisitos a partir da prévia. Duna/Farol continuam propostas, e não há IA no produto.

## Contexto

- [Fluxo do configurador](../../.claude/fluxo-configurador.md)
- [Requisitos e estados](../../.claude/requirements.md)
- [ADR 0004](../../.claude/adr/0004-configurador-local-svg.md)
- [Pesquisa Hairline e matriz de interação](../../docs/pesquisa/hairline.md)
- [Estado da sessão e verificações executadas](../../.claude/state.md)

Publicação e push seguem adiados. A integração industrial/comercial será uma etapa posterior.

## Verificação no navegador

O roteiro tests/navegador.mjs usa Playwright e um perfil isolado de Chrome, sem alterar as criações do navegador pessoal. Com o servidor em execução, rode node apps/configurador/tests/navegador.mjs a partir da raiz, com Playwright disponível. A variável PLAYWRIGHT_MODULE pode apontar para o módulo do runtime local; CONFIGURADOR_URL permite mudar o endereço de teste. Capturas e resultado ficam em docs/pesquisa/configurador-capturas. O app publicado não depende de Playwright.

Rodada de 14/10/2026: 12 testes Node e fluxo E2E em desktop/mobile aprovados. Consulte .claude/state.md para o escopo exato.
