# Requisitos e estado das decisões

**Fonte principal:** Revista de Marca, edição 01. **Atualização:** 14/10/2026. `DECIDIDO` registra uma decisão da revista ou do usuário, conforme a fonte indicada; `PROVISÓRIO` e `PROPOSTA` não autorizam tratar o valor como final; `EM ABERTO` exige decisão; `FUTURO` fica fora do primeiro produto.

| ID | Estado | Regra ou direção | Fonte |
|---|---|---|---|
| P-01 | DECIDIDO | Produto inicial: luminárias de mesa impressas em 3D sob demanda. | pp. 5, 8 |
| P-02 | DECIDIDO | A pessoa cria a obra; a Per Parte fabrica. Autoria do cliente é o diferencial. | pp. 4–5, 13–15 |
| P-03 | DECIDIDO | Modos Montar e Inventar; liberdade apoiada em partes, formas-base e regras de fabricação. | pp. 8, 24, 50–52 |
| P-04 | DECIDIDO | Limites de fabricação entram nos controles; a ferramenta não deve gerar obra impossível de fabricar. | pp. 8, 11, 52 |
| P-05 | DECIDIDO | Preview e arquivo de produção devem representar a mesma obra. | pp. 7–8, 14 |
| P-06 | DECIDIDO | Certificado de autoria e crédito aos criadores das partes. | pp. 11, 14, 51, 55 |
| M-01 | DECIDIDO | Posicionamento premium acessível; acabamento e autoria justificam o valor. | pp. 5, 14–15 |
| M-02 | DECIDIDO | Sem cupom de rotina ou liquidação; exceção de lançamento vinculada a influenciadores. | pp. 6, 9, 21, 63 |
| M-03 | DECIDIDO | Voz lúdico-precisa, em segunda pessoa; “obra”, “composição”, “criador(a)”, “Montar” e “Inventar”. | pp. 23–28 |
| D-01 | DECIDIDO | Luz Acesa `#F6E7C4` em toda peça; uma família dominante, um neutro e no máximo cinco cores. | pp. 35–39 |
| D-02 | DECIDIDO | Brasa `#A90000` como ação e assinatura do lançamento; sem texto corrido longo sobre Brasa. | pp. 37–38 |
| D-03 | DECIDIDO | Símbolo “p” em duas partes, proporção 1198:1760, raio aproximado de 6% e área de respiro aproximada de 20% da largura. | pp. 31–34 |
| D-04 | PROVISÓRIO | Wordmark em Unbounded 600; tipografia Unbounded/Figtree/DM Mono até a escolha final B4. | pp. 32, 40–43 |
| D-05 | DECIDIDO | Fosco por padrão, sem sombra decorativa; campanha saturada e loja bege clean. | pp. 30–31, 44–46 |
| D-06 | EM ABERTO | Desenho final do wordmark, família tipográfica, paleta casada com filamentos, grão de interface e uso de formas geométricas explícitas. | pp. 39–43, 65–66 |
| C-01 | PROVISÓRIO | Entrada próxima de R$ 150, teto de R$ 1.000+ e degraus ilustrativos; preço final depende de custo. | pp. 5, 51, 66 |
| C-02 | EM ABERTO | Prazo prometido, garantia, devolução e percentual de royalty devem ser validados. | pp. 49, 65–66 |
| F-01 | FUTURO | Marketplace de partes e royalties para criadores independentes. | pp. 11, 16, 61, 66 |

## Escopo autorizado para a landing visual

Estas decisões vêm do pedido do usuário em 13/10/2026, não de uma aprovação industrial dos produtos.

| ID | Estado | Regra ou direção | Fonte |
|---|---|---|---|
| S-01 | DECIDIDO | Criar uma landing para apresentar três luminárias, usando a estrutura, hierarquia, minimalismo e interações da Gantri como referência, com identidade Per Parte. | Pedido do usuário; `docs/pesquisa/gantri.md` |
| S-02 | DECIDIDO | Usar capturas da extensão do Chrome como evidência visual do benchmark. Separar observação, medição e interpretação. | Pedido do usuário |
| S-03 | DECIDIDO | Interações locais de navegação e exploração; integrações comerciais e conexão da landing ao configurador ficam adiadas. O configurador separado foi autorizado em 14/10/2026 (K-01). Não simular compra, cadastro ou envio concluído. | Pedido do usuário |
| S-04 | PROPOSTA | Marco, Duna e Farol formam a coleção visual. Marco tem nome e composição-base na revista; a representação é estudo. Duna e Farol são propostas desta etapa. | `docs/site-direcao-conteudo.md`; revista pp. 6 e 37 |
| S-05 | DECIDIDO | Usar imagens originais geradas para completar a apresentação e informar que são conceituais. Não tratá-las como fotografias de produto fabricado. | Pedido do usuário; limite editorial do protótipo |
| S-06 | DECIDIDO | Reutilizar os tokens de `packages/design-system`; manter a tipografia provisória e não copiar tokens, fontes, logotipo ou fotos da Gantri. | D-01 a D-06; fonte de marca |
| S-07 | DECIDIDO | Não inventar preço, estoque, prazo, garantia, avaliação de cliente, selo ou material certificado. | Pendências C-01/C-02 e revista |
| S-08 | DECIDIDO | Servir o protótipo estático localmente, com build independente; escolha reversível, sem fixar a stack do configurador. | ADR 0003 |
| S-09 | DECIDIDO | Adiar publicação e push; entregar a revisão local. | “Publicamos depois”, pedido do usuário |
| S-10 | DECIDIDO | Permitir teclado, menu móvel, fechamento de diálogos e redução de movimento; slideshow deve permitir pausa. | Critérios de implementação desta etapa |

