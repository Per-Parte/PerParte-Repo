# Emails transacionais — Shopify e Resend

**Pesquisa e atualização operacional:** 14/10/2026. **Estado:** domínio Resend verificado, três modelos locais e transporte Node preparados; um teste de boas-vindas autorizado para `davi@perparte.com` foi enviado e aparece como **DELIVERED** no Resend. O site foi publicado na Vercel com código `fcd24a1` enviado a `main`; `RESEND_ENABLED=false` permanece nos ambientes local e Production. Nenhum gatilho/webhook automático foi ligado. Evidências da publicação em [publicacao-vercel.md](publicacao-vercel.md).

## Configuração aplicada e limites

Resend foi configurado para mensagens próprias da Per Parte; os códigos de acesso continuam nativos da Shopify. A CLI gera prévias por padrão e exige `--enviar`, `RESEND_ENABLED=true` e configuração completa para uma tentativa real. Personalizar notificações comerciais dentro da Shopify e ativar automações são etapas distintas, ainda não comprovadas por esta configuração.

**OBSERVADO no projeto:** site vanilla/Node publicado em `https://perparte.com`, API de leitura Shopify respondendo na Vercel e novas contas hospedadas em `https://shopify.com/102503383338/account`, sem sessão local de cliente. O configurador guarda criações e pedidos somente no navegador. Não existe evento comercial de fabricação comprovado por esses rascunhos. A publicação não criou endpoint público de webhook nem rota de disparo de email; `/emails/transporte.mjs` retornou 404 na verificação pública.

**CONFIGURADO:** `emails.perparte.com` foi criado no Resend na região São Paulo (`sa-east-1`) e está **VERIFIED**, com envio habilitado e recebimento desabilitado. O Domain Connect da GoDaddy aplicou os registros de autenticação abaixo. Remetente definido: `Per Parte <sistema@emails.perparte.com>`; `Reply-To`: `davi@perparte.com`.

| Registro DNS aplicado | Destino/estado |
|---|---|
| TXT `resend._domainkey.emails` | DKIM gerado pelo Resend; valor não reproduzido neste documento |
| CNAME `rsend.emails` | `rsend-sae1.forge.rmta.net` |
| CNAME `send.emails` | `send.forge.rmta.net` |

A credencial existente em `.mcp.json` foi verificada como **válida e somente de envio**. A resposta `restricted_api_key` em `GET /domains` indica insuficiência de permissão para listar domínios, não chave inválida. Foram confirmados a cópia das seis variáveis para `.env.local`, o arquivo ignorado pelo Git e `RESEND_ENABLED=false` persistente. Na publicação, foram cadastradas 12 variáveis Production para o site e suas integrações, com credenciais protegidas e Resend desativado. Não imprimir o valor nem ampliar permissões apenas para enviar. Templates remotos e webhooks não foram ativados. Ver [domínio Shopify](dominio-shopify.md) e [hospedagem](../../apps/site/HOSPEDAGEM.md).

## Limites das novas contas Shopify

