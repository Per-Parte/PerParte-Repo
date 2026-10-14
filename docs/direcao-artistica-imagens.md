# Direção artística das imagens — Per Parte

Data: 13/10/2026. **DECIDIDO pelo usuário para esta revisão:** expressões individualizadas, roupas dramáticas e artísticas, cenários surrealistas e coloridos, usando as três referências visuais Gantri enviadas como orientação estética. A aprovação desta direção não homologa produtos, materiais ou uma campanha comercial final. Todas as imagens continuam **ESTUDOS CONCEITUAIS**.

## Linguagem visual

- **Pessoas com presença:** poses e atitudes variadas, com expressões sérias e contidas de editorial de moda. Evitar sorriso casual, pose ou figurino de catálogo genérico.
- **Figurino como composição:** volumes, drapeados e contrastes de cor participam do cenário. O tratamento deve parecer direção de moda/editorial, com intenção em cada silhueta.
- **Cenários construídos:** usar cor saturada, escala inesperada, formas cênicas e elementos surrealistas. A luz e a matéria permanecem coerentes o suficiente para sustentar a leitura fotográfica.
- **Produto reconhecível:** as luminárias Per Parte são a referência fixa de cada geração. Cenário e figurino podem mudar; desenho, partes, famílias de cor e junções do produto devem permanecer identificáveis.
- **Composição para a página:** reservar área legível para títulos e controles, preservar rosto e produto no recorte móvel e manter o protagonista claro mesmo em thumbnail.
- **Originalidade:** as referências orientam atmosfera, força expressiva e relação entre pessoa/objeto. Pessoas, produtos, marcas, texto e fotografias da Gantri não são usados como assets da landing.

## Refinamento das personagens e persona

Após revisar as três campanhas geradas, o usuário pediu **alterar somente as personagens para adequá-las à persona do documento mestre**. As três edições foram geradas, inspecionadas e copiadas para os mesmos caminhos públicos. Preservam a composição dos cenários, luminárias, câmera e direção surrealista/colorida. Os novos originais e hashes substituíram os da primeira geração de campanha no manifesto; o histórico dos prompts conserva ambas as etapas.

Na edição mais recente, o usuário pediu **expressões mais sérias em todas as imagens com pessoas** e correção da mão junto ao rosto na campanha Farol. Foram editadas as três campanhas e as duas inspirações com personagens que estão em uso no site. As outras duas inspirações não têm pessoas. Na Farol, a mão que apoiava o queixo passou ao bordo do pedestal de azulejos, com antebraço e manga conectados; o outro braço continua levantado em direção à esfera. As cenas, produtos e identidade das personagens foram preservados. Os prompts e hashes atuais estão em [imagens-prompts-expressoes.json](imagens-prompts-expressoes.json) e [site-imagens.md](site-imagens.md).

A referência editorial são as pp. 16–18 da Revista de Marca: pessoas de 20–30 anos em cidades médias/grandes, com poder de compra, interesse por moda e arte, mistura de estilos e valorização de autoria e singularidade. A adequação deve aparecer na atitude e no estilo pessoal; não se apoiar em ostentação, logos ou códigos de status. A revista não determina gênero, etnia, profissão ou um padrão de aparência física para esse público.

O casting solicitado nos prompts — mulher de cerca de 24 anos em Duna, homem de cerca de 26 em Marco e mulher de cerca de 25 em Farol, com cabelos/expressões individualizados — é uma escolha criativa desta execução, não uma segmentação demográfica obrigatória. A idade é uma orientação de geração, não uma medição da aparência. As imagens finais mostram, respectivamente, mulher de cachos curtos, homem de cachos/óculos e mulher de cabelo ruivo ondulado. As pessoas retratadas são fictícias e não constituem pesquisa ou representação estatística dos clientes.

## Continuidade dos três produtos

| Produto | Referência local de geração | Traços a preservar |
|---|---|---|
| Duna | `apps/site/public/images/duna.png` | Cúpula creme baixa/larga, base Brasa, encontro claro das duas partes |
| Marco | `apps/site/public/images/marco.png` | Base oliva, três anéis âmbar, difusor areia/creme |
| Farol | `apps/site/public/images/farol.png` | Difusor vertical creme canelado, base Lago e anel de junção |

Os três assets de catálogo permanecem como referência. Duna/Farol são propostas de nome e desenho; a representação de Marco também é conceitual. Consistência visual não equivale a validação geométrica, elétrica ou de produção.

