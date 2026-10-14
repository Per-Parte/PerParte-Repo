# Roadmap de reinício

**Atualizado em 14/10/2026.** Este roadmap acompanha decisões, sem inventar datas.

## Etapa 0 — Contexto e pesquisa

- [x] Proteger o estado antigo em Git e criar branch de reinício.
- [x] Limpar o checkout antigo; manter o histórico recuperável.
- [x] Registrar a Revista de Marca como fonte primária e criar texto pesquisável.
- [x] Criar monorepo com workspaces separados para site e configurador, ambos vazios no reinício de 13/10/2026.
- [x] Organizar contexto conforme projetos em `Desktop/fainow-projects`.
- [x] Extrair tokens iniciais da revista e pesquisar Gantri como benchmark separado.
- [x] Criar quadro visual local para navegar documentos, notas, links e decisões.

## Etapa 1 — Decisões antes do produto

- [ ] Validar com Davi e Caio as pendências da revista: logo/wordmark, tipografia final, filamentos e cores medidas na peça real, persona, preço, prazo, garantia, devolução e royalties.
- [ ] Reconciliar as guardas elétricas e de fabricação com protótipos e ensaios.
- [x] Escolher Shopify como backend comercial do site e registrar o ADR 0005.
- [x] Autorizar publicação do site em produção na Vercel e atualização de `main`, por pedido posterior de 14/10/2026; execução concluída até `fcd24a1`.
- [x] Acessar a conta correta e confirmar o projeto Vercel `per-parte-website`, da equipe `per-parte1` (PerParte), com aliases `perparte.com`/`www`.
- [x] Validar runtime/domínio público desta versão por consultas HTTP e navegação de Loja/produto; manter vanilla/Node provisório e o contrato de produção do configurador em aberto.
- [ ] Escolher critérios de aceite da experiência Montar/Inventar com usuários novatos.
- [ ] Definir se o quadro precisará de colaboração simultânea e armazenamento compartilhado; a versão inicial é local com exportação/importação.

## Etapa 2 — Aplicativos