A documentação declara que o conteúdo padrão do email de código de verificação não é editável. O login nativo usa código temporário; conectar um provedor de identidade próprio para substituir essa experiência exige Shopify Plus. Resend é transporte de email, não um provedor de identidade completo. Portanto não implementar OTP paralelo, recuperação de senha ou “confirmação de cadastro” que aparentem controlar a autenticação Shopify. [Opções de personalização das contas](https://help.shopify.com/en/manual/customers/customer-accounts/upgrade/customization-options).

Na mesma documentação, os gatilhos `customer account enabled/disabled` são relativos a contas legadas e não permitem automação de primeiro login nas novas contas. Um perfil é criado automaticamente quando alguém entra com email ainda desconhecido; perfis também podem existir antes desse login. **Conclusão de implementação:** criação de perfil não equivale a login, cadastro intencional no site ou consentimento de marketing. [Limites dos eventos de conta](https://help.shopify.com/en/manual/customers/customer-accounts/upgrade/customization-options).

| Mensagem | Responsável proposto | Critério de ativação |
|---|---|---|
| Código de acesso | Shopify | Preservar fluxo nativo; nenhum template Resend de OTP |
| Confirmação de pedido, envio e reembolso | Shopify, com template editável quando disponível | Revisar o template real e suas variáveis; evitar segundo email equivalente |
| Boas-vindas | Modelo local preparado; teste único entregue; gatilho desativado | Para automação futura, definir evento inequívoco sem alegar autenticação/fabricação |
| Orçamento disponível | Modelo local Resend preparado, sem gatilho | Orçamento real disponível e vínculo com destinatário comprovado |
| Atualização de pedido | Modelo local Resend preparado, sem gatilho | Evento real validado; não deduz produção, pagamento, envio ou prazo |

A maior parte das notificações Shopify é automática e não pode ser desativada livremente. Algumas podem ser omitidas na ação de cancelar/reembolsar/expedir; Shopify Plus permite solicitar desativação de notificações específicas ao suporte. **Não duplicar confirmação de pedido via Resend presumindo que a original foi desligada.** [Notificações de clientes](https://help.shopify.com/en/manual/fulfillment/setup/notifications/customer-notifications).

## O que personalizar dentro da Shopify

**Configurações → Notificações → Notificações de clientes → Personalizar template de email** permite logotipo e cor de destaque. Para uma notificação específica: abrir seu nome → **Edit code** → editar assunto e corpo HTML/Liquid → **Preview** → salvar. Confirmar o remetente antes de editar assunto/corpo. Preservar variáveis e links funcionais do template original; logotipo, texto e cores Per Parte não autorizam inventar prazo, garantia, estoque ou status. A prévia não envia email; **Send test email** envia à conta usada no admin e não deve ser acionado sem destinatário definido. [Templates Shopify](https://help.shopify.com/en/manual/fulfillment/setup/notifications/customizing-notification-template).

O remetente Shopify é configurado em **Configurações → Notificações → Sender email**. Autenticar o domínio usando os CNAME exibidos pela própria Shopify e o DMARC correspondente. Esses CNAME cuidam de DKIM/SPF da Shopify; não inserir um segundo SPF TXT no mesmo host por conta própria. Verificar o status **Authenticated**. Autenticação Resend não autentica automaticamente o remetente Shopify. [Email e domínio remetente Shopify](https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/setup-your-email).

**SMTP externo:** não foi encontrada, nas opções oficiais de notificações consultadas, configuração para substituir o transporte nativo da Shopify por credenciais SMTP Resend. O caminho documentado é editar templates/remetente Shopify ou emitir mensagens próprias por uma integração separada. Não apresentar SMTP como substituição do email de login.

## Resend: domínio, remetente e transporte

**Domínio aplicado:** `emails.perparte.com`, separado de `checkout.perparte.com` e da caixa postal corporativa. O remetente configurado para esta integração é `sistema@emails.perparte.com`, com respostas para `davi@perparte.com`. Resend recomenda subdomínio para separar finalidade e reputação. [Domínios verificados](https://resend.com/docs/dashboard/domains/introduction).

Roteiro de configuração já aplicado ao domínio; preservado como referência, sem recriar registros:

1. Resend → **Domains → Add Domain**; informar o domínio escolhido e região apropriada.
2. Copiar os registros DKIM e SPF/Return-Path gerados na aba **Records**, incluindo nomes, tipos e valores exatos. Os tipos podem ser TXT/MX ou CNAME; não fixar valores de tutoriais.
3. Adicionar somente os registros necessários na GoDaddy. Preservar A/`www`, `checkout` e MX corporativo `perparte-com.mail.protection.outlook.com`. Conferir DMARC existente antes de qualquer ajuste.
4. Verificar DNS público e aguardar **Verified** no Resend; tempo de propagação não comprova sucesso.
5. Selecionar `From` no domínio verificado e `Reply-To` em caixa real monitorada; nesta integração, usar os valores confirmados acima.

[Adicionar/verificar domínio](https://resend.com/docs/add-a-domain), [evitar conflito com MX](https://resend.com/docs/knowledge-base/how-do-i-avoid-conflicting-with-my-mx-records).

A verificação de envio permite usar endereços daquele domínio, mas não migra o recebimento corporativo para Resend. Manter respostas na caixa existente mediante `Reply-To`; recebimento/inbox Resend é uma configuração separada e não necessária para este escopo. [Endereços remetentes](https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend).

**Transporte preparado:** API HTTPS `POST https://api.resend.com/emails` no servidor, com bearer token, HTML e texto simples renderizados localmente. A implementação atual não depende de template remoto nem React Email. [Enviar email](https://resend.com/docs/api-reference/emails/send-email).

SMTP permanece alternativa para um serviço próprio que o exija: `smtp.resend.com`, usuário `resend`, senha igual à API key; preferir porta 465 com TLS implícito ou 587 com STARTTLS obrigatório. Isso não muda o emissor das notificações Shopify. [SMTP Resend](https://resend.com/docs/send-with-smtp).

**PROPOSTA de segurança de transporte:** configurar Enforced TLS no domínio Resend para recusar entrega a servidores que não suportem TLS. Há uma troca concreta: maior proteção de transporte, mas falha de entrega nesses destinatários. O padrão documentado é TLS oportunista, que pode recuar para envio sem criptografia. [TLS Resend](https://resend.com/docs/dashboard/domains/tls).

## Modelos locais preparados

Os módulos [modelos.mjs](../../apps/site/emails/modelos.mjs), [transporte.mjs](../../apps/site/emails/transporte.mjs) e [enviar.mjs](../../apps/site/emails/enviar.mjs) estão preparados. O renderer retorna assunto, HTML e texto simples, usa identidade Per Parte, estilos inline e fontes de fallback, escapa conteúdo e valida links HTTPS nas origens configuradas. A galeria [docs/emails](../emails/index.html) usa dados fictícios e identifica as simulações. Não há imagens remotas, rastreadores ou scripts no HTML dos emails.

| Tipo atual da CLI | Campos de dados | Situação |
|---|---|---|
| `boas-vindas` | `nome` opcional | Saudação sem alegar cadastro, pedido ou autenticação |
| `orcamento-disponivel` | `numero`, `url`; `nome` opcional | Modelo pronto; orçamento real e destinatário ainda dependem do chamador |
| `atualizacao-pedido` | `numero`, `titulo`, `mensagem`, `url`; `nome` opcional | Modelo pronto; só exibe a atualização fornecida, sem inferir estado comercial |

Contrato detalhado em [docs/emails/README.md](../emails/README.md). Na rodada de implementação dos emails, **46/46 testes passaram**, incluindo os **13 testes de email com transporte simulado**, além de `site:check` e build aprovados. A prévia móvel de 390 px foi medida sem overflow. Separadamente, o teste real abaixo teve entrega confirmada no Resend; a aparência dentro da caixa de entrada ainda não foi confirmada.

## Templates remotos — capacidade futura

O Resend oferece templates por editor, HTML e API; podem ser criados, revisados e publicados separadamente. Publicar o template permite referenciá-lo no envio, mas não dispara mensagem por si só. [Templates](https://resend.com/docs/dashboard/templates/introduction), [criar](https://resend.com/docs/api-reference/templates/create-template), [publicar](https://resend.com/docs/api-reference/templates/publish-template).

Se a equipe optar por administrar templates no Resend futuramente, este é o contrato sugerido para `perparte-boas-vindas-v1`; não representa o contrato atual da CLI nem um template remoto já criado:

| Variável | Origem | Regra |
|---|---|---|
| `NOME_CLIENTE` | Dado autorizado, opcional | Saudação neutra quando ausente; sem HTML livre |
| `URL_CONTA` | Configuração do servidor | URL de conta Shopify confirmada |
| `URL_SITE` | Configuração do servidor | Usar somente quando a versão pública estiver confirmada |
| `EMAIL_SUPORTE` | Configuração aprovada | Caixa existente, não endereço inventado |

No Resend, `FIRST_NAME`, `LAST_NAME`, `EMAIL` e `UNSUBSCRIBE_URL` são nomes reservados. Ao enviar `template: {id, variables}`, não incluir `html`, `text` ou `react` no mesmo payload. O template precisa estar publicado; variáveis obrigatórias ausentes devem resultar em erro controlado. [Contrato de envio](https://resend.com/docs/api-reference/emails/send-email).

O texto de boas-vindas deve orientar a pessoa sem afirmar “conta confirmada”, “pedido recebido”, “produção iniciada” ou cadastro no configurador. Um template promocional precisa de finalidade/consentimento próprios; não converter todos os clientes Shopify em contatos de campanha.

## Shopify: webhooks e dados de cliente

`CUSTOMERS_CREATE` / `customers/create` ocorre quando um cliente é criado e exige `read_customers` no app. O token público do canal Headless não possui esse acesso administrativo. Usar app e assinatura de webhook próprios, com o mínimo de dados necessários. [Tópicos e escopos](https://shopify.dev/docs/api/admin-graphql/latest/enums/webhooksubscriptiontopic).

Email e nome são dados protegidos de nível 2. As regras variam entre app público, custom e custom criado no admin; a documentação de desenvolvimento exige tratar campos negados/omitidos. O Help Center atual informa que Custom Level 2 PII apps exigem Grow ou superior. **PENDENTE:** confirmar plano, distribuição/tipo do app e acesso real antes de depender do email no payload; não presumir que o acesso do MCP administrativo pertence ao runtime do site. [Dados protegidos](https://shopify.dev/docs/apps/launch/protected-customer-data), [tipos de app e plano](https://help.shopify.com/en/manual/apps/about-apps).

Não usar payload antigo como contrato: desde `2025-01`, `email_marketing_consent`, tags e outros campos deixaram os payloads de cliente, passando a tópicos específicos. Ausência do campo não é consentimento. Não usar `state: enabled` nem `verified_email` isoladamente como prova de primeiro login no nosso frontend. [Mudança dos payloads de cliente](https://shopify.dev/changelog/posts/new-customer-s-webhook-and-changes-to-existing-customer-s-webhooks-payload).

**Regra proposta:** `customers/create` pode alimentar a integração, mas o envio de boas-vindas fica desligado enquanto não houver critério explícito que diferencie perfis criados por checkout, importação, admin e login. Não criar um formulário de senha próprio só para produzir esse evento.

## Uso atual da CLI e prévias

Comandos conferidos no código e em `node apps/site/emails/enviar.mjs --ajuda`. Executar a partir da raiz do repositório:

```sh
node apps/site/emails/enviar.mjs --ajuda
node docs/emails/gerar-previas.mjs
node docs/emails/servir-previas.mjs
```

O gerador atualiza as prévias fictícias, sem enviar mensagens. O servidor de galeria expõe somente arquivos permitidos em `http://127.0.0.1:4182`; encerrar com `Ctrl+C`.

Para gerar uma prévia individual, preparar um arquivo JSON local de dados — por exemplo, `.local/emails/dados-boas-vindas.json` contendo `{"nome":"Pessoa de teste"}` — e executar:

```sh
node apps/site/emails/enviar.mjs --tipo boas-vindas --para pessoa@example.test --evento previa-001 --dados .local/emails/dados-boas-vindas.json
```

Esse comando **não envia**. `example.test` é somente marcador de prévia, nunca destinatário real. A CLI carrega o ambiente local e grava `email.html` e `email.txt` em um diretório único dentro de `.local/emails`; não publicar essas prévias quando contiverem dados pessoais.

Configuração persistente confirmada, sem reproduzir o segredo:

```dotenv
RESEND_API_KEY=<chave privada no ambiente local ignorado>
RESEND_ENABLED=false
EMAIL_FROM="Per Parte <sistema@emails.perparte.com>"
EMAIL_REPLY_TO=davi@perparte.com
EMAIL_SITE_URL=https://perparte.com
EMAIL_ACCOUNT_URL=https://shopify.com/102503383338/account
```

Um envio futuro pela CLI exige destinatário real definido, evento legítimo, configuração completa, `RESEND_ENABLED=true` e acrescentar `--enviar` ao comando. Essa opção faz **uma tentativa**, sem retry automático. Preservar evento, conteúdo e configuração ao repetir; em timeout, verificar o provedor antes de nova tentativa. Não há fila nem histórico persistente de envios. Para o teste único desta sessão, a habilitação ocorreu somente no processo de teste, sem alterar o valor persistente `false`.

## Automação Node/Vercel — proposta ainda não ativa

O transporte/CLI local estão preparados; o fluxo abaixo continua **PROPOSTA**, sem endpoints ou gatilhos automáticos ligados:

```text
Evento Shopify assinado → endpoint Node → registro durável + fila
                                               ↓
                              validar finalidade/destinatário
                                               ↓
                              renderizar template → API Resend
                                               ↓
Webhook Resend assinado → registrar entrega/falha/supressão
```

Rotas propostas: `POST /api/webhooks/shopify` e `POST /api/webhooks/resend`, atendidas pelo servidor local e adaptador Vercel. Não expor endpoint público de envio que aceite `to`, assunto ou HTML arbitrários. Templates e variáveis de ambiente são do servidor; nenhuma API key deve aparecer em bundle, build, Git ou resposta de diagnóstico.

Para Shopify, validar HMAC SHA-256 sobre o corpo bruto antes de interpretar JSON, usando o segredo correto da assinatura. Conferir loja/tópico esperados. Persistir IDs de entrega; `X-Shopify-Webhook-Id` deduplica entregas e `X-Shopify-Event-Id` correlaciona assinaturas do mesmo evento. Responder 2xx após persistência/enfileiramento, em até cinco segundos. A Shopify tenta novamente até oito vezes em quatro horas; assinatura via Admin API pode ser removida após falhas consecutivas. [Verificação e entrega de webhooks](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries).

Para Resend, validar corpo bruto e cabeçalhos `svix-id`, `svix-timestamp`, `svix-signature` com o segredo do endpoint, por SDK ou Svix. Rejeitar assinatura inválida antes de processar. [Verificação Resend](https://resend.com/docs/webhooks/verify-webhooks-requests).

Monitorar entrega, rejeição permanente e reclamação. Um `id` retornado pela API significa aceitação da requisição, não comprovação de chegada à caixa de entrada. Registrar apenas metadados necessários, manter supressões e evitar novo disparo para endereços rejeitados permanentemente ou que reclamaram. [Webhooks Resend](https://resend.com/docs/webhooks/introduction).

**Deduplicação proposta:** chave de negócio estável por mensagem, por exemplo `boas-vindas/{loja}/{cliente}/v1`, com registro durável de estado e `email_id`. Repetições devem usar o mesmo payload. Resend mantém `Idempotency-Key` por 24 horas e aceita até 256 caracteres; sua janela não substitui o histórico da aplicação. [Idempotência Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).

No runtime Vercel, um `Map` em memória ou arquivo temporário não serve como deduplicação persistente entre instâncias. Banco/fila duráveis continuam uma dependência de ativação: preparar uma interface substituível e fixtures locais, sem declarar automação pronta para produção antes de escolher e testar esse armazenamento. Não iniciar envio em background sem garantia de execução depois da resposta HTTP.

As variáveis atuais são as da CLI acima. `RESEND_WEBHOOK_SECRET`, segredo do webhook Shopify e IDs de templates remotos seriam configurações adicionais futuras. A chave atual é somente de envio; operações administrativas de domínios/templates precisam de permissão diferente. Não tratar `restricted_api_key` como expiração/invalidez da credencial. [Chaves e restrições](https://resend.com/docs/dashboard/api-keys/introduction).

## Validação e aceite

**Validação local da rodada de emails:** suíte completa com 46/46 testes aprovados, incluindo 13 de email com transporte simulado; verificação do site e build aprovados. As medidas da prévia móvel de 390 px não mostraram overflow. Para automação futura, ainda verificar assinaturas, payload alterado, loja errada, persistência, concorrência e reentrega de eventos. A fixture não autentica cliente e não cria pedido real.

Para futuras simulações de entrega, o Resend oferece `delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev` e `suppressed@resend.dev`. Esses testes contam na quota; não usar endereços fictícios de pessoas. O teste real autorizado nesta sessão usou o destinatário identificado abaixo. [Emails de teste](https://resend.com/docs/dashboard/emails/send-test-emails).

### Teste real autorizado — 14/10/2026, 16:51 BRT

O usuário autorizou **um** email de teste para `davi@perparte.com`. O transporte preparado enviou o modelo `boas-vindas` pela API Resend; o dashboard confirmou **DELIVERED**.

| Evidência | Valor confirmado |
|---|---|
| ID Resend | `01a13bf8-8724-737d-b831-4c521eae03cc` |
| Modelo | `boas-vindas` |
| Destinatário | `davi@perparte.com` |
| Remetente | `sistema@emails.perparte.com` |
| Reply-To | `davi@perparte.com` |
| CTA | `https://shopify.com/102503383338/account` |
| Data/hora | 14/10/2026, 16:51 BRT |
| Resultado do provedor | `DELIVERED` |
| Habilitação | Somente o processo de teste; `.env.local` permanece com `RESEND_ENABLED=false` |

Captura: [teste entregue no Resend](capturas-emails/04-teste-entregue.png). O status comprova entrega reportada pelo provedor; não comprova leitura humana, pasta de destino nem aparência no cliente de email. A revisão visual na caixa de entrada permanece pendente. As prévias em `docs/emails` continuam simulações locais; não representam o registro desse envio.

| Marco | Evidência necessária | Estado neste relatório |
|---|---|---|
| Pesquisa e contrato | Limites/fontes/roteiro neste arquivo | PREPARADO |
| Templates locais | Renderer, HTML/texto e galeria | PREPARADO; três modelos, sem gatilhos |
| Serviço configurado | Domínio Verified, região, DNS e envio habilitado | CONFIRMADO; recebimento desabilitado |
| Credencial de envio | Permissão, cópia e arquivo ignorado verificados | CONFIRMADO; seis variáveis locais, chave somente de envio, envio persistente desativado |
| Transporte/CLI | Configuração explícita e testes simulados | PREPARADO; 46/46 testes totais, incluindo 13 de email; check/build aprovados |
| Templates remotos | IDs, versões e status relidos | Não ativados; renderer local não depende deles |
| Integração Shopify | App, plano, escopos e assinatura verificados | PENDENTE |
| Automação confiável | Endpoint de eventos, fila/dedupe duráveis e testes | PENDENTE; site publicado, mas nenhum gatilho ou endpoint de envio foi ativado |
| Envio real de teste | Autorização, destinatário e entrega | CONCLUÍDO: um boas-vindas para Davi, `DELIVERED` |
| Aparência na caixa de entrada | Revisão no cliente de email do destinatário | PENDENTE; prévia móvel local de 390 px sem overflow |

O teste entregue não ativa email de login Shopify nem envio transacional automático. A publicação posterior do frontend foi validada separadamente, com 53/53 testes e `site:check` aprovados, GETs públicos e navegação de Loja/produto; ela mantém `RESEND_ENABLED=false`. OTP permanece na Shopify, os modelos remotos não foram ativados e nenhum webhook/gatilho automático foi conectado.
