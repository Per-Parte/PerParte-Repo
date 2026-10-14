# Imagens da landing Per Parte

Data: 13/10/2026. Estado: **PROPOSTA / imagens conceituais**. O acervo contém 17 imagens originais geradas com `image_gen` e copiadas para `apps/site/public/images/`: dez anteriores e sete novas. Não são fotos de produtos fabricados nem fotografias da Gantri. A direção editorial está em [site-direcao-conteudo.md](site-direcao-conteudo.md); a revisão artística aprovada pelo usuário está em [direcao-artistica-imagens.md](direcao-artistica-imagens.md).

**Refinamento concluído nos arquivos:** depois da primeira rodada, o usuário pediu ajustar somente as personagens das três campanhas à persona da revista, preservando produto e cenário. O manifesto abaixo já registra as edições finais. A primeira geração e os prompts correspondentes permanecem no histórico do JSON; as quatro inspirações foram preservadas.

## Manifesto de arquivos

Dimensões conferidas nos cabeçalhos PNG. A correspondência com os originais foi verificada por igualdade de SHA-256; não houve transformação de bytes na cópia.

| Arquivo público | Dimensões | Conteúdo e função | Original da sessão |
|---|---|---|---|
| `duna.png` | 1254 × 1254 | Catálogo: cúpula creme baixa/larga e base Brasa; referência visual de Duna | `exec-802299aa-17d4-4828-91df-7b1411375628.png` |
| `marco.png` | 1254 × 1254 | Catálogo: base oliva, três anéis âmbar e difusor areia; referência visual de Marco | `exec-36ca4b6e-2eac-4f36-81e0-e39493a22a1e.png` |
| `farol.png` | 1254 × 1254 | Catálogo: difusor vertical creme canelado e base Lago; referência visual de Farol | `exec-d208b075-140d-453e-89a7-6f94b3ebb0f4.png` |
| `hero-duna.png` | 1536 × 1024 | Campanha Brasa anterior, preservada no acervo; substituída no hero ativo | `exec-c3ba54f2-0e60-4563-a2da-25b02632b0e8.png` |
| `ambiente-duna.png` | 1536 × 1024 | Duna em sala acolhedora; ambientes e galeria | `exec-08b9f45a-22cf-4a1d-b5e1-5d85c2fd81c8.png` |
| `ambiente-farol.png` | 1536 × 1024 | Farol em escritório/espaço de criação; ambientes e galeria | `exec-fa99cb19-abf8-467b-8d58-1163f64c0707.png` |
| `detalhes-duna.png` | 1254 × 1254 | Macro do encontro Brasa/creme e das camadas; processo e galeria | `exec-939f48fb-6904-48fe-9938-e2a34cceb8db.png` |
| `manifesto.png` | 1536 × 1024 | Marco à direita sobre cenário vinho escuro; painel de manifesto | `exec-589ad93f-9cad-4467-9a80-8e9f75e47eb9.png` |
| `hero-marco-homem.png` | 1536 × 1024 | Campanha anterior no acervo: homem sentado, camisa de linho clara, Marco nas mãos e fundo vinho | `exec-5c3f1ea6-09ed-4287-a2c6-27477fc13ed2.png` |
| `hero-farol-mulher.png` | 1536 × 1024 | Campanha anterior no acervo: mulher em gesto de dança ao lado de Farol, cenário Lago; imagem estática | `exec-b8c5b9e1-a5e4-40e6-b0b7-74fbb81ab273.png` |
| `campanha-duna-jardim.png` | 1536 × 1024 | Campanha ativa Duna: mulher jovem de cabelo cacheado, roupa fúcsia volumosa, banco curvo Brasa, flores gigantes e fitas suspensas | `exec-0d6570b4-4949-48a0-bb0b-2b4d22e93f47.png` |
| `campanha-marco-orbita.png` | 1536 × 1024 | Campanha ativa Marco: homem jovem de cachos e óculos, alfaiataria listrada, cachecol âmbar, palco verde e três grandes anéis suspensos | `exec-2d8dd632-3553-4c8f-ad76-e9886c98ad2a.png` |
| `campanha-farol-cenario.png` | 1536 × 1024 | Campanha ativa Farol: mulher jovem de cabelo ruivo ondulado, blusa amarela escultural, calça azul com círculos creme, pedestal de azulejos e esfera suspensa | `exec-2b3fe015-9293-4e61-b49d-b34177567d93.png` |
| `insp-duna-nuvens.png` | 1536 × 1024 | Galeria: mulher rindo, roupa coral/creme e poltrona com volumes de nuvem, flores gigantes e Duna sobre pedestal | `exec-e1f78b1d-d49f-4e20-a211-c8b0b66d9529.png` |
| `insp-marco-escada.png` | 1536 × 1024 | Galeria: homem em alfaiataria gráfica, escadaria âmbar e arco creme sobre fundo vinho; Marco ao lado | `exec-50c73a78-d4e0-4f88-adc5-eecb10b1c6fa.png` |
| `insp-farol-mar.png` | 1536 × 1024 | Galeria: Farol em ilha de azulejos acima do espelho-d’água, cortinas azuis e esfera lunar creme | `exec-0194777e-5ac3-4ffd-853f-340403438421.png` |
| `insp-trio-galeria.png` | 1536 × 1024 | Galeria: Duna, Marco e Farol sobre três pedestais, esculturas Lago/Brasa/creme e tecido rosa | `exec-14af34b9-7d25-441d-add1-56aa29fe5804.png` |

