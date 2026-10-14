# Per Parte — visão do projeto

**Fonte primária:** Revista de Marca, edição 01, 12/10/2026, em `docs/fonte/Per-Parte-Revista-de-Marca.pdf`. Esta síntese é operacional; em caso de conflito, consulte o PDF. **Última atualização:** 14/10/2026.

## O que é

A Per Parte vende autoria por meio de luminárias de mesa impressas em 3D sob demanda. A pessoa cria sua obra parte por parte no configurador, a Per Parte fabrica depois e entrega com certificado de autoria. Visão: **“A era do criar.”** Assinatura: **“Criado por você, feito por partes.”** (pp. 4–6, 10–11, 28).

O diferencial diante da Gantri é quem cria: na Gantri, o designer cria e a pessoa escolhe; na Per Parte, a criação da obra é da pessoa que vai viver com ela. Criadores independentes poderão publicar partes e receber royalties no marketplace futuro. A marca é premium acessível, vibrante e lúdica com rigor, com acabamento industrial preciso (pp. 13–15).

## Público

1. **Decorador(a) criativo(a), 20–30 anos**: quer uma peça única sem aprender modelagem 3D. Persona prioritária; nome e profissão ainda em aberto.
2. **Criador(a) independente**: quer publicar partes, ter vitrine e ganhar royalties.
3. **Presenteador(a) afetivo(a)**: quer criar uma peça com significado para outra pessoa (pp. 16–18).

## Produto e experiência

Escopo inicial: luminária de mesa. Modos **Montar** (encaixar partes prontas) e **Inventar** (dar forma a partir de bases). A experiência deve levar um novato a criar algo bonito na primeira visita, com controles que respeitem a fabricação e com prévia equivalente ao arquivo de produção. O preço acompanha escolhas, mas valores finais dependem do custo real (pp. 8, 50–52).

## Marca

A constante visual é a **Luz Acesa** `#F6E7C4`; Brasa `#A90000` é a assinatura do lançamento. Cores entram por famílias. O símbolo é um “p” em duas partes; o desenho final do wordmark e a tipografia seguem provisórios. Fotografia tem território de campanha saturado e loja bege clean, ambos com a obra acesa (pp. 30–46). Ver `docs/design-system.md`.

## Limites desta etapa

O monorepo separa `apps/site`, `apps/configurador`, `apps/quadro` e `packages/design-system`. O site reúne landing editorial e rotas de Loja, produto, conta e carrinho, com HTML/CSS/JavaScript ESM e servidor Node na porta 4174. Por pedido de 14/10/2026, **Shopify é o backend comercial DECIDIDO** para catálogo, variantes, carrinho e checkout (ADR 0005); Headless e coleção estão configurados, com token público no ambiente local e smoke real sem escrita aprovado. A implementação vanilla/Node continua **PROVISÓRIA** e reversível.

`checkout.perparte.com` está configurado como domínio primário Shopify, com CNAME e HTTPS validados em 14/10/2026; propagação global e compra real permanecem pendentes. `perparte.com`/`www` mantêm seus apontamentos Vercel. Conta hospedada e domínio técnico da API foram preservados. Essa configuração não publica a versão local do site; detalhes em `docs/integracoes/dominio-shopify.md`.

O pedido posterior de 14/10/2026 autoriza atualizar `main` e publicar o site em produção na Vercel. O acesso à conta correta foi concluído e confirmou o projeto `per-parte-website`, da equipe `per-parte1` (PerParte), já associado a `perparte.com`/`www`. A configuração remota deve passar a usar a raiz do repositório para incluir a API; publicação desta versão e validação pública permanecem pendentes. `SITE_ORIGINS` é obrigatório em produção. A autorização não ativa envios Resend nem inclui publicação do configurador; instruções em `apps/site/HOSPEDAGEM.md`.

O configurador permanece um protótipo local de criação em HTML/CSS/JavaScript ESM, com desenho paramétrico SVG, persistência no navegador e servidor Node na porta 4175. Sua sincronização, orçamento e integração com produção/conta comercial seguem em aberto. O quadro reúne documentos e notas locais, sem sincronização entre pessoas, e não substitui a revista nem os documentos oficiais.

### Landing em revisão

A página usa a estrutura editorial e os comportamentos observados na Gantri por capturas da extensão do Chrome, adaptados à identidade Per Parte: fotografia ampla, navegação sobre o destaque, títulos com respiro, botões arredondados, coleção, ambientes, processo e manifesto. Cores e tipografia vêm do design system compartilhado; a tipografia continua **PROVISÓRIA**.

As três luminárias são **Marco**, cujo nome e composição-base aparecem na revista, e **Duna** e **Farol**, nomes e desenhos em **PROPOSTA**. Todas as imagens geradas são estudos conceituais; não comprovam fabricação nem homologação. A direção editorial e a origem das afirmações ficam em `docs/site-direcao-conteudo.md`.

Slideshow, seleção de ambientes, acordeão e favoritos preservam a exploração editorial local. O pedido comercial acrescenta navegação das luminárias para `/produtos/:handle`, catálogo em `/loja`, `/carrinho` e acesso em `/conta`. Variantes comerciais, preços e disponibilidade devem vir da Shopify; os estudos conceituais não podem ser comprados. A geração de imagens faz parte da criação dos assets do protótipo; não adiciona IA ao produto. A publicação foi inicialmente adiada pelo usuário (“Publicamos depois”); o pedido posterior de 14/10/2026 autoriza `main` e produção Vercel, ainda sem conclusão registrada.

