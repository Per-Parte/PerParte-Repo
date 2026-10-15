# Fluxo: site

**Estado:** site editorial e comércio Shopify em `apps/site`; Headless/token e coleção configurados, smoke real sem escrita aprovado e catálogo comercial vazio. Search & Discovery instalado; filtros em configuração. Resend configurado para e-mails próprios, com código preparado e envio local desabilitado. **Atualização:** 14/10/2026. **Decisões:** ADR 0003 (origem estática), ADR 0005 (Shopify) e ADR 0006 (Resend).

**Publicado em 14/10/2026:** `main` enviada até `fcd24a1`, deploy READY em `https://perparte.com`, projeto `per-parte-website`, equipe `per-parte1` (PerParte). A configuração remota usa raiz do repositório, Node 24.x, build `npm run site:build` e saída `apps/site/dist`; 12 variáveis Production foram cadastradas. A captura `rota` repassada pela Vercel foi tratada no adaptador, preservando a validação da API; 53/53 testes e `site:check` passaram. `SITE_ORIGINS` é obrigatório em produção. Configurador continua local e os e-mails ficam sem gatilhos, com `RESEND_ENABLED=false`. Roteiro em `apps/site/HOSPEDAGEM.md`; evidências em `docs/integracoes/publicacao-vercel.md`.

**Aceite público desta rodada:** páginas principais e API de leitura retornaram 200, com catálogo Shopify vazio; caminhos privados testados retornaram 404. A Loja mostrou três estudos e o filtro Brasa abriu Duna, com história/galeria/especificações/escala renderizadas, compra desabilitada e console sem erros registrados. Nenhum POST foi executado em produção, pois a revisão automática de aprovação bloqueou o smoke de carrinho. Mutations locais simuladas não comprovam carrinho ou checkout real.

## Comércio Shopify — estado atual

Shopify é o backend comercial **DECIDIDO** pelo pedido de 14/10/2026. HTML/CSS/JavaScript ESM e Node nativo permanecem **PROVISÓRIOS**. O servidor oferece API Storefront `2026-10` com operações fechadas; tokens são carregados do ambiente e não entram no frontend. A publicação precisa de runtime Node ou equivalente, além dos assets de `dist`.

| Percurso | Comportamento preparado | Dependência/limite |
|---|---|---|
| Landing → produto | Luminárias abrem `/produtos/:handle` | Estudos continuam conceituais e sem compra |
| `/loja` | Catálogo remoto, facetas, busca, ordenação, filtros na URL e carregar mais | Coleção real publicada, token e Search & Discovery configurados |
| `/produtos/:handle` | Galeria/zoom, opções, cor de criador, especificações e adicionar à sacola | Imagem/preço/disponibilidade dependem da variante; combinação inexistente não pode comprar |
| `/carrinho` | Consultar, alterar quantidade, remover, subtotal e destino do checkout | ID de variante e `checkoutUrl` devolvidos pela Shopify; sem confirmação local de pagamento |
| `/conta` | “Entrar ou criar conta” abre portal hospedado Shopify | Não estabelece sessão local nem sincroniza o configurador |

Na consulta administrativa, a loja estava sem produtos e com novas contas ativas em `https://shopify.com/102503383338/account`. Foram criadas onze definições de produto `perparte` com acesso Storefront público: dimensões, materiais, cuidados, especificações, prazo, brilho, difusão, tamanho, ambiente, criador e cores de criador. Headless foi instalado, a vitrine “Per Parte — Site” criada e token público guardado no ambiente local ignorado. A coleção automática “Todas” (`todas`) foi publicada somente no Headless, com condições OR preço maior que zero ou igual a zero. Search & Discovery foi instalado; filtros estão em configuração. O smoke real confirmou nove operações HTTP 200/API `2026-10`, sem escrita. Isso comprova acesso/schema, não compra ou variantes reais. Evidências e orientações em `docs/pesquisa/shopify.md`; resultados posteriores no topo de `.claude/state.md`.

O catálogo é consultado em runtime. Novos produtos aprovados devem aparecer após cadastrar e publicar produto/variantes no canal/contexto correto, sem duplicar dados no código. Por autorização do usuário em 14/10/2026, enquanto o catálogo Shopify estiver vazio, a grade principal de `/loja` usa Marco, Duna e Farol como prévia explícita, com filtros locais de categoria/cor, busca, ordenação por nome e links para suas páginas. Não há preço nem compra para esses estudos. Consultas filtradas sem resultado só usam a prévia após confirmar que o catálogo sem filtros também está vazio; um filtro sem correspondência em catálogo real continua vazio. Credencial ausente mantém demonstração sem compra; uma falha real da API mostra erro. A entrada de produtos publicados substitui a prévia automaticamente na consulta seguinte.