Pastas dos originais em `C:/Users/Antônio/.codex/generated_images/`: `01a1366c-7023-7703-bbd8-1b6328f806e6/` contém os dez anteriores e as três campanhas novas; `01a1372c-6234-7d82-b322-d6b615d3220d/` contém as quatro inspirações. Os arquivos públicos fazem parte do projeto; os caminhos dos originais registram a proveniência local da geração.

Na revisão anterior, os dois PNGs adicionais foram conferidos em 1536 × 1024 e correspondem byte a byte aos originais. SHA-256 de `hero-marco-homem.png`: `884496ade42aa1f080e1fc3fa9549f4e998506d864dda4c0d23ef252c2c3f4af`; de `hero-farol-mulher.png`: `8a504f39279bb844aa68fb38f179225c926a9fc8e0aeb0a24ac34b61c143c42e`.

Na revisão artística posterior, os **17 arquivos** tiveram dimensões lidas dos cabeçalhos PNG e SHA-256 comparado com os originais: todos corresponderam. Após a edição das personagens, os três PNGs substituídos foram novamente conferidos com os novos originais e também corresponderam. Os sete novos têm resolução nativa de 1536 × 1024; as três campanhas foram editadas por `image_gen`, sem pós-processamento por código. Hashes finais desta rodada:

| Arquivo | SHA-256 |
|---|---|
| `campanha-duna-jardim.png` | `efad0f208e9aa26ff285bcd6daba1191c0761f0280cefaa8e4a54b1ffd06bd3a` |
| `campanha-marco-orbita.png` | `02149ef966fdf26ed0a3bc57254ec497f5da77577ec7ad3e2c754658e12ca0f8` |
| `campanha-farol-cenario.png` | `587fab8b5f35212b7115a567e0db2b82057eb9a94ac57f236d534872703136df` |
| `insp-duna-nuvens.png` | `da21fe80b3ef92764408219b79904ab771b9eb9f214fcd8c16094d088f04636c` |
| `insp-marco-escada.png` | `f4a167b7639015996e326a352dad087228b694fd14f40e8a6e2e79efc09d18a0` |
| `insp-farol-mar.png` | `c2c2586231f3e74f630e0103bf3fc2aeef1d3bade6707bf1a765e5045a229987` |
| `insp-trio-galeria.png` | `f5c4418349d5101e40e92ea8b950818d1b54eda0fa21d3302d141df2abeebbfa` |

## Prompts literais da revisão artística

- [imagens-prompts-campanha.json](imagens-prompts-campanha.json): três edições finais das personagens, prompts completos, referências, originais e destinos; o histórico preserva as três gerações iniciais e suas referências estéticas fornecidas pelo usuário.
- [imagens-prompts-inspiracoes.json](imagens-prompts-inspiracoes.json): quatro chamadas independentes de inspiração, prompts completos, referências de produto, dimensões, original e destino.

