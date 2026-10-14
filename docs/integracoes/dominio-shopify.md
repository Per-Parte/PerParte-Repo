# Domínio Per Parte e Shopify

**Data:** 14/10/2026. **Estado:** conexão aplicada e HTTPS validado; CNAME publicado, certificado TLS provisionado e domínio primário confirmado por releitura. A Shopify ainda mostra o estado geral “Propagando”; propagação global e checkout com produto real permanecem pendentes. **Escopo:** conectar o domínio comercial preservando o frontend próprio. Publicação do site e `git push` continuam adiados.

O usuário pediu atualizar o domínio Shopify para `perparte.com`. A configuração aplicada mantém `perparte.com` e `www.perparte.com` no frontend externo e conecta `checkout.perparte.com` à Online Store/checkout hospedado pela Shopify. O domínio de contas não foi alterado; um subdomínio próprio continua sendo proposta a confirmar no admin.

## Diagnóstico observado

Resultados de DNS e Shopify consultados pela sessão principal e comunicados a este registro em 14/10/2026. São uma fotografia da consulta, não uma garantia de configuração futura.

| Item | Resultado observado | Consequência nesta etapa |
|---|---|---|
| `perparte.com` — A | `216.198.79.1` | Preservado e reconfirmado após a alteração |
| `www.perparte.com` — CNAME | `ef9d90000741766f.vercel-dns-017.com` | Vínculo à Vercel preservado e reconfirmado |
| NS | `ns51.domaincontrol.com` e `ns52.domaincontrol.com` | Acesso autenticado à GoDaddy recuperado; consulta direta ao primeiro NS confirmou o novo CNAME |
| MX | `perparte-com.mail.protection.outlook.com` | Roteamento de email preservado e reconfirmado |
| `checkout.perparte.com` — CNAME | `shops.myshopify.com`, TTL `3600` | Salvo na GoDaddy e confirmado no DNS autoritativo; antes retornava `NXDOMAIN` |
| `conta.perparte.com` | `NXDOMAIN` | Subdomínio ainda não criado |
| Domínio adicionado à Shopify | `checkout.perparte.com`, ID `180236386602` | DNS correto e certificado TLS provisionado; estado geral ainda “Propagando” |
| Primário da Shopify | `checkout.perparte.com` | Destino “Loja virtual” e tipo “Domínio primário” confirmados após recarregar o admin |
| Conta hospedada existente | `https://shopify.com/102503383338/account` | URL atual a manter até validar outra |

**Evolução dos acessos:** a interface administrativa no Chrome inicialmente falhou por timeout, e o navegador integrado alternativo exigiu login. O acesso foi retomado e a sessão principal adicionou o subdomínio na Shopify, depois salvou o CNAME na GoDaddy. O painel DNS passou de 19 para 20 registros; a consulta `Resolve-DnsName` diretamente ao NS `ns51.domaincontrol.com` confirmou o CNAME. Apex, `www` e MX não foram substituídos.

**Confirmação final desta etapa:** após recarregar o admin, a sessão principal confirmou destino “Loja virtual”, tipo “Domínio primário” e certificado TLS provisionado para conexões seguras. O domínio já apareceu como primário na releitura; este registro não atribui essa mudança a um clique separado de salvar/alterar primário. A fase anterior de “Provisionando TLS” foi superada.

**Limite da confirmação:** o estado geral continuou “Propagando”, e a contagem regional variou de quatro para zero após recarregar. Essa contagem não foi usada para declarar propagação global concluída. O acesso a `https://checkout.perparte.com` funcionou por HTTPS sem aviso de certificado e redirecionou a `/password`, exibindo “Opening soon” e “Per Parte”. Isso valida acesso seguro ao domínio e a página hospedada atual; não valida carrinho, pagamento ou checkout com produto real.

Capturas da sessão principal: [CNAME salvo na GoDaddy](capturas-dominio/01-dns-checkout.png), [DNS reconhecido/TLS ainda em provisionamento](capturas-dominio/02-shopify-dns-tls.png), [primário e TLS confirmados](capturas-dominio/03-shopify-dominio-primario-tls.png) e [HTTPS validado](capturas-dominio/04-https-validado.png).

