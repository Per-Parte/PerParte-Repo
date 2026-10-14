# ADR 0006 — Resend para e-mails próprios da Per Parte

- **Data:** 14/10/2026.
- **Estado:** **DECIDIDO** para o serviço de envio, por pedido do usuário.
- **Implementação:** modelos locais, transporte Node e CLI **PREPARADOS**; um teste real autorizado confirmado como DELIVERED, sem gatilhos automáticos ativos. A organização técnica permanece **PROVISÓRIA**.
- **Relação com ADRs anteriores:** complementa o comércio Shopify do ADR 0005; preserva as novas contas hospedadas e o configurador local do ADR 0004.

## Contexto

O usuário pediu e-mails próprios da Per Parte com Resend. O site usa Shopify para catálogo, variantes, carrinho e checkout. O acesso de cliente é um link para a conta hospedada, sem sessão autenticada no nosso servidor. O configurador salva criações e rascunhos no navegador; ainda não envia obras, emite orçamento real ou confirma produção.

Essa separação impede tratar a abertura da conta, o salvamento local ou o clique no checkout como evento suficiente para enviar uma mensagem transacional. Um perfil Shopify também pode ser criado por caminhos diferentes de um cadastro intencional no site; `customers/create` sozinho não define um gatilho de boas-vindas.

## Decisão

Usar Resend como transporte de mensagens próprias, com domínio `emails.perparte.com`, região São Paulo (`sa-east-1`), remetente `Per Parte <sistema@emails.perparte.com>` e `Reply-To: davi@perparte.com`. Preservar recebimento corporativo, domínio de checkout e DNS do frontend.

Manter na Shopify o código de acesso das novas contas. Não criar OTP paralelo, recuperação de senha própria ou mensagem que afirme controlar essa autenticação. A personalização de notificações nativas Shopify e a escolha de mensagens adicionais são trabalhos distintos; uma mensagem própria não presume que a notificação equivalente da Shopify foi desativada.

Preparar três modelos HTML/texto com identidade Per Parte: `boas-vindas`, `orcamento-disponivel` e `atualizacao-pedido`. O renderer recebe somente os dados necessários, escapa conteúdo e limita links às origens HTTPS configuradas. Não inventa preço, prazo ou estado comercial. Orçamento e atualização exigirão recurso real e vínculo com destinatário antes de qualquer automação.

O transporte fica em código interno Node e usa a API HTTPS Resend com chave somente de envio no ambiente ignorado. Não criar rota pública que aceite destinatário, assunto ou HTML arbitrários. A CLI gera prévias por padrão em `.local/emails`; envio exige `--enviar`, `RESEND_ENABLED=true`, configuração completa e identificador opaco estável de evento. Logs não incluem chave, destinatário ou conteúdo pessoal.

Cada chamada faz uma tentativa com timeout. A chave de idempotência deriva do tipo e do hash do evento; repetir exige manter evento, payload e configuração. A janela de 24 h do Resend não substitui histórico/outbox persistente. Não usar `Map` de processo ou arquivo temporário como garantia de deduplicação entre instâncias.

## Estado comprovado nesta etapa

- Domínio `emails.perparte.com` **VERIFICADO** no Resend, com envio disponível no provedor e recebimento desabilitado. Evidência: `docs/integracoes/capturas-emails/01-resend-dominio-verificado.png`.
- Chave somente de envio copiada para o ambiente local ignorado, mantendo `RESEND_ENABLED=false`. `.env.local`, `.mcp.json` e prévias privadas ignorados pelo Git; também devem permanecer fora de uploads. Nenhum valor de credencial registrado neste ADR.
- Renderer, três prévias fictícias, transporte e CLI preparados. Treze testes simulados aprovados, com validação, injeção, idempotência, timeout durante conexão/leitura, erros e ausência de rota pública de envio.
- Suíte geral com 46 testes, check/build e prévia móvel de 390 px aprovados.
- Um teste de boas-vindas para `davi@perparte.com`, autorizado pelo usuário, foi enviado pelo nosso transporte e confirmado como **DELIVERED** no painel Resend. ID `01a13bf8-8724-737d-b831-4c521eae03cc`; remetente `Per Parte <sistema@emails.perparte.com>`, Reply-To `davi@perparte.com` e URL de conta correta. `RESEND_ENABLED=true` foi aplicado apenas ao processo desse teste; o ambiente persistente continua `false`.
- Nenhum webhook ou gatilho automático ativado. Nenhum deploy ou push realizado.

Verificação do domínio, aceitação da API, confirmação DELIVERED, aparência no navegador e posição na caixa de entrada são evidências diferentes. O teste comprova a entrega reportada pelo provedor; a inspeção da mensagem na inbox e a compatibilidade visual em clientes de e-mail reais continuam pendentes.

## Consequências e pendências

**EM ABERTO:** definir os eventos legítimos, backend cloud/sessão quando necessários e vínculo entre recurso e destinatário; escolher armazenamento/fila e implementar outbox/histórico duráveis, reentrega, reconciliação de resultados desconhecidos e supressões. A escolha do Resend não resolve essas dependências nem sincroniza o configurador.

Webhooks são uma integração futura, condicionada aos eventos escolhidos, app/plano/escopos e acesso real aos dados necessários. Validar assinatura sobre corpo bruto antes de processar, verificar loja/tópico, deduplicar persistentemente e confirmar persistência antes de responder. Eventos de entrega/falha Resend também exigem assinatura e tratamento de repetição. Não expor endpoints antes de ter infraestrutura e contrato correspondentes.

Inspecionar o teste entregue na caixa real de Davi e validar autenticação recebida, links, Reply-To, posição na inbox e apresentação nos clientes de e-mail disponíveis. Revisar duplicidade com notificações Shopify antes de habilitar uma mensagem automática. Publicação e push continuam adiados; configurar o provedor não publica o site.

## Referências

- `docs/integracoes/emails-transacionais.md`: pesquisa oficial, configuração observada, comandos e limites.
- `docs/emails/README.md`: contrato dos modelos e galeria de exemplos fictícios.
- `.claude/roadmap.md`: tarefas EML-01 a EML-09 e critérios de ativação.
- [Envio Resend](https://resend.com/docs/api-reference/emails/send-email) e [idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys).
- [Personalização das novas contas Shopify](https://help.shopify.com/en/manual/customers/customer-accounts/upgrade/customization-options) e [verificação de webhooks](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries).
