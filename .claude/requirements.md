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
| S-03 | DECIDIDO | O escopo original era navegação local; o pedido de 14/10/2026 autoriza comércio Shopify em SH-01 a SH-12. A conexão com as criações do configurador continua pendente. Não simular compra, cadastro ou envio concluído. | Pedidos de 13/10 e 14/10/2026 |
| S-04 | PROPOSTA | Marco, Duna e Farol formam a coleção visual. Marco tem nome e composição-base na revista; a representação é estudo. Duna e Farol são propostas desta etapa. | `docs/site-direcao-conteudo.md`; revista pp. 6 e 37 |
| S-05 | DECIDIDO | Usar imagens originais geradas para completar a apresentação e informar que são conceituais. Não tratá-las como fotografias de produto fabricado. | Pedido do usuário; limite editorial do protótipo |
| S-06 | DECIDIDO | Reutilizar os tokens de `packages/design-system`; manter a tipografia provisória e não copiar tokens, fontes, logotipo ou fotos da Gantri. | D-01 a D-06; fonte de marca |
| S-07 | DECIDIDO | Não inventar preço, estoque, prazo, garantia, avaliação de cliente, selo ou material certificado. | Pendências C-01/C-02 e revista |
| S-08 | PROVISÓRIO | HTML/CSS/JavaScript e Node local continuam reversíveis; a API Shopify amplia o servidor e exige runtime além dos assets estáticos. Não fixa a stack do configurador. | ADR 0003; ADR 0005 |
| S-09 | DECIDIDO | Atualizar `main` e publicar o site em produção na Vercel. Concluído até `fcd24a1`, com deploy READY e verificação pública de leitura/navegação; checkout real continua pendente. Configurador permanece local e envios automáticos desativados. | Pedido posterior de 14/10/2026, que substitui “Publicamos depois”; `docs/integracoes/publicacao-vercel.md` |
| S-10 | DECIDIDO | Permitir teclado, menu móvel, fechamento de diálogos e redução de movimento; slideshow deve permitir pausa. | Critérios de implementação desta etapa |

## Escopo autorizado para a LP de captação

Pedido de 14/10/2026, com revisão visual Gantri Trade registrada no ADR 0009. `PERPARTE_LP_ATIVA=TRUE` nos três ambientes Vercel; chave Contacts sensitive em Production/Preview e propriedades verificadas via API. Revisão `e918b7a` publicada em `perparte.com`, deploy `dpl_HmtWz29t5wxqXoTvce7NREbzc4pf` READY, após 77 testes, check, build de 39 arquivos e QA desktop/móvel. A persistência real foi verificada na versão inicial com contato sintético QA depois removido; a revisão visual testou o formulário com resposta simulada, sem novo contato ou envio. Ver ADRs 0007/0009 e o topo de `.claude/state.md` para integrações/publicações posteriores.

| ID | Estado | Regra ou direção | Fonte |
|---|---|---|---|
| LP-01 | DECIDIDO | Trabalhar somente em `main`; estudar a estrutura Springs com `reverse-engineer-anything` e capturas da extensão Chrome para a primeira LP. Essa referência passa a ser histórica após a revisão visual LP-07. | Pedido do usuário, 14/10/2026; ADRs 0007/0009 |
| LP-02 | DECIDIDO | Ocultar o site atual sem excluir seus fontes. `PERPARTE_LP_ATIVA=TRUE` exibe a LP; `FALSE` ou ausência mantém o site completo. Mudar na Vercel exige novo build/deploy. | Pedido do usuário; ADR 0007 |
| LP-03 | DECIDIDO | Criar a variável via MCP Vercel no projeto `per-parte-website`, equipe `per-parte1`, para Production, Preview e Development. Cobrir rotas comerciais diretas e bloquear API comercial no modo LP. | Pedido do usuário; implementação reversível |
| LP-04 | DECIDIDO | Guardar cadastros no Resend Contacts, sem envio automático. Exigir e-mail e consentimento explícito; nome é opcional. Lista não cria conta, reserva, compra ou sessão do configurador. | Escolha explícita do usuário |
| LP-05 | DECIDIDO | Usar chave dedicada `RESEND_CONTACTS_API_KEY` no servidor, Full access explicitamente aprovado pelo usuário diante das opções sending/full do Resend. Propriedades string `perparte_lp_origem`, `perparte_lp_consentimento_versao`, `perparte_lp_consentimento_em`; versão inicial `2026-10-14`. Preservar opt-out e confirmar persistência antes de responder sucesso. | Aprovação explícita do usuário; contrato da implementação; ADR 0007 |
| LP-06 | DECIDIDO | Preservar estudos conceituais identificados e `RESEND_ENABLED=false`. Não publicar credenciais/prévias privadas nem tratar configuração ou testes simulados como prova de cadastro real. | Limites de marca e integração |
| LP-07 | DECIDIDO | Revisar a LP com referência Gantri Trade: fotografia ampla, Figtree leve e neutros restritos ao CSS local, preservando tokens globais. Usar quatro fotos conceituais originais, incluindo duas versões móveis, e painéis de vidro solicitados pelo usuário, com sticky desktop, fluxo móvel e movimento reduzido. Não copiar ativos/copy nem atribuir à referência parallax, GSAP ou vidro narrativo não comprovados. Preservar formulário, backend e variável de alternância. | Pedido de revisão visual; ADR 0009; `docs/pesquisa/gantri-trade.md` |

