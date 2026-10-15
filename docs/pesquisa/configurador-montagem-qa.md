# QA — configurador com montagem por faces

Rodada local concluída em **15/10/2026**, em `http://127.0.0.1:4175/`, com navegador integrado ao Codex e dados criados pela própria rodada. Plano anterior à implementação em [montagem por faces](../planos/configurador-montagem-por-faces.md); contrato em [ADR 0008](../../.claude/adr/0008-configurador-montagem-por-faces.md).

## Resultado

O exemplo pedido foi montado e salvo: base cúbica mais três corpos cúbicos empilhados, todos com largura e altura de 90 mm ilustrativos, com um difusor cúbico ligado à face direita do corpo mais alto. Altura total de 360 mm. Outro difusor foi acrescentado por arrasto e removido durante a verificação.

| Verificação executada | Resultado observado |
|---|---|
| Desktop 1440 × 900 e notebook 1366 × 768 | Limites projetados da composição inteiros dentro do visor, sem overflow horizontal da página |
| Móvel 390 × 844 e 320 × 760 | Composição inteira dentro do visor e sem overflow horizontal; palco aparece antes dos controles |
| Adição por botões e seleção de face lateral | Cinco cubos na disposição pedida, com seleção independente por ID |
| Clique direto em face do SVG | Seleção do corpo superior e de sua face de cima confirmada nos controles |
| Arrasto da bandeja até uma face | Uma peça por gesto; contagem passou de cinco para seis após a correção de clique residual |
| Desfazer/refazer e remoção de folha | Contagens e medidas restauradas; peça extra removida, composição final com cinco peças |
| Giro por teclado | Setas horizontal e vertical alteraram os caminhos projetados do SVG |
| Cotas por teclado e arrasto | Largura de 90 para 91 pelo teclado e de 90 para 111 por arrasto; desfazer restaurou 90 |
| Cores e persistência | Cores individuais aplicadas, obra salva, recarregada e reaberta com cinco peças; edição preservou uma única obra |
| Pedido local | Rascunho criado com a obra salva e indicação de que ainda não foi enviado à Per Parte |
| Controles de movimento e som | Pausa e silêncio alternaram estado; emulação de movimento reduzido resultou em ausência de animação |
| Etapa Concluir | Bandeja de adição oculta |
| Console do navegador | Consulta após o fluxo integrado retornou zero avisos/erros registrados |

## Verificação automatizada

- `npm run configurador:test`: **19/19 aprovados** (14 de domínio e cinco de renderização).
- `npm run configurador:check`: aprovado, incluindo módulos, assets e tratamento de movimento reduzido.
- `npm run configurador:build`: aprovado com os fontes finais.
- Cobertura do domínio inclui migração v1/v2 de obras e cópias de pedidos, proteção de estado inválido, conexões/ciclos, ocupação, interseções, limite de peças e remoção. Geometria cobre conexões laterais, perfis, visibilidade de faces, enquadramento e cotas.
- `tests/navegador.mjs` foi atualizado para o novo esquema e teve sintaxe conferida. Esse roteiro automatizado não foi executado nesta rodada; a matriz acima foi percorrida pelas ferramentas de interação do navegador.

## Limites da evidência

As primeiras capturas foram inspecionadas durante o trabalho, inclusive após a correção das faces inferiores que atravessavam visualmente a torre. A ferramenta passou a falhar ao salvar as capturas finais; não há novos arquivos de imagem anexados a este relatório. O enquadramento também foi conferido por leitura dos retângulos DOM do visor e da composição.

O navegador disponível não suportou a simulação de eventos nativos de toque. Os tamanhos móveis foram verificados com viewport reduzido; uma rodada em aparelho físico continua recomendada. O controle de silêncio foi exercitado, mas não houve audição independente do som sintetizado.

A obra e o pedido de teste ficam somente no armazenamento local da origem utilizada. Não houve envio, compra, publicação do configurador ou validação de fabricação. Limites dimensionais, conexões e colisões continuam exploratórios.
