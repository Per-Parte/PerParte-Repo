# Gantri Trade — referência para a revisão da LP

**Data:** 14/10/2026. **Fonte observada:** [Gantri Trade](https://www.gantri.com/trade). **Escopo:** estrutura editorial, fotografia, navegação e comportamento na rolagem; adaptação à LP de captação Per Parte. Esta pesquisa não altera catálogo, backend ou condições comerciais.

## Método e evidências

A página foi observada em desktop de **1440 × 900** e móvel de **390 × 844** pelo Playwright. A extensão Chrome apresentou timeouts no início; uma tentativa posterior conseguiu capturar o hero na aba real, salva separadamente em `08-extensao-chrome.png`. As medidas e demais capturas continuam atribuídas ao Playwright.

| Evidência local | Conteúdo |
|---|---|
| [02-hero.png](gantri-trade-capturas/02-hero.png) | Fotografia de abertura, título e navegação desktop |
| [03-paineis.png](gantri-trade-capturas/03-paineis.png) | Sequência dos blocos fotográficos |
| [04-painel-task.png](gantri-trade-capturas/04-painel-task.png) | Texto sobre a cena durante a rolagem |
| [05-cadastro.png](gantri-trade-capturas/05-cadastro.png) | Área de cadastro da referência |
| [06-pessoas-final.png](gantri-trade-capturas/06-pessoas-final.png) | Fotografia com pessoa no encerramento |
| [07-mobile.png](gantri-trade-capturas/07-mobile.png) | Composição móvel |
| [08-extensao-chrome.png](gantri-trade-capturas/08-extensao-chrome.png) | Hero capturado pela extensão do Chrome, viewport da aba real |
| [rea-evidencia.json](gantri-trade-capturas/rea-evidencia.json) | Metadados e limites da observação REA |

A inspeção REA usou Chrome headless por CDP local na porta 9335, origem permitida `https://www.gantri.com`. Evidence `ev_c6a3216e8fb4265c4152b693ee87d3ceb746b81f34d463294644feec7c6d38ef`, provider `rea-cdp-browser` v2, confiança `observed`: **743 nós DOM, 21 scripts, janela solicitada de 750 ms após conexão**. Não foram coletados valores de storage, fontes dos scripts ou mapas de código; a atividade anterior à conexão não está disponível. O JSON local documenta esses limites. Contar scripts não identifica suas bibliotecas nem comprova o motor de animação.

## Observado na referência

| Elemento | Evidência observada | Limite de interpretação |
|---|---|---|
| Hero | Fotografia ocupando a largura disponível; caixa medida de aproximadamente 1430 × 820 px no desktop | É uma medida daquela viewport, não regra para todas as telas |
| Tipografia | Título do hero desktop com `font-size: 52px` e `line-height: 64px`; peso visual leve e respiro entre título, texto e ações | Família/fontes Gantri não são incorporadas à Per Parte |
| Navegação | Fixa, inicialmente transparente sobre o hero, passando a fundo branco na rolagem | O comportamento orienta a adaptação; não exige reproduzir o menu comercial |
| Introdução | Bloco branco entre abertura e cenas fotográficas | O branco e o respiro organizam a narrativa |
| Narrativa | Quatro fotos amplas; caixas medidas em torno de 1430 × 990 px | A LP Per Parte não precisa copiar quantidade ou conteúdo |
| Texto sobre a cena | `position: sticky`, com `top: 410px` na amostra desktop | O texto permanece em uma faixa enquanto a cena passa |
| Fotografias durante o scroll | Sem `transform` nas amostras inspecionadas | Não foi comprovado parallax; também não foi comprovado uso de GSAP |
| Desfoque | Painéis narrativos sem `backdrop-filter`; `blur(32px)` observado somente em um input do rodapé | Não atribuir efeito de vidro aos painéis narrativos Gantri |
| Direção fotográfica | Ambientes e fotografia com pessoa no encerramento | Pessoas e cenários da referência não foram reutilizados |

## Adaptação Per Parte

O usuário pediu uma direção neutra para esta LP e painéis de vidro sobre fotografias. **O vidro é uma adaptação solicitada, não um comportamento comprovado nos painéis Gantri.** O desenho usa tokens tipográficos locais, fotos originais e linguagem Per Parte; nenhum ativo, logo, texto ou fonte da Gantri foi copiado.

| Decisão da LP | Implementação local em revisão |
|---|---|
| Fotografia como abertura | Hero com cena original, título “A sua casa. O seu jeito de criar.” e CTA para cadastro |
| Direção neutra localizada | Papel `#F5F5F3`, branco, cinzas e texto escuro no CSS da LP; tokens globais preservados |
| Tipografia leve | Figtree no texto e títulos de peso 400; wordmark continua no token display existente |
| Narrativa com fotografias | Introdução branca, cena de criação, ambiente com Duna, convite e formulário sobre ambiente com Farol |
| Vidro solicitado | Painéis com fundo translúcido e `backdrop-filter: blur(26px)`, sem sombra decorativa; fallback mais opaco quando blur não é suportado |
| Rolagem | Painéis narrativos sticky no desktop (`top: calc(50vh - 175px)`); fluxo normal no móvel até 600 px |
| Movimento discreto | Revelações de opacidade e deslocamento de 22 px via IntersectionObserver; cabeçalho muda após 40 px de scroll |
| Movimento reduzido | Remove transições, deslocamento, scroll suave e sticky dos painéis; conteúdo permanece disponível |

As duas fotografias novas são conceituais: `lp-vida-hero-v2.png` e `lp-criar-v2.png`, com pessoas fictícias adultas da faixa prioritária de 20–30 anos. Geometrias Duna/Marco partiram das referências locais; acabamentos neutros e peças avulsas são propostas visuais. Não documentam clientes, equipe, fabricação ou variantes comerciais. Proveniência, prompts e dimensões em [imagens-lp-v2-prompts.md](../imagens-lp-v2-prompts.md). Os ambientes existentes Duna/Farol continuam identificados como estudos.

## QA da implementação Per Parte

Rodada local desta revisão, separada da validação histórica da LP Springs:

| Verificação | Resultado |
|---|---|
| Testes do site | 77 aprovados fora do sandbox; primeira tentativa encontrou `EACCES` de loopback |
| `site:check` | Aprovado |
| Desktop 1440 × 900 | Quatro imagens carregadas, sem overflow |
| Painel sticky | Coordenada vertical de 275 px mantida ao avançar 150 px de scroll |
| Vidro | Blur de 26 px confirmado na implementação |
| Móvel | Sem overflow em 390 e 320 px; fotos verticais próprias selecionadas por picture, com rostos e luminárias completos |
| Movimento reduzido | Emulação confirmou scroll automático, zero blocos com animação habilitada e painéis relativos |
| Cadastro com resposta simulada | Payload e consentimento preservados; sucesso acessível, foco no status, formulário limpo e botão reabilitado. Nenhuma gravação no Resend nesta rodada |
| Build TRUE | Aprovado, 39 arquivos públicos |
| Deploy | READY: `dpl_HmtWz29t5wxqXoTvce7NREbzc4pf`, fonte `main` no commit `e918b7a`, 39 arquivos públicos |
| Produção | `/`, `/loja`, `/produtos/marco`, `/conta` e `/carrinho` com 200 e nova LP; GET captação 405, produtos e caminhos privados verificados 404 |
| Navegação pública | Desktop sem erros de JavaScript; móvel 390 px sem overflow e com ambas as fotos verticais selecionadas |
| Teclado | Link de salto visível no primeiro Tab; Enter e Tab conduzem ao e-mail |

As fotos móveis `lp-vida-hero-mobile-v2.png` e `lp-criar-mobile-v2.png` têm 1024 × 1536 px. A primeira QA mostrou rostos cortados pelo crop das fotos horizontais; as versões verticais corrigem esse problema, mantendo o preload condicionado à viewport. Capturas locais em `perparte-lp-v2-capturas/`.

**Publicada em [perparte.com](https://perparte.com).** URL técnica: `per-parte-website-i076vhfn1-per-parte1.vercel.app`. A CLI publicou uma exportação limpa do commit `e918b7a` da `main`, sem incluir alterações locais concorrentes do configurador. MCP Vercel confirmou READY, aliases e metadados do commit. Capturas públicas `08-producao-desktop.png`, `09-producao-mobile.png` e `10-producao-vidro-mobile.png` em `perparte-lp-v2-capturas/`. Nenhum cadastro real ou envio foi feito nesta revisão; a integração permanece com o código anteriormente validado.

Conferir recortes de pessoa/luminária em desktop e móvel, legibilidade dos painéis, teclado/foco, estado do cabeçalho, sticky sem sobreposição, comportamento com movimento reduzido e o fluxo de cadastro preservado. A chave, consentimento, Resend Contacts, ausência de envio automático e alternância `PERPARTE_LP_ATIVA` permanecem no contrato do ADR 0007. Decisão visual em [ADR 0009](../../.claude/adr/0009-lp-neutra-gantri-trade.md).
