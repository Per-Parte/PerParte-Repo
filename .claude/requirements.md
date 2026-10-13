# Requisitos e estado das decisões

**Fonte principal:** Revista de Marca, edição 01. **Atualização:** 13/10/2026. `DECIDIDO` reproduz decisão descrita na revista; `PROVISÓRIO` e `PROPOSTA` não autorizam tratar o valor como final; `EM ABERTO` exige decisão; `FUTURO` fica fora do primeiro produto.

| ID | Estado | Regra ou direção | Fonte |
|---|---|---|---|
| P-01 | DECIDIDO | Produto inicial: luminárias de mesa impressas em 3D sob demanda. | pp. 5, 8 |
| P-02 | DECIDIDO | A pessoa cria a obra; a Per Parte fabrica. Autoria do cliente é o diferencial. | pp. 4–5, 13–15 |
| P-03 | DECIDIDO | Modos Montar e Inventar; liberdade apoiada em partes, formas-base e regras de fabricação. | pp. 8, 24, 50–52 |
| P-04 | DECIDIDO | Limites de fabricação entram nos controles; a ferramenta não deve gerar obra impossível de fabricar. | pp. 8, 11, 52 |
| P-05 | DECIDIDO | Preview e arquivo de produção devem representar a mesma obra. | pp. 7–8, 14 |
| P-06 | DECIDIDO | Certificado de autoria e crédito aos criadores das partes. | pp. 11, 14, 51, 55 |
| M-01 | DECIDIDO | Posicionamento premium acessível; acabamento e autoria justificam o valor. | pp. 5, 14–15 |
| M-02 | DECIDIDO | Sem cupom de rotina ou liquidação; exceção de lançamento vinculada a influenciadores. | pp. 6, 9, 21, 63 |
| M-03 | DECIDIDO | Voz lúdico-precisa, em segunda pessoa; “obra”, “composição”, “criador(a)”, “Montar” e “Inventar”. | pp. 23–28 |
| D-01 | DECIDIDO | Luz Acesa `#F6E7C4` em toda peça; uma família dominante, um neutro e no máximo cinco cores. | pp. 35–39 |
| D-02 | DECIDIDO | Brasa `#A90000` como ação e assinatura do lançamento; sem texto corrido longo sobre Brasa. | pp. 37–38 |
| D-03 | DECIDIDO | Símbolo “p” em duas partes, proporção 1198:1760, raio aproximado de 6% e área de respiro aproximada de 20% da largura. | pp. 31–34 |
| D-04 | PROVISÓRIO | Wordmark em Unbounded 600; tipografia Unbounded/Figtree/DM Mono até a escolha final B4. | pp. 32, 40–43 |
| D-05 | DECIDIDO | Fosco por padrão, sem sombra decorativa; campanha saturada e loja bege clean. | pp. 30–31, 44–46 |
| D-06 | EM ABERTO | Desenho final do wordmark, família tipográfica, paleta casada com filamentos, grão de interface e uso de formas geométricas explícitas. | pp. 39–43, 65–66 |
| C-01 | PROVISÓRIO | Entrada próxima de R$ 150, teto de R$ 1.000+ e degraus ilustrativos; preço final depende de custo. | pp. 5, 51, 66 |
| C-02 | EM ABERTO | Prazo prometido, garantia, devolução e percentual de royalty devem ser validados. | pp. 49, 65–66 |
| F-01 | FUTURO | Marketplace de partes e royalties para criadores independentes. | pp. 11, 16, 61, 66 |

## Escopo autorizado para a landing visual

Estas decisões vêm do pedido do usuário em 13/10/2026, não de uma aprovação industrial dos produtos.

| ID | Estado | Regra ou direção | Fonte |
|---|---|---|---|
| S-01 | DECIDIDO | Criar uma landing para apresentar três luminárias, usando a estrutura, hierarquia, minimalismo e interações da Gantri como referência, com identidade Per Parte. | Pedido do usuário; `docs/pesquisa/gantri.md` |
| S-02 | DECIDIDO | Usar capturas da extensão do Chrome como evidência visual do benchmark. Separar observação, medição e interpretação. | Pedido do usuário |
| S-03 | DECIDIDO | Interações locais de navegação e exploração; integrações comerciais e configurador ficam adiados. Não simular compra, cadastro ou envio concluído. | Pedido do usuário |
| S-04 | PROPOSTA | Marco, Duna e Farol formam a coleção visual. Marco tem nome e composição-base na revista; a representação é estudo. Duna e Farol são propostas desta etapa. | `docs/site-direcao-conteudo.md`; revista pp. 6 e 37 |
| S-05 | DECIDIDO | Usar imagens originais geradas para completar a apresentação e informar que são conceituais. Não tratá-las como fotografias de produto fabricado. | Pedido do usuário; limite editorial do protótipo |
| S-06 | DECIDIDO | Reutilizar os tokens de `packages/design-system`; manter a tipografia provisória e não copiar tokens, fontes, logotipo ou fotos da Gantri. | D-01 a D-06; fonte de marca |
| S-07 | DECIDIDO | Não inventar preço, estoque, prazo, garantia, avaliação de cliente, selo ou material certificado. | Pendências C-01/C-02 e revista |
| S-08 | DECIDIDO | Servir o protótipo estático localmente, com build independente; escolha reversível, sem fixar a stack do configurador. | ADR 0003 |
| S-09 | DECIDIDO | Adiar publicação e push; entregar a revisão local. | “Publicamos depois”, pedido do usuário |
| S-10 | DECIDIDO | Permitir teclado, menu móvel, fechamento de diálogos e redução de movimento; slideshow deve permitir pausa. | Critérios de implementação desta etapa |

## Guardas técnicas anteriores, preservadas durante o reinício

As instruções do projeto fornecidas nesta sessão chamam estas restrições de invioláveis: somente LED de até **9 W**, ao menos **25 mm** entre lâmpada e parede impressa, e nenhuma parte condutora desenhada pelo cliente. O produto não deve incluir IA sem nova decisão explícita. Antes de codificar o configurador ou produção, validar esses números e ensaios com Davi/Caio; a revista não os detalha.

## Não decidir por inferência

Stack do produto comercial e do configurador, backend, arquitetura de conta, URLs públicas, preço definitivo, percentuais, métodos de pagamento, data de lançamento, impressora e filamento final estão abertos nesta etapa. O HTML/CSS/JavaScript do protótipo local é uma decisão reversível de apresentação, não a definição de toda a arquitetura futura. A cópia fundadora da revista pede aprovação de Davi e Caio antes de publicação (p. 25).
