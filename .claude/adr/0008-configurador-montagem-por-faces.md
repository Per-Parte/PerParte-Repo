# ADR 0008 — Composição de peças por faces

- **Data:** 14/10/2026.
- **Estado:** experiência **DECIDIDA** pelo pedido do usuário; implementação geométrica **PROVISÓRIA**.
- **Amplia:** ADR 0004, preservando o configurador local e o SVG autoral.

## Contexto e decisão

O usuário pediu enquadramento responsivo, vários objetos no corpo e vários difusores. Descreveu quatro cubos iguais empilhados — uma base e três corpos — e um quinto cubo difusor na face lateral do último corpo. Pediu seleção direta de faces, peças arrastáveis, som de encaixe e visualização flutuante girável.

Representar a obra como uma lista de peças com IDs estáveis e conexões entre pai e face. Base única, corpos/difusores repetíveis e seis direções de conexão. Nesta implementação, as peças compartilham os eixos espaciais, cada face admite uma conexão e a face própria oposta é implícita. A profundidade deriva da largura; quadrado com altura igual à largura forma um cubo. Deslocamentos sobre uma mesma face e rotação individual não fazem parte desta etapa.

O palco calcula o enquadramento a partir dos limites projetados da composição e do espaço disponível. A pessoa pode orbitar horizontal e verticalmente, selecionar uma face e encaixar por arrasto ou controles acessíveis. Flutuação e som são retornos de interface, com controles de pausa/silêncio e respeito à redução de movimento.

O esquema de armazenamento evolui para versão 2, mantendo a chave local existente para encontrar as criações anteriores. Leitura de v1 converte modelos e cópias de pedidos em memória; nenhuma migração autoriza sobrescrever dados inválidos. Salvar continua uma ação explícita da pessoa.

## Limites e consequências

- Limite técnico de 24 peças por obra e remoção de folhas preservam conectividade e desempenho da prévia.
- Ocupação de faces e interseções de envelopes são regras geométricas exploratórias; não validam encaixes físicos, estabilidade ou engenharia elétrica.
- Presets e obras v1 devem conservar medidas, formas, cores, identidade e datas. Pedidos continuam cópias independentes e rascunhos locais.
- A versão anterior do aplicativo não deve gravar sobre dados v2; manter validação de versão desconhecida.
- Não há arquivo fabril, envio, login ou sincronização nesta decisão. Preservam-se LED até 9 W, distância mínima de 25 mm e ausência de condutores desenhados pelo cliente como guardas para engenharia futura.

Plano e critérios de aceite em `docs/planos/configurador-montagem-por-faces.md`. Resultados efetivamente verificados no topo de `.claude/state.md`.