Facetas usam valores devolvidos pela Shopify e mantêm filtros/ordem/cursor coerentes. A busca é global, com relevância/preço, enquanto a navegação da coleção oferece ordenação própria. Não filtrar somente a primeira página no cliente. O handle da coleção é configurável; o exemplo de ambiente usa `todas`, não uma suposição sobre `/collections/all` do tema.

Cor é uma opção de variante. Ao selecionar, resolver a combinação completa, atualizar imagem, preço, disponibilidade e URL. A paleta global mostra essa cor nos cards compatíveis sem filtrar a quantidade: `visualizarCor` não é enviado como faceta à Shopify. Ela preserva tamanho/acabamento e atualiza imagem/preço/link apenas quando existe a combinação. O filtro Cor da barra consulta o catálogo separadamente. `cores_criador` é curadoria editorial sobre cores existentes, não gerador de variantes. Não inferir filamentos ou fabricar imagens/estoque a partir de HEX. Na página de produto, o rodapé usa a cor da `varianteAtual` resolvida (nunca a intenção de clique); quando há swatch de cor, ele aplica esse mesmo valor no fundo e escolhe entre Tinta e Luz Acesa pela maior razão de contraste. Sem cor/swatch ou fora da página de produto, volta ao token Luz Acesa.

### Revisão visual de Loja e produto — 14/10/2026

`navegacao.js`/`navegacao.css` são compartilhados pela landing e pelas rotas comerciais: mesmos menus, categorias, ícones, navegação móvel e fechamento por Escape. A Loja usa também o mesmo `paleta.js`/`paleta.css` da homepage. Ao remontar a grade, a paleta anterior desconecta observadores e eventos; restaurar cores devolve a fotografia inicial e o hover editorial.

A Loja oferece atalhos Todas, De mesa, De piso, De parede e Pendentes. Os filtros/atalhos recebem vidro discreto sem sombra, conforme pedido do usuário. Cada card apresenta nome e indicador multicolorido na primeira linha; preço e tamanho na segunda. Para os estudos, o texto permanece “Em estudo, dimensões em definição”. O pequeno menu de cores fica contido na tela móvel.

No produto, a paleta tem sete colunas, amostras retangulares, ponto branco na cor selecionada e pills de todas as cores/seleção do criador. A curadoria preserva as posições e a variante escolhida: cores fora da seleção encolhem para pontos de 8 px, ficam indisponíveis naquele modo e retornam ao restaurar todas as cores. A transição é de 300 ms e respeita movimento reduzido.

Após galeria e painel, aparecem história autoral, seções editoriais disponíveis e especificações com abas por teclado. Uma barra flutuante com vidro leva às seções existentes e repete preço/disponibilidade/ação de sacola da variante. A seção Tamanho mostra imagem de pessoa com luminária quando cadastrada. Nos estudos, as campanhas atuais são ilustrativas e não comprovam medidas reais. Nenhuma avaliação, certificação, medida ou condição comercial foi inventada.

Cinco definições editoriais adicionais foram criadas e relidas na Shopify, todas com acesso Storefront público: `historia_titulo`, `historia`, `ano_criacao`, `imagem_escala` (arquivo restrito a imagem) e `legenda_escala`, no namespace `perparte`. Total atual: 16 definições, preservando as 11 anteriores. O preenchimento é opcional; sem conteúdo real, o site não cria história, ano ou foto comercial por inferência. Pesquisa e QA: `docs/pesquisa/gantri-ajustes-2026-10-14.md` e `docs/pesquisa/shopify-qa.md`; prints em `docs/pesquisa/loja-ajustes-capturas/`.

O carrinho persiste somente ID/quantidade em registro local versionado `perparte.shopify.carrinho.v1`, com proteção contra sobrescrever conteúdo inválido e ação explícita para reiniciar. Seu ID completo contém chave secreta; não registrar em logs. `checkoutUrl` leva ao checkout Shopify, onde condições finais são aplicadas. Os rascunhos e modelos do configurador não são enviados por esse fluxo.

## API e arquivos comerciais