## Escopo autorizado para o comércio Shopify

Pedido explícito de 14/10/2026. `DECIDIDO` indica direção aprovada; não significa que conexão, catálogo ou checkout foram validados ao vivo.

| ID | Estado | Regra ou direção | Fonte |
|---|---|---|---|
| SH-01 | DECIDIDO | Shopify é o backend comercial do site para catálogo, variantes, carrinho e checkout. | Pedido do usuário; ADR 0005 |
| SH-02 | DECIDIDO | Criar Loja, produto, conta e carrinho; clicar nas luminárias da landing leva à página de produto. | Pedido do usuário |
| SH-03 | DECIDIDO | Usar layout e interações da Loja/produto Gantri como referência, preservando tokens, conteúdo e assets próprios da Per Parte. | Pedido do usuário; S-06 |
| SH-04 | DECIDIDO | Consultar produtos publicados em runtime; novos cadastros não exigem duplicação no código. | Pedido do usuário |
| SH-05 | DECIDIDO | Cor/tamanho compráveis resolvem variante existente com imagem, preço e disponibilidade coerentes. A paleta global visualiza a cor nos cards compatíveis sem reduzir a grade e preservando outros eixos; o filtro Cor consulta o catálogo separadamente. Nenhum seletor cria mercadoria. | Pedido do usuário; contrato Storefront; observação Gantri |
| SH-06 | DECIDIDO | Filtros e ordenação devem operar sobre catálogo remoto paginado, com facetas configuradas na Shopify; não apenas sobre a página carregada. | Escopo da Loja; pesquisa Shopify |
| SH-07 | DECIDIDO | Compra usa ID da variante e `checkoutUrl` retornada pela Shopify; não inventar produto, valor, disponibilidade ou condições comerciais. | S-07; contrato Storefront |
| SH-08 | PROVISÓRIO | Acesso de cliente inicialmente pelo portal hospedado Shopify, com e-mail e código. Não equivale a sessão do site/configurador. | Implementação inicial; ADR 0005 |
| SH-09 | EM ABERTO | OAuth Customer Account API, domínio HTTPS da conta, sincronização de criações e vínculo do configurador à conta. | Limites da implementação |
| SH-10 | DECIDIDO | Credenciais ficam no servidor, em ambiente ignorado pelo Git; API expõe operações fechadas e não aceita token Admin no frontend. | Contrato de integração |
| SH-11 | DECIDIDO | Carrinho local versionado protege dados ilegíveis; recuperação exige ação explícita. Estudos conceituais não podem ser adicionados. | Implementação inicial |
| SH-12 | EM ABERTO | Headless/token e coleção `todas` configurados; Search & Discovery instalado e smoke sem escrita aprovado. Concluir facetas, cadastrar produtos aprovados e validar seleção/carrinho/checkout reais. | Estado administrativo desta sessão |
| SH-13 | DECIDIDO | Compartilhar navbar e paleta entre homepage/Loja; atalhos por categoria, vidro nos filtros, cards com nome/indicador de cor e preço/tamanho; produto com curadoria animada, história, navegação flutuante e imagem de escala com pessoa. Exibir somente dados e imagens cadastrados; estudos não comprovam dimensões. | Pedido visual do usuário e prints Gantri, 14/10/2026 |
| SH-14 | DECIDIDO | Preservar `perparte.com`/`www` no frontend externo e usar `checkout.perparte.com` como primário Shopify. Manter domínio técnico da API e seguir `checkoutUrl`. DNS e TLS configurados; propagação global e compra real são verificações separadas. | Pedido de domínio; `docs/integracoes/dominio-shopify.md` |

## Escopo autorizado para e-mails próprios

Pedido explícito de 14/10/2026. O serviço e os modelos estão preparados; um teste real autorizado foi confirmado como DELIVERED no Resend. `DECIDIDO` não significa ativação de automações nem comprova apresentação na caixa de entrada.

