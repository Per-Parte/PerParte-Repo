# Design system inicial — Per Parte

**Base:** Revista de Marca, edição 01, 12/10/2026, especialmente pp. 30–46 e 53–59. **Estado:** extração inicial em 13/10/2026. O PDF é mestre; `packages/design-system/tokens.json` é a fonte técnica dos valores expressos. A marca tem decisões firmes e pontos provisórios. Este arquivo os identifica.

## Princípios visuais decididos

1. **Partes visíveis.** Mostre junções; cor delimita partes em vez de disfarçá-las. Não faça degradê entre partes adjacentes. O gradiente de fundo do herói exemplificado na p. 58 tem outra função e não altera essa regra de produto.
2. **Sistema aberto de cor.** Uma família dominante por peça/cena; a identidade se reconhece pela Luz Acesa, pelo contraste e pelo símbolo, mesmo quando muda a família.
3. **Luz como personagem.** A obra acesa aparece em quase todo material. Quando não há fotografia, o círculo Luz Acesa pode representar o brilho.
4. **Fosco por padrão.** Sem brilho ou sombra decorativa; brilho é acento deliberado. O material impresso e as linhas de camada não são escondidos.
5. **Lúdico com rigor.** Formas simples e cor na superfície; números e guardas de fabricação precisos por baixo. O uso gráfico explícito de ○ △ □ ainda está em avaliação (pp. 30–31, 65–66).

## Cor

### Constantes

| Token | Hex | Papel | Estado |
|---|---|---|---|
| Luz Acesa | `#F6E7C4` | Creme da lâmpada acesa; precisa aparecer em toda peça | Decidido |
| Areia | `#E4DCCB` | Difusor apagado, neutro quente, família Marco | Decidido |
| Palco Claro | `#E7DFD0` | Estúdio bege da loja e fundo clean | Decidido |
| Palco Escuro | `#1E1E1E` | Preto fosco de manifesto/vídeo; texto escuro | Decidido |
| Preto do símbolo | `#070908` | Versão de tinta única em fundo claro | Decidido |

Fonte: pp. 33, 35–36.

### Famílias e apoio v1

| Nome | Hex | Papel descrito na revista |
|---|---|---|
| Brasa | `#A90000` | Ação, botão principal, avatar, selo, rodapé e fita da caixa no lançamento |
| Vinho | `#670700` | Fundo profundo tom sobre tom de Brasa |
| Rubi | `#F7002D` | Faísca pontual; não usar como fundo de texto pequeno |
| Lago | `#008795` | Contraponto frio; confirmações |
| Água | `#83CFCB` | Tom claro do Lago e fundos leves |
| Sol | `#FFCD00` | Luz e aviso técnico |
| Mata | `#00875D` | Verde vivo de campanha |
| Fúcsia · Pop | `#FF0095` | Acento brincalhão, uma vez por cena |
| Grafite | `#333333` | Texto impresso longo, embalagem e fundo de vídeo |
| Névoa | `#EEEEEE` | Fundo de interface técnica/configuração |
| Verde Marco | `#7D8C6F` | Base da obra-manifesto |
| Âmbar Marco | `#D9A441` | Três anéis da obra-manifesto |

Fonte: p. 37. A paleta é v1 de identidade; cor final de **produto físico** depende de teste de filamento e medição da peça impressa, conforme p. 39. Não trate um hex de tela como especificação pronta para produção.

### Composição e contraste

- Cena padrão: **uma dominante + um neutro de palco + Luz Acesa**. Até cinco cores; tom sobre tom dentro da mesma família é permitido. Duas famílias não disputam a mesma cena (p. 38).
- Brasa nunca é fundo de texto corrido longo. Rubi e Lago não recebem texto pequeno na combinação ilustrada; a revista indica texto ≥ 24 px ou negrito para essas cores (p. 37).
- Texto comum precisa de contraste ≥ 4,5:1; 3:1 só acima de 24 px. A revista traz exemplos como Luz Acesa sobre Brasa (6,4:1), sobre Vinho (10,7:1), preto sobre Sol (11,1:1) e preto sobre Água (9,3:1). Verifique a combinação concreta no navegador antes de publicar (pp. 37–38).
- Brasa é cor de ação do lançamento, enquanto Luz Acesa é constante em todas as famílias. A escolha da família ativa em outras campanhas permanece decisão editorial (pp. 37–39).

## Tipografia — provisória

As três famílias da edição 01 são **Unbounded** (display), **Figtree** (texto/interface) e **DM Mono** (oficina). São fontes de trabalho do Google Fonts até a entrega B4. O site anterior ainda usava Clash Display provisoriamente; isso não é uma quarta fonte do novo sistema. O wordmark final, com letras que se comportam como partes, também está em aberto (pp. 32, 40–43).

| Estilo | Família | Tamanho / entrelinha | Peso | Tracking | Uso |
|---|---|---|---|---|---|
| display-xl | Unbounded | 72 px / 0,95 | 700 | −0,02em | Campanha |
| display | Unbounded | 48 px / 1 | 700 | −0,015em | Seção, capa |
| title | Unbounded | 30 px / 1,1 | 600 | −0,01em | Bloco, nome da obra |
| wordmark | Unbounded | 24 px / 1 | 600 | 0 | Nome junto ao símbolo, provisório |
| heading | Figtree | 20 / 28 px | 700 | 0 | Subtítulo, cartão |
| body-lg | Figtree | 18 / 28 px | 400 | 0 | Abertura, manifesto |
| body | Figtree | 16 / 24 px | 400 | 0 | Texto e interface |
| body-strong | Figtree | 16 / 24 px | 600 | 0 | Botão, ênfase |
| caption | Figtree | 13 / 18 px | 500 | 0 | Legenda, nota |
| label | DM Mono | 12 / 16 px | 500 | +0,08em | Rótulo técnico em caixa alta |
| data | DM Mono | 14 / 20 px | 400 | 0 | Medidas, hex, prazo |