| Rota de API | Operação |
|---|---|
| `GET /api/loja/config` | Modo, disponibilidade de catálogo/carrinho e URL pública da conta, sem tokens |
| `GET /api/produtos` | Lista/coleção/busca, facetas e paginação |
| `GET /api/produtos/:handle` | Detalhe e paginação de variantes |
| `GET /api/carrinho?id=...` | Recuperar carrinho pelo ID completo |
| `POST /api/carrinho` | Criar carrinho com linhas de variantes |
| `POST/PATCH/DELETE /api/carrinho/itens` | Adicionar/atualizar/remover linhas |

`shopify-servidor.mjs` concentra GraphQL, validação de entrada, origens, timeouts e erros. `comercio.html`, `comercio.css` e `comercio.js` implementam as páginas; `catalogo.js` adapta produtos/variantes e persistência local. `servidor.mjs` faz roteamento e serve somente a lista permitida de arquivos. `.env.example` documenta configuração; `.env.local` é ignorado pelo Git. Ver `apps/site/README.md` para os comandos e campos.

## E-mails próprios — fluxo preparado, sem gatilhos

Resend é o provedor **DECIDIDO** para mensagens próprias da Per Parte. O domínio `emails.perparte.com` está verificado na região `sa-east-1`; remetente `Per Parte <sistema@emails.perparte.com>`, Reply-To `davi@perparte.com`. A chave somente de envio está em `.env.local` ignorado e `RESEND_ENABLED=false`. Um teste real de boas-vindas autorizado para `davi@perparte.com` foi enviado pelo transporte e confirmado como DELIVERED no painel Resend; a habilitação foi temporária, somente no processo de teste. O ambiente persistente continua desligado.

`emails/modelos.mjs` recebe dados e produz assunto, HTML e texto simples. `emails/transporte.mjs` é interno ao servidor: valida destinatário único, campos, links e configuração, deriva chave de idempotência de evento opaco e faz uma tentativa HTTPS com timeout. `emails/enviar.mjs` é uma CLI para operador; não há endpoint público de disparo nem alteração nas rotas comerciais acima.

| Modelo preparado | Condição para um envio futuro | Estado atual |
|---|---|---|
| `boas-vindas` | Evento inequívoco e destinatário legítimo; criação de perfil Shopify isolada não comprova cadastro intencional no site | Modelo e prévia; nenhum gatilho `customers/create` |
| `orcamento-disponivel` | Orçamento real acessível, destinatário vinculado e link aprovado | Modelo e prévia; configurador ainda guarda apenas rascunhos locais |
| `atualizacao-pedido` | Atualização real confirmada pelo sistema responsável, sem duplicar notificação Shopify | Modelo e prévia; clique no checkout não comprova pedido/pagamento |

Na raiz, `npm run emails:gerar` atualiza as prévias fictícias e `npm run emails:preview` abre o servidor local da galeria na porta 4182. `npm run emails:enviar -- --tipo boas-vindas --para pessoa@example.test --evento previa-001 --dados .local/emails/dados.json` gera uma prévia privada em `.local/emails`, sem rede; o arquivo de dados deve existir. O modo real exige acrescentar `--enviar`, habilitar `RESEND_ENABLED=true` e preencher toda a configuração. Essas condições técnicas não provam que ocorreu um evento comercial. Não registrar destinatário, conteúdo ou credenciais nos logs.

Cada chamada faz uma tentativa. Repetições mantêm evento, dados e configuração; timeout pode deixar resultado desconhecido e exige conferir o provedor. A idempotência Resend dura 24 h; não há outbox/histórico durável, fila ou deduplicação entre instâncias. Backend cloud, eventos autenticados, vínculo com destinatário, webhooks assinados e validação visual de inbox permanecem **EM ABERTO**. Treze testes específicos e suíte geral de 46 passaram, com check/build e prévia móvel de 390 px aprovados. O teste real confirma entrega reportada pelo provedor, sem comprovar posição na caixa de entrada ou compatibilidade visual nos clientes de e-mail.

O código de acesso das novas contas permanece nativo da Shopify. Não implementar OTP paralelo nem disparar boas-vindas cegamente por `customers/create`. O portal hospedado não cria sessão local; salvar obra, favorita ou rascunho no navegador não dispara e-mail. Contrato e limites: `docs/integracoes/emails-transacionais.md`, `docs/emails/README.md` e ADR 0006. A publicação do site não ativou gatilhos ou envio de e-mails; Production mantém `RESEND_ENABLED=false`.

## Fonte e direção