O apontamento existente para a Vercel não comprova que a versão atual de `apps/site` esteja publicada. O adaptador foi preparado localmente; projeto vinculado, runtime remoto e deploy desta versão permanecem pendentes. Ver [hospedagem do site](../../apps/site/HOSPEDAGEM.md).

## Arquitetura aplicada e limites

| Endereço | Destino | Estado |
|---|---|---|
| `perparte.com` e `www.perparte.com` | Frontend próprio na hospedagem externa | Preservar DNS atual; publicação desta versão adiada |
| `checkout.perparte.com` | Online Store/checkout Shopify | CNAME, primário e TLS confirmados; HTTPS validado; propagação global e checkout real pendentes |
| Subdomínio de conta | Customer Accounts Shopify | EM ABERTO: confirmar endereço aceito no admin |
| `cpegt6-2x.myshopify.com` | Endpoint técnico da Storefront API | Preservado |

A Shopify documenta o uso de um subdomínio para sua loja quando a raiz hospeda outro website. O subdomínio usa CNAME e dispensa A/AAAA, inclusive se for o primário da loja. [Conexão de subdomínio de terceiros](https://help.shopify.com/en/manual/domains/add-a-domain/connecting-domains/connect-subdomain).

O guia de migração headless também distingue o domínio do frontend do subdomínio do checkout e determina que, fora do Oxygen, somente este último deve apontar à Shopify. Esse guia está marcado como **Legacy Hydrogen, versões até 2026-04**; suas etapas específicas de Hydrogen/Oxygen não são instruções de deploy para nosso site vanilla/Node. A configuração DNS é corroborada pela documentação atual de subdomínios. [Roteamento de tráfego headless](https://shopify.dev/docs/storefronts/headless/hydrogen/migrate/redirect-traffic).

## Roteiro de checkout e execução confirmada

As etapas de acesso, criação do CNAME e adição do domínio foram executadas, conforme as evidências acima. TLS, destino Online Store e tipo primário foram confirmados por releitura; HTTPS foi validado. O roteiro abaixo explica a configuração e sua retomada futura: não repetir a criação do registro nem alterar novamente o primário já confirmado. Permanecem pendentes a propagação global e a validação comercial da etapa 8.

1. Acessar o provedor que administra a zona autoritativa e conferir os registros atuais. Preservar apex, `www`, MX e demais registros existentes.
2. Adicionar `CNAME`, nome/host `checkout`, destino `shops.myshopify.com`. Não substituir o A de `perparte.com` nem o CNAME de `www`.
3. Na [loja Shopify](https://admin.shopify.com/store/cpegt6-2x), abrir **Configurações → Domínios → Conectar domínio existente**, informar `checkout.perparte.com` e seguir a verificação.
4. Se o admin pedir comprovação adicional, criar o TXT `shopify_verification_checkout` com o valor exato exibido em **New value** e TTL de uma hora ou equivalente. Não há valor de verificação conhecido neste registro. Retornar ao admin e selecionar **I updated DNS records**.
5. Aguardar o estado conectado e conferir a emissão do certificado TLS antes de divulgar o endereço. A conexão pode levar até 48 horas. [Conexão e verificação](https://help.shopify.com/en/manual/domains/add-a-domain/connecting-domains/connect-subdomain), [estado conectado](https://help.shopify.com/en/manual/domains/domain-type/change-primary-domain).
6. No domínio conectado, conferir **Target: Online Store** e **Type: Primary domain**; alterar apenas se não corresponderem ao desenho desejado. Nesta execução, ambos já estavam corretos na releitura. Esse primário é o destino Shopify do checkout, não a hospedagem do frontend. [Configuração do checkout headless](https://shopify.dev/docs/storefronts/headless/hydrogen/migrate/redirect-traffic).
7. Conferir o primário salvo no admin e abrir o endereço por HTTPS. Outros domínios associados à Online Store podem redirecionar ao novo primário; revisar esse comportamento antes de considerar a conexão concluída. [Efeito do domínio principal](https://help.shopify.com/en/manual/domains/domain-type/change-primary-domain).
8. Quando houver produto real aprovado, criar um carrinho com variante real e conferir o destino de `checkoutUrl`, a volta ao site e o formulário hospedado. Essa validação ainda não é possível com o catálogo comercial vazio; não cadastrar produtos fictícios para aparentar conclusão.

## Roteiro pendente: conta

A URL hospedada atual permanece válida como configuração do projeto. Para um domínio próprio, abrir **Configurações → Contas de cliente → Alterar domínio** e conferir a URL prevista antes de salvar. A documentação associa a base da conta ao domínio principal da Online Store; portanto, `conta.perparte.com` é uma proposta, não um endereço garantido quando `checkout.perparte.com` for o primário.

Após confirmar o endereço aceito: criar o subdomínio pelo fluxo de contas, adicionar o CNAME solicitado para `shops.myshopify.com`, verificar a conexão e abrir **Configurações → Domínios → Customer Account → Type → Primary domain**. Validar o formulário de entrada e a navegação antes de atualizar a URL usada pelo site. A propagação/verificação pode levar até 48 horas. [Conectar domínio de contas](https://help.shopify.com/en/manual/customers/customer-accounts/customize-customer-accounts/connect-domain-customer-account).

Uma conta em domínio próprio continua hospedada pela Shopify. A mudança de endereço não cria sessão no configurador nem sincroniza criações locais.

## Configuração do projeto

- **Preservar** `SHOPIFY_STORE_DOMAIN=cpegt6-2x.myshopify.com`. O servidor valida esse formato e usa o domínio técnico na API. Trocar a variável para `perparte.com` interromperia a configuração atual.
- **Preservar** o uso de `cart.checkoutUrl` retornado pela Shopify. Não substituir o hostname da URL manualmente.
- **Atualizar futuramente** `SHOPIFY_CUSTOMER_ACCOUNT_URL` somente após confirmar a conta em seu novo endereço HTTPS. Até lá, manter a URL hospedada atual.
- **Definir na publicação futura** `SITE_ORIGINS` com as origens HTTPS exatas autorizadas do frontend. Configurar domínio Shopify não publica o site nem autoriza deploy.

Referências locais: [configuração de ambiente](../../apps/site/.env.example), [integração do servidor](../../apps/site/shopify-servidor.mjs), [pesquisa Shopify](../pesquisa/shopify.md).

## O que não executar para este desenho

O tutorial genérico de conexão da raiz manda substituir o A/AAAA do apex e o CNAME de `www` por destinos Shopify. **Inferência de roteamento:** aplicar essas mudanças em `perparte.com` desviaria o tráfego do frontend externo para a Online Store Shopify. Esse não é o roteiro proposto aqui. Também não há necessidade identificada de transferir domínio, trocar nameservers ou alterar email. [Conexão manual da raiz](https://help.shopify.com/en/manual/domains/add-a-domain/connecting-domains/connect-domain-manual/).

## Critérios de conclusão

- [x] Acesso autenticado ao DNS e ao admin recuperado.
- [x] CNAME `checkout` publicado, com apex/`www`/MX preservados.
- [x] Subdomínio adicionado à Shopify e registros DNS reconhecidos pelo admin.
- [x] Shopify informa certificado TLS provisionado; acesso HTTPS validado sem aviso de certificado.
- [x] Destino Online Store e primário confirmados por releitura.
- [ ] Propagação global concluída; estado geral ainda “Propagando”.
- [ ] Endereço de contas escolhido e validado, se houver mudança.
- [ ] `checkoutUrl` e retorno ao frontend verificados com primeiro produto real aprovado.
- [ ] Publicação do frontend tratada separadamente, somente após orientação do usuário.

Este registro confirma a conexão aplicada e o acesso HTTPS, preservando o domínio técnico da API e a conta hospedada existente. Não declara propagação global, compra validada ou publicação da versão atual do frontend. A próxima verificação deve acompanhar o estado de propagação e, quando houver produto real aprovado, validar o percurso de checkout.
