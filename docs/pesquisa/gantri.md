# Gantri — benchmark da Per Parte

**Pesquisa em 13/10/2026.** Gantri é a principal referência de categoria, experiência editorial e confiança comercial, descrita na Revista de Marca pp. 4, 14–22 e 35–38. Os dados abaixo vêm do [site oficial](https://www.gantri.com/), da [página de missão](https://www.gantri.com/about) e de medição da homepage em navegador (desktop 1689 × 1221; móvel 390 × 844). São uma amostra de páginas e datas, não um design system oficial da Gantri.

## Posição e lição para a Per Parte

A [Gantri](https://www.gantri.com/about) apresenta iluminação feita sob demanda, com criadores creditados e remuneração por venda, material nomeado, processo de fabricação e promessas comerciais explícitas. Na Per Parte, a diferença de posicionamento é que a pessoa cria a obra no configurador. A revista recomenda aprender com a disciplina da Gantri — prova do processo, nome nas coisas, prazo e confiança — e manter autoria do cliente e uma marca mais vibrante (pp. 14–22).

## Extração automatizada

A skill **Extract Design System** executou `extract-design-system https://www.gantri.com/ --extract-only`. Os arquivos reproduzíveis estão em `gantri-extracao/.extract-design-system/`:

- `raw.json`: dados capturados pela ferramenta.
- `normalized.json`: paleta vazia, sem escala de raio ou sombra; a fonte foi identificada somente pelo nome interno `__buch_032087`. A escala de espaçamento detectada foi 2, 4, 5, 8, 12, 16, 24, 32, 48, 64, 72, 80, 128, 160 e 256 px, mas é uma frequência de CSS, não regra aprovada nem escala da Per Parte.

A homepage usa estilos dinâmicos, então a paleta vazia **não significa ausência de cores**. Medições abaixo complementam a extração. O extrator não gerou tokens da Per Parte e nada de Gantri foi importado para `packages/design-system`.

## Medições da homepage

| Elemento | Desktop | Móvel | Interpretação |
|---|---|---|---|
| Corpo | Söhne Buch/Helvetica, 15/22 px, peso 400 | Mesmo corpo na amostra | Leitura contida, sem peso excessivo |
| Primeiro `h1` | 36/48 px, 400, tracking −0,54 px | 36/48 px | Título de abertura sobre imagem |
| Primeiro `h2` editorial | 91/96 px, 400, tracking −2,73 px | 36/48 px, tracking −0,5 px | Hierarquia cresce muito no desktop |
| `h3` observado | 36/48 px, 400 | Variável por seção | Títulos regulares com respiro |
| Botão principal observado | raio 40 px; padding 12 × 24 px | raio 40 px; padding 12 × 24 px | Formato pílula |
| Logo no cabeçalho | SVG de wordmark 91 × 22 px, a 24 px da esquerda | SVG 80 × 19,6 px, centralizado | Presença pequena e nítida; cabeçalho mede 64 px no desktop |
| Verde de ação observado | `rgb(0, 133, 91)` = `#00855B` | Mesmo valor na amostra | Cor da Gantri, **não** token da Per Parte |

Contagem de estilos computados em cerca de 970 elementos da homepage desktop: raio `0px` em 886, `4px` em 52, `50%` em 17, `40px` em 12, `8px` em 2 e `12px` em 2; `box-shadow: none` em 956. Os poucos efeitos restantes eram brilhos **internos** suaves, sobretudo em camadas sobre imagem. Isso sustenta uma leitura minimalista na homepage, mas não define cada tela ou campanha. Os números podem mudar com a versão do site.

## Padrões visuais observados

- **Hierarquia:** fotografia e títulos grandes regulares carregam a abertura. O peso tipográfico discreto contrasta com a Unbounded mais assertiva, provisória na Per Parte.
- **Logo:** wordmark pequeno e legível no cabeçalho, sem competir com a imagem e a manchete. A Per Parte já possui regra própria de símbolo, respiro e escala (Revista pp. 31–34).
- **Interface:** muitos elementos sem raio e sem sombra, com pílulas reservadas às ações. A Per Parte prescreve fosco e sem sombra decorativa, mas seu raio de botões ainda não está decidido.
- **Prova de confiança:** a [missão oficial](https://www.gantri.com/about) explicita fabricação sob demanda, materiais, durabilidade, LED, garantia de três anos e devolução em 30 dias. Esses números são da Gantri; prazos e garantias da Per Parte continuam em aberto.
- **Nomes e autoria:** a Gantri credita designers e sua [Reference Series](https://www.gantri.com/gantri) explica diretrizes de fabricação. A Per Parte pode tornar visíveis os nomes dos criadores das partes e de quem compôs a obra, como determina a revista.

## Tradução prática para a Per Parte

| Aprendizado | Aplicação já apoiada pela revista | Evitar inferir |
|---|---|---|
| Um acento reconhecível | Luz Acesa sempre; Brasa em ação no lançamento | Copiar o verde Gantri |
| Manchete e produto em foco | Uma manchete curta; obra acesa como personagem | Copiar Söhne ou sua escala literalmente |
| Pouca decoração de interface | Fosco, sombra decorativa ausente, cor estrutural | Fixar todo raio em 40 px |
| Segurança de compra comprovável | Prazo honesto, material, processo e certificado | Anunciar garantia/prazo antes de validar |
| Autoria em cada página | Nome de quem criou a obra e das partes | Tratar a obra como desenho pré-selecionado de um designer |

## Limites da pesquisa

A extração automática registrou só a homepage. As medições manuais foram feitas nos elementos disponíveis em duas larguras, não em toda a jornada de compra. Não foram copiadas fontes, imagens, SVGs ou código da Gantri. Revise as páginas oficiais e repita a medição antes de usar números atuais em uma decisão nova.