Revista de Marca pp. 26–28 (voz/cópia), 44–47 (fotografia) e 57–59 (landing e navegação). A página 57 mostra a landing “Infinitas possibilidades”; a página 58 propõe alternância de saturado, papel e escuro e uma anatomia da página da obra. A publicação de cópia fundadora depende de aprovação dos sócios (p. 25).

O pedido desta etapa é apresentar três luminárias usando a composição editorial da Gantri com identidade Per Parte. As capturas feitas pela extensão do Chrome estão em `docs/pesquisa/gantri-capturas/`; a pesquisa fica em `docs/pesquisa/gantri.md`. A revisão posterior aprofundou menu, seletor de cores, rodapé e processo: evidências em `docs/pesquisa/gantri-revisao/`, análise em `docs/pesquisa/gantri-revisao.md` e acompanhamento em `docs/revisao-landing-2026-10-13.md`. O conteúdo e a procedência das afirmações estão em `docs/site-direcao-conteudo.md`. O benchmark orienta hierarquia, respiro, navegação e transições; os tokens da marca permanecem em `packages/design-system`.

## Executar e construir

- `npm run site`: inicia o site e sua API Node em `http://127.0.0.1:4174`.
- `npm run site:build`: prepara assets em `apps/site/dist`; a API comercial exige runtime separado dos arquivos estáticos.
- `npm run site:check`: verifica sintaxe JavaScript, IDs únicos, âncoras, arquivos de imagem referenciados e presença do modo de movimento reduzido. A interação e a composição exigem verificação no navegador.
- `npm run preview --workspace @perparte/site`: serve o build na mesma porta, após encerrar a instância de desenvolvimento.
- `npm run quadro`: mantém o quadro independente em `http://127.0.0.1:4173`.

Arquivos da landing: `index.html` para estrutura e conteúdo, `styles.css` para composição responsiva e movimento, `fonts.css` para fontes locais e `app.js` para interações editoriais. `servidor.mjs` atende prévia/API e `construir.mjs` prepara o build. Os assets ficam em `public/images/` e `public/fonts/`. Não há framework de aplicação nesta etapa.

## Percurso da página

1. Navegação sobre a fotografia, destaque com três cenas e título “Criado por você,” / “Feito por partes” em duas linhas, com entrada para a coleção; menu desktop escuro com vidro/desfoque.
2. Três fotografias em colunas imediatamente após o hero; princípios da marca e introdução editorial.
3. Ambientes com seleção de cenas.
4. Coleção de Marco, Duna e Farol e acesso ao detalhe de cada obra.
5. Processo em três momentos: no desktop, a rolagem escolhe o único painel aberto e sua imagem; versão móvel e movimento reduzido mantêm navegação manual.
6. Campanha, exploração por composição, ambientes de inspiração e seção Missão explícita.
7. Encerramento e rodapé com grupos de links acima do wordmark Per Parte em grande escala.
8. Seletor flutuante para visualizar cores de variantes compatíveis sem reduzir a grade; estudos continuam identificados e sem compra.

## Comportamentos editoriais

| Interação | Efeito esperado | Limite |
|---|---|---|
| Navegação e menus | Menu desktop escuro/translúcido com desfoque de 15 px no fundo; menu móvel, seções e rotas de Loja/conta/sacola. Setas em SVG próprio de 12 × 12 px, alinhadas ao texto e giradas 180° ao expandir. | Preservar seleção, estado expandido e redução de movimento; conta comercial não autentica o configurador. |
| Slideshow do destaque | Alternar cenas, selecionar uma cena e pausar a alternância. | Respeitar preferência por menos movimento. |
| Seleção de ambientes | Trocar a cena e o contexto apresentados. | Não é personalização do produto. |
| Processo por rolagem | Avançar entre os três passos mantendo somente o painel ativo aberto e sua imagem correspondente. Em móvel/movimento reduzido, manter seleção manual. | Imagens são estudos, não registro da fábrica; preferência reduzida ainda requer confirmação em runtime na revisão. |
| Detalhe da luminária | Navegar à página `/produtos/:handle`, com galeria, informações e opções quando houver catálogo. | Estudos sem preço/compra; dados comerciais exclusivamente Shopify. |
| Paleta flutuante | Componente compartilhado entre homepage e Loja; expandir cores cadastradas em sete colunas, selecionar cor/rótulo, restaurar e recolher por Escape ou controle de fechar. | Atualiza imagem/preço/link somente de variantes compatíveis; estudos não ganham cores ou disponibilidade inventadas. |
| Busca | Consultar catálogo Shopify; estudos locais aparecem na prévia sem produtos comerciais. | Não confirma disponibilidade de produto ainda não publicado. |
| Favoritos | Salvar e rever escolhas no mesmo navegador. | Sem conta ou sincronização. |
| Entrada de blocos | Revelar conteúdo ao rolar, com versão de movimento reduzido. | Conteúdo deve continuar acessível sem animação. |