Fonte: pp. 40–42. Regras: títulos em caixa normal, curtos (no máximo duas linhas em peça publicada), uma manchete por peça; Unbounded nunca em texto corrido ou abaixo de 20 px; números tabulares em preço/medidas; acentos pt-BR reais; emoji fora das peças de marca. O espécime da p. 41 quebra a manchete em mais linhas para demonstrar a fonte, mas a regra textual continua duas linhas.

**Responsividade em aberto:** a revista não define escala móvel, breakpoints nem redução dos 72 px. Os tokens reproduzem a escala editorial; uma futura interface precisa definir essa adaptação e verificá-la em mobile.

## Símbolo e wordmark

- O símbolo é um **“p” em duas partes**: bojo quadrado vazado de cantos arredondados e ponto quadrado menor, solto embaixo à esquerda. Estados: montado (institucional/embalagem), desmontado (digital/animação) e partes soltas (estampa/fundos) (pp. 31–33).
- Proporção da arte: **1198 × 1760**. Preserve pela altura. Raio aproximado dos cantos: **6% do lado**. Respiro em todos os lados: aproximadamente **20% da largura**, equivalente à espessura do bojo. O raio proporcional reaparece em cartões, certificado e posts (p. 32).
- Abaixo de **24 px de altura**, use somente o símbolo, sem wordmark. A p. 34 ilustra 16, 24, 48 e 96 px como escalas de aplicação. O wordmark provisório é “Per Parte” em Unbounded 600, alinhado pela base do bojo (pp. 32–34).
- Versões de uma tinta: preto em fundo claro; branco em Brasa, Vinho, Grafite, Palco Escuro e Mata; Luz Acesa em cor saturada escura; Brasa em Luz Acesa/Palco Claro/Névoa. Não girar, distorcer, juntar o ponto ao bojo, preencher o vazado, usar símbolo e fundo da mesma família sem contraste ou sobrepor texto ao padrão de partes soltas (p. 33).
- **Arquivo final de marca pendente:** este pacote não recria o vetor do símbolo a partir de aproximações. Extraia/receba o master de Davi e Caio antes de lançar assets finais. O desenho final do wordmark é a entrega B3 da revista (pp. 32, 65–66).

## Formas, espaçamento e sombra

O PDF dá **raio proporcional de cerca de 6%** para o símbolo e peças associadas. Não define escala de espaçamento em pixels nem raio único para todo botão. Em aplicação, cartões e peças retangulares devem preservar a sensação de canto macio sem forçar `6%` em qualquer retângulo. `--pp-sombra-decorativa: none` expressa o princípio fosco da p. 31. Sombras fotográficas naturais e a poça de luz da obra continuam válidas. A imagem da landing na p. 57 mostra botões arredondados; seu raio exato e componentes ainda precisam de especificação própria.

## Fotografia e arte

| Território | Uso | Direção | Estado |
|---|---|---|---|
| Estúdio saturado | Campanha, redes, anúncios | Fundo profundo de uma família, tom sobre tom ou par ousado, grão analógico fino, obra acesa como luz principal, cabo honesto | Decidido |
| Bege clean | Loja, catálogo, página da obra | Palco Claro, luz suave, fosco, sombra mínima, sem grão, vista explodida das partes | Decidido |
| Casa real | UGC e página da obra | Interiores reais, luz de fim de tarde, pessoas presentes | Proposta |

Em geral: obra acesa como fonte principal; halo quente e poça de luz; preto com detalhe; peça central ocupando cerca de **55% da altura** e espaço negativo para texto. Pessoas aparecem na casa real e nos bastidores, não no estúdio. Os renders da revista são estudo de direção de arte e não substituem foto da Marco impressa (pp. 44–47).

## Site e componentes futuros

A revista mostra um herói com Anel de Obras, título grande e alternância de blocos saturados/papel/escuro, encerrando em Brasa (pp. 57–59). São direção e exemplares visuais; não há biblioteca de componentes, grid responsivo, espaçamento em px, animações obrigatórias ou padrões de estado de interação fechados. Para botões, cards e navegação, comece pelos tokens e registre especificações próprias depois de validar protótipos. Use o benchmark Gantri em `docs/pesquisa/gantri.md` para comparar hierarquia e contenção visual, sem copiar a identidade.

## Uso técnico

```css
@import "@perparte/design-system/tokens.css";

.chamada {
  color: var(--pp-cor-luz-acesa);
  background: var(--pp-cor-brasa);
  font-family: var(--pp-tipo-display-fonte);
  font-size: var(--pp-tipo-display-tamanho);
  line-height: var(--pp-tipo-display-entrelinha);
  font-weight: var(--pp-tipo-display-peso);
}
```

Em JavaScript: `import { tokens } from '@perparte/design-system/tokens.mjs'`. As fontes precisam ser carregadas pela aplicação após decisão final. Gere e verifique os arquivos com `npm run tokens:gerar` e `npm run tokens:verificar`.