As três referências Gantri fornecidas pelo usuário orientaram a linguagem visual das campanhas. As instruções dos prompts pedem novas pessoas, composições e figurinos, preservando o produto Per Parte. Os arquivos temporários dessas referências não são assets do site. A seção abaixo conserva a direção base anterior e distingue esse resumo dos prompts literais executados na nova rodada.

## Prompts base

Transcrição dos prompts de direção em `docs/site-direcao-conteudo.md`. São a base editorial, não um registro literal de cada payload enviado à ferramenta. As mudanças para as cenas efetivamente geradas estão na seção seguinte.

### Marco · catálogo

> Fotografia editorial de produto de uma luminária de mesa conceptual original chamada Marco, construída visivelmente por partes: base cilíndrica baixa e robusta em verde oliva fosco #7D8C6F, exatamente três anéis grossos de perfil suavemente arredondado em âmbar #D9A441 empilhados sobre a base, uma cúpula ampla arredondada em areia #E4DCCB que difunde luz quente creme #F6E7C4. Plástico impresso em 3D de acabamento premium fosco, linhas de camada muito finas e realistas, junções claras, sem brilho artificial. Obra inteira visível, perspectiva de três quartos quase frontal, produto ocupando 60% da altura, fundo infinito bege quente #E7DFD0, sombra natural suave, poça de luz quente, cabo fino discreto saindo pela traseira. Composição central, catálogo de design contemporâneo, lente 70 mm, iluminação suave, sem texto ou marcas.

### Duna · catálogo / direção inicial do hero

> Fotografia editorial de uma luminária de mesa conceptual original chamada Duna. Silhueta baixa e larga: grande cúpula hemisférica creme quente #F6E7C4 com bordas arredondadas, sobre pedestal cilíndrico curto em vermelho Brasa profundo #A90000 com ranhuras verticais discretas. Junção clara entre as duas partes. Material plástico impresso em 3D fosco, textura fina de camadas, aparência precisa e tátil, luz acesa suave, sem superfícies brilhantes. Para catálogo: objeto inteiro central em fundo infinito bege #E7DFD0, 60% da altura da composição, vista três quartos. Para hero horizontal: a mesma luminária sobre um aparador de madeira escura em sala contemporânea minimalista quente, parede creme, detalhes Brasa discretos, luz de fim de tarde, objeto no terço direito e amplo espaço negativo escuro/controlado à esquerda para texto, ambiente habitável e sóbrio, sem outras luminárias, sem pessoas, sem letras ou logotipos.

### Farol · catálogo

> Fotografia editorial de produto de uma luminária de mesa conceptual original chamada Farol. Silhueta esguia e vertical: difusor alto em cilindro de extremidades suavemente arredondadas, caneluras verticais delicadas, superfície creme iluminada #F6E7C4, assentado sobre base cilíndrica baixa e larga em teal Lago #008795. Pequeno anel Lago marca a junção. Plástico impresso em 3D fosco com linhas finas de camada, sem vidro, sem metal, geometria industrial precisa. Produto inteiro visto em três quartos, 65% da altura do quadro, fundo infinito bege quente #E7DFD0, sombra natural sutil e halo quente, cabo fino discreto atrás. Silhueta de lanterna moderna, iluminação de estúdio suave, catálogo de design premium, sem textos ou marcas.

### Macro / processo visual

> Macro editorial extremamente tátil da junção entre a base Brasa #A90000 e o difusor creme iluminado #F6E7C4 da luminária Duna, plástico impresso em 3D fosco com linhas de camada muito finas, encaixe limpo e preciso. Corte abstrato porém reconhecível, luz rasante quente, fundo bege desfocado, sem metal, sem ferramentas, sem mãos, sem poeira, sem texto. Mostrar a beleza do encontro das partes, sem fingir ser fotografia de produção real.

## Adaptações de cena e referências