O recomeço está em `.claude/adr/0001-reinicio-e-fonte-mestre.md`, o quadro em `.claude/adr/0002-quadro-local.md` e a escolha reversível original do site em `.claude/adr/0003-site-visual-estatico.md`. O backend comercial amplia essa etapa em `.claude/adr/0005-shopify-backend-comercial.md`. A pesquisa Gantri informa a composição, sem substituir as decisões da revista.

### Comércio preparado e conta hospedada

O servidor possui operações fechadas para catálogo, detalhe e carrinho Storefront, mantendo credenciais fora dos arquivos públicos. A Loja lê o catálogo em runtime; facetas dependem de coleção publicada e configuração no Search & Discovery. A escolha de cor corresponde à variante comercial, com imagem, preço e disponibilidade associados. Os estudos permanecem sem preço e sem compra.

A consulta administrativa confirmou loja sem produtos, novas contas ativas e onze definições `perparte` públicas para conteúdo e filtros. Headless foi instalado, a vitrine “Per Parte — Site” criada e a coleção automática “Todas” (`todas`) publicada somente nesse canal; token público está no ambiente local ignorado pelo Git. Search & Discovery foi instalado; filtros estão em configuração. Smoke real passou em nove operações, com HTTP 200/API `2026-10`; mutations foram apenas validadas com `@skip`, sem criar carrinho ou pedido. O portal de cliente está em `https://shopify.com/102503383338/account`; seu acesso não autentica o navegador no configurador nem sincroniza criações. Facetas e compra com produtos reais ainda dependem de validação. Ver `docs/pesquisa/shopify.md`, `.claude/fluxo-site.md` e o topo de `.claude/state.md` para evolução operacional.

### E-mails próprios da Per Parte

Por pedido de 14/10/2026, **Resend é o serviço DECIDIDO para e-mails próprios da Per Parte** (ADR 0006). O domínio `emails.perparte.com` está verificado na região São Paulo (`sa-east-1`); remetente `Per Parte <sistema@emails.perparte.com>` e respostas para `davi@perparte.com`. A chave somente de envio está no ambiente local ignorado e `RESEND_ENABLED=false` mantém o transporte desabilitado. A verificação do domínio não comprova entrega de mensagens.

Estão preparados modelos locais de boas-vindas, orçamento disponível e atualização de pedido, transporte interno Node e CLI que gera prévias por padrão. Treze testes específicos e a suíte geral de 46 testes passaram, com check/build aprovados. Um teste de boas-vindas autorizado para `davi@perparte.com` foi enviado pelo transporte e confirmado como **DELIVERED** no painel Resend; envio foi habilitado somente naquele processo. Não há rota pública de disparo, webhook ou gatilho automático ativo; o backend cloud, o vínculo entre evento e destinatário e a outbox persistente continuam **EM ABERTO**. Cliques, favoritos e rascunhos locais não comprovam cadastro, orçamento ou pedido recebido.

O código de acesso das novas contas continua sendo enviado pela Shopify. Resend não substitui a autenticação hospedada nem cria sessão no site/configurador. Boas-vindas não pode ser disparado cegamente por `customers/create`; é preciso definir o evento legítimo e evitar duplicar notificações Shopify. A entrega confirmada pelo provedor não comprova posição na caixa de entrada ou aparência nos clientes de e-mail; essa revisão e a ativação dos eventos permanecem pendentes. Ver `docs/integracoes/emails-transacionais.md`, `docs/emails/README.md` e `.claude/adr/0006-resend-emails-transacionais.md`.

### Configurador local

O pedido de 14/10/2026 autorizou a interface de ponta a ponta em `apps/configurador`, com login explicitamente adiado. A pessoa entra em um painel inicialmente vazio, escolhe Marco, Duna, Farol ou uma composição livre e trabalha em três etapas: Formas, Cores e Concluir. Base, corpo e difusor têm forma, variação, largura, altura e cor independentes. A prévia permite giro por arrasto e alteração por cotas; miniaturas reutilizam o modelo salvo.

O renderizador é autoral, inspirado na pesquisa de fonte do Hairline, sem dependência desse pacote. Mantém o desenho fino na rotação e oferece visualização colorida. O vidro discreto dos blocos segue o pedido desta sessão; não modifica os tokens nem implica acabamento físico brilhante. Os presets continuam estudos; Duna/Farol permanecem propostas.

Salvar retorna ao painel, permite reabrir a obra e marca a composição mais recentemente criada como Nova, inclusive após recarregar; editar uma obra antiga não transfere essa tag. A seleção de obras gera rascunhos locais de pedido, com cópias independentes e download JSON. Nada é enviado à Per Parte. Login, conta, sincronização, orçamento, pagamento e fabricação ficam fora desta entrega.

O armazenamento é `localStorage` versionado, com validação e proteção contra sobrescrita de dados ilegíveis. As dimensões têm faixas exploratórias PROVISÓRIAS; não comprovam segurança elétrica, estabilidade ou fabricação. Não há mesh/arquivo STL, e a equivalência entre prévia e produção ainda exige um contrato industrial. Ver `.claude/fluxo-configurador.md`, `.claude/adr/0004-configurador-local-svg.md` e `docs/pesquisa/hairline.md`.