## Conjunto solicitado

| Grupo | Arquivos | Função |
|---|---|---|
| Três campanhas | `campanha-duna-jardim.png`, `campanha-marco-orbita.png`, `campanha-farol-cenario.png` | Campanhas com expressões editoriais sérias; Farol com mão e braço corrigidos |
| Quatro inspirações | `insp-duna-nuvens.png`, `insp-marco-escada.png`, `insp-farol-mar.png`, `insp-trio-galeria.png` | Galeria ampliada de quatro para oito cards; as duas fotos com personagens receberam expressões sérias |
| Três fundos de estúdio | `categoria-marco-violeta.png`, `categoria-duna-verde.png`, `categoria-farol-ambar.png` | Cor editorial nos cards de “Qual é a sua luz?”, mantendo os produtos de referência |
| Acervo anterior | Os dez PNGs anteriores | Preservar catálogo, histórico de campanha e demais imagens sem perda de origem |

O conjunto contém 20 PNGs armazenados: dez anteriores, sete da revisão artística e três fundos de estúdio. A primeira rodada teve dimensões e correspondência com os originais conferidas; as três campanhas editadas foram novamente verificadas e os registros atualizados. Os três fundos foram conferidos em 1122 × 1402, com cópias iguais aos originais por SHA-256. A confirmação de dimensões, origem, hashes e uso efetivo está no manifesto em [site-imagens.md](site-imagens.md). Assets guardados no acervo não precisam aparecer na campanha ativa.

## Fundos coloridos dos cards de composição

O usuário pediu mais cor no site a partir dos prints de categorias da Gantri. Em `#categorias`, “Qual é a sua luz?”, Marco passa a ter cenário violeta/lavanda; Duna, verde-floresta/sálvia; Farol, vinho/laranja/âmbar. São fundos contínuos de estúdio, com luz direcional, queda tonal e espaço para título e seta. Não há pessoas nessas três cenas.

A mudança é editorial: desenho, proporções e cores das luminárias permanecem ligados aos assets de catálogo. O fundo não cria uma nova variante de produto nem altera a paleta de filamentos. As campanhas com personagens adequadas à persona e a galeria de oito cards são preservadas. Os prompts literais, referências e originais estão em [imagens-prompts-fundos.json](imagens-prompts-fundos.json).

O QA dos cards foi concluído no navegador integrado em desktop 1280 × 720 e móvel 390 × 844: imagens carregadas, produtos inteiros, títulos legíveis e nenhum overflow. No móvel, os três cards aparecem em uma coluna e o título Farol fica separado da cúpula. Detalhes de Marco e Farol abriram corretamente e fecharam por Escape; console sem erros, check e build passaram. Capturas 21–23 em `docs/pesquisa/perparte-capturas/`.

## Proveniência e revisão

As novas gerações e edições usam `image_gen` e imagens dos produtos como referência. Prompts literais, referências e originais das rodadas anteriores estão em [imagens-prompts-campanha.json](imagens-prompts-campanha.json) e [imagens-prompts-inspiracoes.json](imagens-prompts-inspiracoes.json); a edição atual está em [imagens-prompts-expressoes.json](imagens-prompts-expressoes.json). O registro das campanhas conserva a primeira geração e documenta a edição das personagens. A descrição acima é direção aprovada, não transcrição de prompts executados.

As sete imagens e as três edições posteriores foram inspecionadas individualmente: Duna mantém cúpula creme/base Brasa, Marco preserva três anéis âmbar/base oliva e Farol mantém difusor vertical/base Lago. Dimensões e hashes finais foram conferidos. O QA renderizado confirmou as três campanhas em desktop e móvel; em 390 × 844, rostos e luminárias aparecem inteiros, com fundos corretos e sem overflow horizontal. A galeria tem oito cards, quatro novos assets carregados, avanço por seta e navegação do trio para a coleção. Evidências 13–20 e resultados de build/check estão em [revisao-landing-2026-10-13.md](revisao-landing-2026-10-13.md). A revisão artística está concluída como estudo visual local.

## Limites preservados

O seletor flutuante continua um estudo de cor e não recolore as imagens. As novas cenas são PNGs estáticos. O vídeo foi explicitamente **ADIADO pelo usuário** e só deve ser retomado quando solicitado. Não apresentar pose, slideshow ou zoom como geração de vídeo. Compra, estoque e integração comercial seguem fora desta revisão.