| ID | Estado | Regra ou direção | Fonte |
|---|---|---|---|
| EM-01 | DECIDIDO | Usar Resend para e-mails próprios da Per Parte. Domínio `emails.perparte.com` verificado em `sa-east-1`, remetente `sistema@emails.perparte.com` e Reply-To `davi@perparte.com`. | Pedido do usuário; ADR 0006; configuração observada |
| EM-02 | DECIDIDO | Preservar o código de acesso nativo das novas contas Shopify. Resend não implementa OTP paralelo nem autentica site/configurador. | Limites da conta hospedada; pesquisa oficial |
| EM-03 | PROVISÓRIO | Renderer local HTML/texto, transporte Node interno e CLI com prévia por padrão. Modelos: boas-vindas, orçamento disponível e atualização de pedido; nenhuma rota pública de envio. | Implementação local; ADR 0006 |
| EM-04 | DECIDIDO | Enviar somente a partir de evento legítimo e destinatário vinculado. Não usar clique, favorita, salvamento local ou `customers/create` isolado como prova de cadastro/compra/orçamento ou consentimento. | Limites do produto; contrato de integração |
| EM-05 | DECIDIDO | Chave somente de envio no ambiente ignorado; `RESEND_ENABLED=false` até ativação explícita. CLI exige também `--enviar`, configuração completa e evento opaco estável; nunca registrar chave ou conteúdo pessoal em logs. | Contrato de transporte; ADR 0006 |
| EM-06 | EM ABERTO | Backend cloud, eventos autenticados, vínculo de destinatário, outbox/histórico persistentes, tratamento de reentrega, supressões e observabilidade. Idempotência Resend de 24 h não substitui persistência. | Dependências da automação |
| EM-07 | EM ABERTO | Definir quais notificações próprias serão ativadas, sem duplicar mensagens Shopify; confirmar app, escopos e acesso real a dados protegidos antes de usar webhooks. | Pesquisa Shopify/Resend |
| EM-08 | EM ABERTO | Um teste autorizado de boas-vindas para `davi@perparte.com` foi confirmado como DELIVERED no Resend. Ainda validar posição/aparência na caixa de entrada e compatibilidade nos clientes; prévia móvel de 390 px aprovada não substitui essa revisão. | Teste real e limites de QA, 14/10/2026 |

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
| K-12 | PROVISÓRIO | Persistência `localStorage` versão 2 na chave histórica, migração v1 em memória, leitura validada, proteção de conteúdo ilegível e pedidos como cópias independentes dos modelos. | Contrato `src/dominio.mjs`; ADRs 0004/0008 |
| K-13 | PROVISÓRIO | Faixas de largura/altura são apenas limites de exploração visual. Não comprovam guardas elétricas, encaixe, espessura ou estabilidade. | Contrato de domínio; engenharia pendente |
| K-14 | EM ABERTO | Sessão e sincronização do configurador, envio real de suas obras, orçamento, preço vivo e fabricação. Shopify foi escolhido para o comércio do site; sua conexão ao ateliê continua pendente. | Escopo do configurador; SH-01/SH-09 |
| K-15 | DECIDIDO | Fornecer controles de teclado, dimensionamento numérico, tratamento de movimento reduzido e aviso de alterações não salvas. | Critérios da implementação local |
| K-16 | DECIDIDO | Permitir uma base e múltiplos corpos/difusores, com identidade e parâmetros por peça; adicionar pela face escolhida diretamente no modelo ou nos controles. | Pedido do usuário, 14/10/2026; ADR 0008 |
| K-17 | DECIDIDO | Oferecer bandeja de peças arrastáveis, encaixe com retorno visual e som controlável, visualização suspensa sem chão e giro horizontal/vertical. Preservar alternativas de teclado/toque, silêncio e pausa. | Pedido do usuário; ADR 0008 |
| K-18 | DECIDIDO | Enquadrar automaticamente a composição inteira no espaço disponível, inclusive em notebook e móvel, sem exigir zoom out do navegador. | Pedido do usuário |
| K-19 | PROVISÓRIO | Conexões centralizadas por seis faces, eixos comuns, profundidade derivada da largura, uma conexão por face e até 24 peças. Regras de ocupação/interseção são exploratórias, sem homologação física. | Contrato geométrico; ADR 0008 |

## Guardas técnicas anteriores, preservadas durante o reinício

As instruções do projeto fornecidas nesta sessão chamam estas restrições de invioláveis: somente LED de até **9 W**, ao menos **25 mm** entre lâmpada e parede impressa, e nenhuma parte condutora desenhada pelo cliente. O produto não deve incluir IA sem nova decisão explícita. Antes de implementar fabricação ou afirmar conformidade, validar esses números e ensaios com Davi/Caio; a revista não os detalha. O protótipo visual autorizado em 14/10/2026 não comprova distância interna de 25 mm, segurança térmica/elétrica ou estabilidade. Suas faixas dimensionais são exploratórias, não limites fabris homologados.

## Não decidir por inferência

Shopify está decidido como backend comercial do site, publicado na Vercel no projeto `per-parte-website`, equipe `per-parte1` (PerParte), com aliases `perparte.com`/`www`. Páginas, API de leitura e navegação de estudos foram conferidas; esse aceite não comprova carrinho/checkout real nem catálogo homologado. `SITE_ORIGINS` deve conter as origens HTTPS exatas autorizadas em produção. Stack de produção/sincronização do configurador, OAuth integrado, preço definitivo, percentuais, métodos de pagamento, data de lançamento, impressora e filamento final continuam abertos. HTML/CSS/JavaScript e Node são escolhas reversíveis de implementação, não a definição de toda a arquitetura futura. A cópia fundadora da revista pede aprovação de Davi e Caio antes de publicação (p. 25).