| Cena final | Alteração da direção base | Referência de produto |
|---|---|---|
| Hero Brasa | A direção inicial de sala sem pessoas passou a campanha saturada Brasa com uma pessoa à direita; preserva área de texto à esquerda e protagonismo da luz | `duna.png` |
| Sala Duna | Desenvolve a direção de ambiente doméstico: sala quente e minimalista, objeto em contexto de uso, sem transformar a cena em registro de casa de cliente | `duna.png` |
| Escritório Farol | Retira o fundo infinito de catálogo e situa a mesma luminária em espaço de trabalho/criação | `farol.png` |
| Macro Duna | Aproxima a junção e textura descritas na base, preservando cor e forma do produto de referência | `duna.png` |
| Manifesto Marco | Retira o fundo bege e coloca Marco no lado direito de cenário vinho escuro, deixando espaço negativo para a mensagem | `marco.png` |
| Homem com Marco | Acrescenta uma pessoa sentada em banco, com camisa clara de linho e calça vinho; Marco é segurada com as duas mãos; fundo vinho e área negativa à esquerda | `marco.png` |
| Mulher com Farol | Acrescenta uma pessoa em pose/gesto de dança, calça clara e roupa Lago; Farol acesa permanece sobre um cubo ao lado, em fundo Lago | `farol.png` |
| Jardim Duna | Mangas fúcsia volumosas, flores e fitas em escala surreal; edição posterior troca a personagem por uma mulher jovem de cachos, mantendo pose, cenário e luminária | `duna.png` + referência estética na geração; campanha anterior + produto na edição |
| Órbita Marco | Alfaiataria listrada, atitude curiosa, palco verde e grandes anéis suspensos; edição posterior traz homem jovem com cachos/óculos; os três anéis da luminária continuam distintos | `marco.png` + referência estética na geração; campanha anterior + produto na edição |
| Cenário Farol | Figurino amarelo/azul/creme, pose assimétrica, azulejos e volumes suspensos; edição posterior traz mulher jovem de cabelo ruivo ondulado; Farol mantém sua silhueta vertical | `farol.png` + referência estética na geração; campanha anterior + produto na edição |
| Inspirações | Acrescenta poltrona com volumes de nuvem, escadaria impossível, palco com espelho-d’água e galeria escultural do trio | Um produto por cena; os três no trio |

As imagens de catálogo foram usadas como referência nas gerações derivadas de hero, ambientes e macro para manter silhueta, partes e cores. Isso melhora consistência entre cenas; a geração ainda é uma interpretação visual, não uma especificação geométrica ou industrial.

`hero-farol-mulher.png` registra um gesto em uma única imagem e foi preservada no acervo. Ela pode servir como poster ou referência para uma geração posterior, mas não entrega movimento de dança. O vídeo foi explicitamente **ADIADO pelo usuário**; nenhuma das sete imagens novas é vídeo. O diagnóstico das ferramentas está em [video-campanha-disponibilidade.md](pesquisa/video-campanha-disponibilidade.md).

## Uso no site

- Carregar o hero prioritariamente e as cenas abaixo da dobra sob demanda.
- Ajustar o recorte com `object-position` para manter pessoa/produto visíveis nos diferentes viewports; não substituir as imagens por placeholders vazios.
- Usar texto alternativo descritivo nas imagens de conteúdo; imagens repetidas dentro de um controle já nomeado podem ter `alt` vazio.
- Manter a nota de coleção em estudo e o esclarecimento no FAQ. Não adicionar certificações, material homologado, avaliações ou alegações de fabricação a partir dos renders.
- Hero, três fotos imediatamente abaixo, destaques de menu e Missão usam as novas campanhas. A galeria tem oito cards: quatro novas inspirações seguidas das quatro imagens anteriores. As três campanhas antigas ficam no acervo; o catálogo de produto permanece intacto.
- Preservar fotografias originais e prompts de direção para novas gerações consistentes. Os 17 arquivos PNG compõem a entrega e seu histórico; uma futura conversão para formatos menores deve conservar os originais e ser conferida visualmente.
- As sete imagens foram inspecionadas individualmente: silhuetas/famílias de cor reconhecíveis e três anéis de Marco visíveis nas cenas em que aparece. A conferência dos arquivos não substitui o QA dos recortes e textos na página renderizada, registrado em [revisao-landing-2026-10-13.md](revisao-landing-2026-10-13.md).