As setas da navbar substituem os caracteres tipográficos por chevrons vetoriais próprios: `viewBox="0 0 12 12"`, caminho `M3 4.5 6 7.5 9 4.5`, traço de 1,5 px em `currentColor`, extremidades e junções arredondadas. A caixa fixa de 12 px mantém o alinhamento independente da fonte; a rotação acompanha o estado expandido do menu e respeita movimento reduzido.

## Produtos e imagens

Marco tem nome e composição-base descritos na revista. Duna e Farol são **PROPOSTAS** de nomes e desenhos; as três representações são conceituais. O conjunto tem 20 PNGs gerados: os dez anteriores preservados, três campanhas, quatro imagens de inspiração e três fundos coloridos de estúdio. As campanhas entram no hero, nas três fotografias seguintes, nos destaques dos menus e na Missão; a galeria tem oito cards. Os três produtos de catálogo permanecem como referência. A nota “Coleção em estudo · imagens conceituais” deve permanecer acessível. Ver `docs/site-imagens.md` para dimensões, referências e hashes.

O pedido posterior de mais cor foi aplicado a `#categorias`, “Qual é a sua luz?”, com `categoria-marco-violeta.png`, `categoria-duna-verde.png` e `categoria-farol-ambar.png`. O cenário muda para violeta/lavanda, verde e vinho/laranja/âmbar, respectivamente; desenho e cores dos produtos são preservados. Não são novas variantes ou filamentos. As três imagens não têm pessoas, e esta alteração preserva as campanhas com persona e a galeria de oito cards. Cada PNG mede 1122 × 1402 e corresponde por SHA-256 ao original registrado em `docs/imagens-prompts-fundos.json`.

A direção artística aprovada pelo usuário combina expressões individualizadas, roupas dramáticas/artísticas e cenários surrealistas coloridos. Em seguida, o usuário pediu alterar somente as personagens das três campanhas para se aproximarem da persona das pp. 16–18 da revista, preservando produto, cenário e câmera. Esse refinamento foi gerado e os arquivos finais tiveram dimensões e correspondência SHA-256 com os originais conferidas. O casting é uma proposta criativa; a fonte não impõe gênero, etnia ou aparência física. Direção e limites em `docs/direcao-artistica-imagens.md`; prompts literais em `docs/imagens-prompts-campanha.json` e `docs/imagens-prompts-inspiracoes.json`.

As fotografias recebem borda fina de 1 px e cantos arredondados. O cartão Marco em “Qual é a sua luz?” teve texto branco confirmado por estilo computado `rgb(255, 255, 255)`. A seção “Nossa missão” foi conferida com imagem de Farol e seu texto.

Use Luz Acesa, neutros e Brasa conforme `docs/design-system.md`. A landing usa Unbounded nos títulos e Figtree no texto; em 13/10/2026 o usuário decidiu substituir todos os rótulos DM Mono por Figtree Light 300. Essa escolha do site não redefine a tipografia final da marca nem o token técnico compartilhado. Não converter imagens geradas em prova de acabamento real, alegação ambiental ou especificação industrial. Não adicionar preços, avaliações, estoque, prazos ou garantias sem fonte validada.

## Verificação e pendências

**Comércio — rodada atual:** treze testes de backend e nove de catálogo passaram. Smoke real de nove operações passou com HTTP 200/API `2026-10`; mutations foram validadas com `@skip(if: true)`, sem criar carrinho/pedido. No navegador real, Marco abriu como estudo sem erro JavaScript e a conta abriu o formulário oficial Shopify, sem autenticação. Na fixture local, cor alterou imagem/preço/URL; combinação inexistente e esgotada bloquearam compra; carrinho, teclado, limite de quantidade, remoção, filtro Cor/limpeza e paleta foram exercitados. Móvel de 390 px sem overflow. Produtos publicados e checkout real ainda faltam. Search & Discovery está instalado, mas abriu iframe vazio; filtros personalizados seguem pendentes. Ver limites detalhados no topo de `.claude/state.md`.

### Histórico da landing de 13/10/2026