- [x] Criar a landing visual local para três luminárias, com direção Per Parte e referência estrutural Gantri.
- [x] Adotar HTML, CSS e JavaScript com Node nativo para o protótipo reversível do site (ADR 0003).
- [x] Concluir a verificação do protótipo em desktop/mobile e registrar os resultados em `.claude/state.md`.
- [x] Implementar a revisão visual: menu de vidro escuro, três cenas e triptico de fotos, modais/fotos arredondados, Missão, rodapé amplo, processo por scroll e paleta visual de 25 cores.
- [x] Verificar na revisão desktop a sequência dos três passos por PageDown e a paleta/ocultação durante modal sem alterar as imagens dos produtos.
- [x] Verificar cor branca de Marco, seção Missão e navegação/paleta móvel em 351 × 760 CSS px, sem overflow e com seleção por teclado.
- [x] Concluir enquadramento do hero masculino móvel, confirmar console sem erros e repetir build/check após as últimas alterações; resultados em `docs/revisao-landing-2026-10-13.md`.
- [ ] Retomar vídeo real de pessoa dançando com luminária Per Parte somente após nova orientação; geração adiada explicitamente pelo usuário.
- [ ] Revisar com os sócios coleção, nomes propostos, imagens conceituais e linguagem visual antes da versão comercial.
- [x] Preparar `/loja`, `/produtos/:handle`, `/conta` e `/carrinho`, com navegação a partir das luminárias da landing.
- [x] Preparar API Node Storefront `2026-10`, catálogo em runtime, variantes e carrinho sem credenciais públicas.
- [x] Pesquisar APIs, filtros, cores, contas e setup oficial em `docs/pesquisa/shopify.md`.
- [x] Confirmar novas contas Shopify e criar onze definições de metafields `perparte` para catálogo/facetas.
- [x] Instalar Headless, criar vitrine “Per Parte — Site” e guardar token público no ambiente local ignorado.
- [x] Criar coleção automática “Todas” (`todas`) e publicar somente no Headless.
- [x] Validar Storefront autenticada: nove operações aceitas com HTTP 200/API `2026-10`, sem escrita e sem produtos fictícios.
- [x] Instalar Search & Discovery.
- [x] Aprovar treze testes de backend e nove de catálogo com casos simulados/de domínio.
- [x] Preparar adaptador Vercel local, validar configuração/build e aprovar o conjunto de 28 testes (incluindo seis do adaptador); instruções em `apps/site/HOSPEDAGEM.md`.
- [ ] Configurar facetas no Search & Discovery e conferir retorno com catálogo real.
- [ ] Cadastrar produtos e variantes aprovados, com imagens por cor e condições reais; seguir as tarefas de mídia abaixo.
- [x] Conferir estudo/conta oficial no navegador real e variantes/filtros/carrinho em fixture local, inclusive teclado e viewport de 390 px; limites em `.claude/state.md`.
- [ ] Repetir seleção, facetas e carrinho com catálogo Shopify real; fixture não comprova mercadoria ou compra.
- [ ] Validar catálogo automático e checkout com dados reais, sem realizar compra por inferência.
- [x] Configurar `checkout.perparte.com` como primário Shopify, com CNAME e HTTPS válidos, preservando DNS do frontend e email.
- [ ] Conferir término da propagação global do domínio de checkout; painel ainda indicava “Propagando” após emissão de TLS.
- [x] Corrigir o build para montar/validar assets permitidos em diretório temporário antes de substituir `dist`; aprovar 51 testes, incluindo cinco de build, e gerar 42 arquivos públicos sem arquivos de ambiente ou `.vercel`.
- [x] Publicar a versão autorizada no projeto `per-parte-website` e enviar `main` até `fcd24a1`; deploy READY. Root Directory alterado para raiz, Node 24.x, build `npm run site:build` e saída `apps/site/dist`; 12 variáveis Production cadastradas, com `SITE_ORIGINS` e `RESEND_ENABLED=false`.
- [x] Corrigir a captura `rota` repassada pela Vercel sem abrir a validação de parâmetros; 53/53 testes e `site:check` aprovados.
- [x] Validar páginas/API por GET em produção e conferir Loja com três estudos, filtro Brasa → Duna e página de Duna sem erro registrado no console. Caminhos privados testados retornaram 404; evidências em `docs/integracoes/publicacao-vercel.md`.
- [ ] Validar mutations de carrinho e checkout com catálogo real em produção. A revisão automática de aprovação bloqueou o smoke de carrinho; nenhum POST foi executado nesta rodada. Condições comerciais continuam pendentes.
- [x] Pesquisar a fonte do Hairline com a abordagem REA e registrar técnica, limites e matriz de interação em `docs/pesquisa/hairline.md`.
- [x] Implementar a interface local do configurador separado: painel, três presets + livre, formas/variações por parte, cotas, rotação SVG, cores, conclusão e reabertura.
- [x] Implementar persistência local versionada, proteção contra corrupção e preparação/download de rascunhos de pedido sem envio.
- [x] Registrar o protótipo reversível HTML/CSS/ESM + Node na porta 4175 no ADR 0004.
- [x] Concluir e registrar a revisão funcional/visual do configurador em desktop e móvel, incluindo giro, cotas, persistência e rascunhos.
- [ ] Validar o configurador com usuários novatos e revisar presets/dimensões exploratórias com engenharia.
- [ ] Evoluir o configurador para controles fabricáveis, preço vivo e prévia fiel ao contrato de produção.
- [ ] Integrar criações do configurador à conta Shopify e ao orçamento/checkout após contrato próprio; portal hospedado não sincroniza obras.
- [ ] Implementar OAuth Customer Account API se a sessão integrada for necessária; configurar HTTPS e callbacks antes da validação.

## E-mails próprios — Resend