## Escopo autorizado para o configurador local

Decisões do pedido do usuário em 14/10/2026 e da implementação reversível registrada no ADR 0004. O protótipo não equivale a um produto homologado para fabricação.

| ID | Estado | Regra ou direção | Fonte |
|---|---|---|---|
| K-01 | DECIDIDO | Construir a interface do configurador em aplicativo separado dentro de `apps`; entrada direta no painel. Login fica explicitamente adiado. | Pedido do usuário, 14/10/2026 |
| K-02 | DECIDIDO | Painel com criações reais da pessoa, abertura para edição, criação nova e retorno após salvar. Não preencher a conta com obras fictícias. | Pedido do usuário; implementação local |
| K-03 | DECIDIDO | Oferecer três presets e começo livre antes do editor. | Pedido do usuário |
| K-04 | PROPOSTA | Marco, Duna e Farol são os presets de estudo; Duna/Farol e as geometrias não representam catálogo homologado. | Revista; S-04; estudo local |
| K-05 | DECIDIDO | Configurar base, corpo e difusor separadamente, com círculo/quadrado/triângulo e variações liso/ondulado/vazado/perfurado. | Pedido do usuário; catálogo inicial |
| K-06 | DECIDIDO | Controles à esquerda e prévia à direita no desktop; desenho fino inspirado no Hairline, rotação por arrasto e cotas para alterar medidas. | Pedido do usuário; pesquisa Hairline |
| K-07 | DECIDIDO | Selecionar cores por parte em etapa própria, concluir com nome, salvar e reabrir. A criação com maior `criadoEm` recebe tag Nova, persistente após recarregar; editar uma obra antiga não transfere a tag. | Pedido do usuário; implementação local |
| K-08 | DECIDIDO | Selecionar obras no painel para preparar pedido; nesta etapa, salvar rascunho local, revisar e baixar cópias JSON, sem informar envio à Per Parte. | Pedido do usuário; limite da integração não implementada |
| K-09 | DECIDIDO | Interface clean com poucas cores e vidro discreto nos blocos. Aplicação localizada do pedido ao editor; sem sombra decorativa e sem alterar acabamento físico. | Pedido explícito do usuário, 14/10/2026 |
| K-10 | PROVISÓRIO | HTML/CSS/JavaScript ESM, Node nativo na porta 4175 e build estático; escolha reversível de UI, não stack comercial. | ADR 0004 |
| K-11 | PROVISÓRIO | Renderizador SVG autoral com projeção ortográfica e modelo paramétrico compartilhado entre palco/miniaturas; sem dependência Hairline, mesh fabril ou STL. | ADR 0004; `docs/pesquisa/hairline.md` |
| K-12 | PROVISÓRIO | Persistência `localStorage` versão 1, leitura validada, proteção de conteúdo ilegível e pedidos como cópias independentes dos modelos. | Contrato `src/dominio.mjs`; ADR 0004 |
| K-13 | PROVISÓRIO | Faixas de largura/altura são apenas limites de exploração visual. Não comprovam guardas elétricas, encaixe, espessura ou estabilidade. | Contrato de domínio; engenharia pendente |
| K-14 | EM ABERTO | Login, backend, sincronização, envio real de pedido, orçamento, preço vivo, pagamento e integração com fabricação. | Escopo da sessão; dependências comerciais/industriais |
| K-15 | DECIDIDO | Fornecer controles de teclado, dimensionamento numérico, tratamento de movimento reduzido e aviso de alterações não salvas. | Critérios da implementação local |

## Guardas técnicas anteriores, preservadas durante o reinício

As instruções do projeto fornecidas nesta sessão chamam estas restrições de invioláveis: somente LED de até **9 W**, ao menos **25 mm** entre lâmpada e parede impressa, e nenhuma parte condutora desenhada pelo cliente. O produto não deve incluir IA sem nova decisão explícita. Antes de implementar fabricação ou afirmar conformidade, validar esses números e ensaios com Davi/Caio; a revista não os detalha. O protótipo visual autorizado em 14/10/2026 não comprova distância interna de 25 mm, segurança térmica/elétrica ou estabilidade. Suas faixas dimensionais são exploratórias, não limites fabris homologados.

## Não decidir por inferência

Stack comercial do configurador e do restante do produto, backend, arquitetura de conta, URLs públicas, preço definitivo, percentuais, métodos de pagamento, data de lançamento, impressora e filamento final estão abertos nesta etapa. O HTML/CSS/JavaScript do protótipo local é uma decisão reversível de apresentação, não a definição de toda a arquitetura futura. A cópia fundadora da revista pede aprovação de Davi e Caio antes de publicação (p. 25).