**Expressões editoriais e Farol (13/10/2026):** as cinco fotografias com pessoas em uso (três campanhas e duas inspirações) foram substituídas por versões com expressão séria de editorial de moda. Na campanha Farol, a mão antes apoiada no rosto agora repousa no pedestal, com antebraço conectado à manga; a outra mão permanece erguida. Os arquivos mantêm os mesmos caminhos públicos e dimensões 1536 × 1024. Prompts, originais e hashes atuais: `docs/imagens-prompts-expressoes.json`; direção: `docs/direcao-artistica-imagens.md`; manifesto: `docs/site-imagens.md`. Capturas desktop e móvel 25–27 em `docs/pesquisa/perparte-capturas/`.

**Fundos coloridos:** arquivos e hashes conferidos; QA dos três cards concluído no navegador integrado. Desktop 1280 × 720: três imagens carregadas, nomes brancos (`rgb(255, 255, 255)`), peças inteiras e sem overflow. Móvel 390 × 844: três cards em uma coluna, sem overflow, luminárias inteiras e título Farol separado da cúpula. Marco no desktop e Farol no móvel abriram o detalhe correto e fecharam por Escape; console sem erros. `npm run site:check` e `npm run site:build` passaram. Evidências: `21-categorias-fundos-desktop.jpg`, `22-categorias-fundos-mobile.jpg` e `23-categoria-farol-mobile.jpg`, em `docs/pesquisa/perparte-capturas/`.

A revisão artística foi conferida com as personagens finais: campanhas desktop em Chrome pela extensão (Duna/Farol, 1482 × 734) e navegador integrado (Marco, 1280 × 720); móvel integrado em 390 × 844, com rostos/luminárias inteiros, fundos corretos e sem overflow. A galeria mostrou oito cards e os quatro novos assets carregados, avanço por seta (`scrollLeft` 0 → 339) e link do trio para `#colecao`. Console integrado sem erros; `site:check`, `site:build` e `git diff --check` passaram. Capturas 13–20 e limites da verificação em `docs/revisao-landing-2026-10-13.md`.

Registrar em `.claude/state.md` os resultados reais de build, código, assets e navegação em desktop/mobile. Conferir todas as interações acima, acesso por teclado, ausência de overflow horizontal, legibilidade sobre imagens e redução de movimento. A documentação do fluxo não substitui a execução dessas verificações.

A revisão é local. Publicação e push foram adiados pelo usuário. O vídeo real de pessoa dançando com luminária foi explicitamente **ADIADO pelo usuário em 13/10/2026**: manter a fotografia atual e retomar somente quando solicitado. Não há gerador de vídeo conectado nem clipe produzido. Não declarar slideshow/zoom ou fotografia como entrega de vídeo; consultar `docs/pesquisa/video-campanha-disponibilidade.md`.

Verificação desktop da revisão confirmou processo por PageDown em janela com 678 px de altura (avanços de 518 px), sequência 0 → 1 → 2, somente painel ativo aberto e mudança de imagens; paleta com 25 botões, seleção Cobalto sem mudar imagens, recolhimento por Escape e ocultação durante modal. Em móvel real, 351 × 760 CSS px, menu abriu/navegou/fechou e a paleta expandiu a 272 px sem overflow. O foco entrou em Flor; ArrowRight passou a Cânion, Enter selecionou e Escape recolheu. Redução de movimento foi conferida no código, sem simular a preferência do sistema.

`npm run site:check` e `npm run site:build` finais passaram após a correção de foco; build repetido após o último ajuste CSS também passou. `git diff --check` passou e o console Chrome ficou sem erros. O enquadramento da cabeça na cena masculina do hero móvel foi conferido abaixo da navbar; o fundo Vinho `#670700` une a faixa superior. Evidências em `09-mobile-hero-homem.jpg` e `11-hero-homem-desktop.jpg`, junto das demais capturas locais. Esses resultados registram a revisão anterior da interface; a revisão artística posterior é acompanhada em `docs/revisao-landing-2026-10-13.md`. O vídeo real está adiado por decisão do usuário.

Permanecem em aberto coleção homologada, logo/tipografia finais, conteúdo aprovado, domínio/hospedagem, condições comerciais e integração industrial do configurador. Shopify está decidido para comércio e Headless/token/coleção estão configurados; catálogo real, facetas e validação comercial ainda dependem de conclusão. A conta hospedada está confirmada, enquanto OAuth/sessão própria e sincronização de criações continuam pendentes.