**Decisão de 14/10/2026, ADR 0006.** O domínio está verificado e o código preparado. Um teste real de boas-vindas autorizado para `davi@perparte.com` foi confirmado como DELIVERED no Resend; a habilitação ocorreu somente no processo de teste e o ambiente persistente permanece com `RESEND_ENABLED=false`. Nenhum gatilho automático, deploy ou push foi realizado nesta etapa.

- [x] **EML-01 — Configurar domínio e remetente.** `emails.perparte.com` verificado em São Paulo (`sa-east-1`); `sistema@emails.perparte.com` como remetente e `davi@perparte.com` como Reply-To. DNS corporativo e checkout preservados; evidência em `docs/integracoes/capturas-emails/01-resend-dominio-verificado.png`.
- [x] **EML-02 — Preparar modelos e transporte.** Três modelos locais HTML/texto, galeria de prévias, transporte interno e CLI com modo prévia por padrão. Treze testes específicos e suíte geral de 46 aprovados; check/build e prévia móvel de 390 px aprovados. Validação cobre entrada, idempotência, timeout e recusa de rota pública de envio.
- [x] **EML-03 — Guardar configuração local.** Chave somente de envio em `.env.local` ignorado, com `RESEND_ENABLED=false`; configuração e `.local/emails` ignorados pelo Git. Mantê-los também fora de uploads. Sem chave em documentação, frontend ou logs.
- [ ] **EML-04 — Aprovar conteúdo e finalidade.** Revisar os três modelos e definir quais notificações próprias devem existir. Mapear as mensagens já enviadas pela Shopify para evitar duplicatas; manter OTP nativo e boas-vindas sem gatilho baseado apenas em `customers/create`.
- [ ] **EML-05 — Definir eventos reais e vínculo com destinatários.** Definir backend cloud, sessão e persistência necessários para orçamento e atualização das obras; definir evento inequívoco de boas-vindas. Aceite: provar origem autenticada, recurso existente e destinatário correto, sem depender de clique ou `localStorage`.
- [ ] **EML-06 — Implementar outbox e histórico duráveis.** Escolher armazenamento/fila, registrar estado e chave de negócio, impedir duplicatas concorrentes, manter o mesmo payload nas repetições e reconciliar resultados desconhecidos. Testar falha após aceitação, reinício e reentrega além da janela de 24 h do Resend; memória de processo não conclui esta tarefa.
- [ ] **EML-07 — Integrar somente os webhooks necessários.** Confirmar app/plano/escopos e acesso real aos dados Shopify; validar assinaturas sobre corpo bruto, loja/tópico e duplicatas antes de processar. Preparar registro de entrega/falha/supressão Resend com assinatura válida. A publicação do site foi autorizada; implementar um endpoint de eventos ainda depende de EML-05/06 e do escopo aprovado para os gatilhos.
- [ ] **EML-08 — Validar recebimento e apresentação.** Etapa parcial concluída: um teste autorizado para `davi@perparte.com` foi enviado pelo transporte e confirmado como DELIVERED no painel Resend, com remetente/Reply-To e URL de conta corretos. Ainda conferir a mensagem na caixa real, autenticação recebida, links, posição na inbox e aparência em Gmail/Outlook/Apple Mail conforme caixas disponíveis; prévia de navegador não comprova compatibilidade. Conferir também falhas/supressões com os destinatários oficiais de simulação quando usados.
- [ ] **EML-09 — Ativar em ambiente publicado.** Após contrato dos eventos, armazenamento, validação e aprovação dos gatilhos, configurar segredos no runtime e habilitar somente os envios aprovados. Monitorar entrega/falhas e documentar como interromper envios. A autorização atual de publicar o site não ativa e-mails: `RESEND_ENABLED=false` permanece obrigatório nesta etapa.

## To-dos — imagens por variação de cor

**Registrados em 14/10/2026 por pedido do usuário. Estado: A FAZER.** Esta lista é a fonte das tarefas de mídia e pode ser aberta pelo cartão **Roadmap** do quadro. A consulta Shopify desta sessão retornou zero produtos; Marco, Duna e Farol seguem como estudos locais. Nenhuma imagem foi gerada nesta atualização.

- [ ] **MID-01 — Definir a matriz de variações.** Listar, para Marco, Duna e Farol, as cores que receberão imagem, quais partes mudam e quais permanecem iguais. Partir das referências atuais (Marco: Verde Marco/Âmbar/Areia; Duna: Brasa; Farol: Lago) e registrar as demais combinações como propostas a revisar. Não assumir que todas as cores da paleta são filamentos ou variantes comerciais aprovados. Saída: matriz produto × cor × partes, com referência visual e estado de aprovação.
- [ ] **MID-02 — Gerar as variações de Marco.** Usar a imagem conceitual original como referência e produzir a imagem principal de cada combinação definida em MID-01; preservar geometria, proporções, três anéis, enquadramento, iluminação e partes não alteradas. Guardar originais, prompts e identificação da cor; manter a versão atual para comparação.
- [ ] **MID-03 — Gerar as variações de Duna.** Produzir a imagem principal de cada combinação definida em MID-01 a partir da referência atual, preservando desenho, proporções, enquadramento, iluminação e partes não alteradas. Guardar originais, prompts e identificação da cor; manter a versão atual para comparação.
- [ ] **MID-04 — Gerar as variações de Farol.** Produzir a imagem principal de cada combinação definida em MID-01 a partir da referência atual, preservando desenho, proporções, enquadramento, iluminação e partes não alteradas. Guardar originais, prompts e identificação da cor; manter a versão atual para comparação.
- [ ] **MID-05 — Selecionar e revisar as mídias.** Comparar as versões lado a lado e em miniatura de card/PDP; conferir cor nas partes corretas, silhueta, encaixes visuais, enquadramento consistente, nitidez e ausência de artefatos. Selecionar a principal de cada variação, definir imagens adicionais da galeria, preparar arquivos web e texto alternativo em pt-BR e registrar aprovação ou motivo de rejeição. Fundos coloridos dos cards atuais não contam como novas cores da luminária. Manter o aviso de imagem conceitual; conferir a correspondência com a peça/filamento real antes do uso comercial.
- [ ] **MID-06 — Vincular a mídia à variante/SKU Shopify.** Após aprovação e cadastro real do produto, registrar o mapeamento entre handle, todas as opções da variante (cor e demais eixos existentes), ID da variante, SKU real e arquivo/ID da mídia aprovada. Associar a imagem principal à variante correspondente e ordenar a galeria; não reutilizar a imagem de outra cor nem preencher SKU, preço ou estoque por inferência. Concluir somente quando a Storefront retornar a mídia correta para cada variante cadastrada.
- [ ] **MID-07 — Conferir as variações no site.** Com as mídias vinculadas, percorrer homepage, Loja e produto em desktop/móvel. Verificar imagem, nome da cor, URL/ID/SKU e preservação de outros eixos; conferir que a paleta visual mantém a grade e o filtro Cor opera separadamente. Registrar ausência de mídia como pendência, sem substituição por outra cor. Aceite: cada combinação cadastrada abre a imagem correta por link direto e por seleção, sem tornar os estudos locais compráveis.

**Revisão atual:** Marco é a referência da revista; Duna/Farol e todas as imagens continuam estudos. O site está publicado em `https://perparte.com`, com código `fcd24a1` enviado a `main`, deploy READY e leitura/navegação verificadas em produção. Headless/token e coleção `todas` estão configurados. Catálogo real, facetas e comprovação de compra ainda estão pendentes. A cor comprável precisa corresponder a variante publicada; a paleta visual não institui filamentos ou estoque. O configurador continua local, com rascunhos não enviados e sem sessão integrada. E-mails seguem sem gatilhos, com `RESEND_ENABLED=false`. A foto em gesto de dança não conclui um vídeo.

**Nota:** a revista lista uma janela entre Carnaval e Páscoa de 2027 e um D-Zero ainda sem data (pp. 8–9, 65–66). Não é prazo assumido pelo código.
