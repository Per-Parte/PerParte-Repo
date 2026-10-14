# Hairline — pesquisa de fonte e adaptação ao configurador

**Data:** 14/10/2026. **Estado:** pesquisa concluída por leitura de código público; proposta de adaptação, sem escolher a stack comercial. **Escopo:** entender a linguagem de desenho, rotação e interação solicitada para o protótipo Per Parte. A skill REA foi consultada pela sessão orquestradora; por ser um repositório aberto, a investigação usa as fontes, sem instalação ou execução de binários do projeto externo.

## Identificação e evidência

Repositório: [lucasmarkes/hairline](https://github.com/lucasmarkes/hairline). O `package.json` consultado declara **@lucasmarkes/hairline 0.5.0**, ESM, React como peer opcional e licença MIT. Seus exports são o pacote, o wrapper React e os metadados; o core não é uma API pública exportada. O README atual lista 33 figuras, embora a descrição curta do GitHub ainda diga seis. [Metadados](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/package.json), [README](https://github.com/lucasmarkes/hairline).

Não foi possível obter o SHA de commit pela API GitHub neste ambiente. As referências abaixo usam `main` e podem mudar. A cópia de `skills/hairline-create/kernel.js` consultada declara o hash **sha256:3a19aa2640ba8c6c306184d05fddfbd4f3323a6ebd9217dd3cbb38e9db74991c**. Esse é o hash declarado do kernel, não do repositório. [Kernel](https://raw.githubusercontent.com/lucasmarkes/hairline/main/skills/hairline-create/kernel.js).

## O que o pacote entrega

O ponto de entrada exporta figuras específicas, como `terrain`, `turntable`, `basket` e `exploded`. Cada figura recebe um elemento de montagem e devolve `update`/`destroy`; o wrapper admite intensidade, tema, descrição acessível, leitura e reprodução automática. Não há nesses contratos catálogo de peças, parâmetros de luminária, editor dimensional, malha industrial ou geração de STL. [Ponto de entrada](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/index.ts), [contrato de montagem](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/mount.ts).

**Conclusão para a Per Parte:** as figuras prontas são exemplos e referências. A luminária precisa de geometria e estado próprios. Importar `turntable()` desenharia os blocos do exemplo, sem transformá-los automaticamente em base, corpo e difusor. A técnica interna é reaproveitável; o produto solicitado exige uma camada nova.

## Projeção 3D → SVG

`core/iso.ts` usa coordenadas de mundo com x/y no chão e z vertical. A câmera é ortográfica: azimute, seno da elevação, escala e deslocamento. Cada ponto passa por rotação no plano horizontal e projeção para duas coordenadas; não há perspectiva. Em notação própria, para azimute a e elevação e:

```text
u = escala × (x cos(a) − y sin(a)) + centroX
v = escala × ((x sin(a) + y cos(a)) sin(e) − z cos(e)) + centroY
```

A vista inicial usa azimute 45° e elevação 30°. O renderizador redesenha paths SVG a partir desses pontos; não é um SVG fixo girado por CSS. `unproj` faz a inversa sobre um plano de altura conhecida, útil para mapear o cursor ao mundo. `prism` forma a silhueta pelo fecho convexo dos anéis superior/inferior e desenha somente o trecho frontal de um anel interno como vinco. Isso favorece prismas convexos arredondados. [Fonte: iso.ts, projeção e prism](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/core/iso.ts).

**Adaptação proposta:** círculo e quadrado podem partir de anéis; triângulo pode partir de contorno com vértices arredondados. Para ondulações côncavas, furos e recortes reais, não passar toda a peça por um único fecho convexo: esse procedimento cobriria os vazios e simplificaria a forma.

## Ocultação, recortes e geometria vazada

O core declara que não faz remoção genérica de linhas ocultas. A aparência sólida vem de pintura ordenada: superfícies opacas escondem as que estão atrás. A ordenação deve mudar junto com a câmera. No exemplo Turntable, os blocos são comparados por separação de planos e sobreposição das caixas projetadas; um ordenamento topológico decide a pintura. O algoritmo tem fallback para ciclos e foi construído para aquele conjunto de blocos, não para toda geometria arbitrária. [Ordenação do Turntable](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/figures/turntable-geometry.ts).

Basket demonstra vazados como construção explícita: um aro usa contornos em sentidos opostos; fios do lado de trás vêm antes do fundo, seguidos pelos fios frontais, aro e alça. Normais transformadas separam frente/fundo. Isso fornece uma referência concreta para variações de treliça ou estrias, mas não é subtração booleana de sólidos. [Basket](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/figures/basket.ts).

Loupe recorta segmentos contra um círculo por cálculo de interseção; o resultado visível é convertido em paths. O recorte é específico da lupa, sem sistema genérico de clipping de malhas no contrato examinado. [Loupe](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/figures/loupe.ts).

**Adaptação proposta:** manter anéis/contornos, superfícies e linhas como dados geométricos. Peças empilhadas simples podem ter ordem estável; superfícies laterais devem ser separadas por frente/fundo. Qualquer furo precisa de região realmente vazia ou janela coerente com o sólido, em todas as rotações. Uma imagem com círculos desenhados por cima não comprova que a peça tem furos.

## Traço e linguagem visual

O estilo usa traço nominal de 0,9 px, `vector-effect: non-scaling-stroke`, terminais e junções arredondados. A hierarquia separa silhueta, destaque, traço comum e linha distante; as guias usam tracejado 1/3. O preenchimento opaco acompanha a cor do fundo. As cores são variáveis CSS e os seletores têm especificidade zero. [Estilos](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/core/styles.ts).

As regras autorais privilegiam cantos arredondados, poucos traços, apenas um destaque informativo e nenhuma palavra dentro da figura. Também pedem guias atrás dos sólidos, alcance limitado e pose de repouso legível. A skill externa gera uma figura isolada usando kernel fixo; ela não é um fluxo de construção de aplicativos. [Regras de desenho](https://raw.githubusercontent.com/lucasmarkes/hairline/main/skills/hairline-create/rules.md), [skill Hairline Create](https://raw.githubusercontent.com/lucasmarkes/hairline/main/skills/hairline-create/SKILL.md).

**Adaptação explícita pedida pelo usuário:** o configurador terá cotas, controles dimensionais e cores por peça. Isso amplia a gramática original. Preservar o contorno fino e a hierarquia, deixando números/cotas fora da silhueta. Usar as cores Per Parte na etapa de cores; não importar a paleta Hairline como identidade da marca. Glassmorphism pertence aos blocos da interface, sem tornar os sólidos transparentes por acidente.

## Rotação e interação

Turntable atualiza azimute e elevação da câmera a cada quadro. O deslocamento horizontal do cursor alimenta velocidade angular, com fricção; ao desacelerar, uma mola encaixa a vista no quarto de volta mais próximo. O cursor vertical ajusta a elevação entre 20° e 40°. O exemplo reage a movimentos do ponteiro sobre a área, sem exigir botão pressionado; não equivale ao gesto de arrastar solicitado. Com movimento reduzido, o giro passa a responder diretamente. [Turntable](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/figures/turntable.ts).

`stage.ts` centraliza eventos e converte posições para o viewBox 400 × 320. O ciclo compartilhado para em repouso e fora da área visível, usa `IntersectionObserver` e consulta movimento reduzido. Há desmontagem de listeners, observadores e SVG; a interação touch do exemplo libera captura, portanto também precisa de adaptação ao editor. [Stage](https://raw.githubusercontent.com/lucasmarkes/hairline/main/packages/hairline/src/core/stage.ts).

**Adaptação proposta:** iniciar giro em pointerdown sobre o palco, capturar o ponteiro e encerrar em pointerup/pointercancel. Arrastar uma cota deve modificar só aquela dimensão e impedir o gesto de câmera. Oferecer botões de vista frontal/isométrica, retorno à posição inicial e controles acessíveis equivalentes. Evitar inércia na edição de cotas. A dimensão deve ser um valor do modelo, não uma transformação de escala apenas visual.

## Contrato sugerido para a luminária

Esta seção é proposta técnica, não observação do Hairline nem homologação de fabricação.

- Três partes independentes: base, corpo e difusor, cada uma com família geométrica, variação, dimensões e cor.
- A montagem calcula a posição vertical a partir das alturas e encaixes; o modelo salvo é a fonte de todas as miniaturas e da prévia.
- Um projetor comum serve ao editor, às miniaturas e à conclusão, evitando divergência entre telas.
- Furos, vazados e ondulações alteram geometria ou contornos; cada combinação deve permanecer reconhecível ao girar.
- Guardas dimensionais limitam os controles do protótipo; os limites industriais permanecem pendentes de validação. Os parâmetros não devem ser apresentados como arquivo pronto para impressão.
- Preservar as guardas do projeto: LED até 9 W, distância mínima de 25 mm da parede impressa e nenhum condutor desenhado pelo cliente. Essas regras não tornam o renderizador um verificador térmico/elétrico.

## Matriz de estados e interações a verificar

A matriz aplica a observação OPEN 7 informada pela sessão: validação deve cobrir mudanças de estado e interações, não somente a captura inicial.

| Estado/ação | Resultado observável esperado | Verificação |
|---|---|---|
| Abrir composição | Geometria e cores salvas reaparecem | Comparar editor com miniatura e resumo |
| Trocar base/corpo/difusor ativo | Somente a parte ativa recebe seleção/cotas | Alternar todas as partes |
| Trocar família | Silhueta muda e valores ficam dentro das faixas | Círculo, quadrado e triângulo |
| Trocar variação | Furos/vazados/ondulações aparecem como propriedades distintas | Ver frente, costas e laterais |
| Arrastar palco horizontalmente | Azimute muda e ordem visual permanece coerente | Giro completo e soltura fora do palco |
| Arrastar palco verticalmente | Elevação muda em faixa limitada | Extremos sem inversão ou fuga da peça |
| Arrastar largura | Só largura da parte ativa muda | Conferir valor numérico e silhueta |
| Arrastar altura | Altura muda e partes seguintes acompanham | Conferir encaixe vertical e altura total |
| Soltar/cancelar arrasto | Gesto termina sem edição posterior involuntária | Pointerup/pointercancel/perda de captura |
| Alterar cota por teclado | Mesmo modelo produzido pelo arrasto | Setas, limites mínimo e máximo |
| Selecionar cores por parte | A alteração fica restrita à parte escolhida | Combinações contrastantes |
| Salvar e reabrir | Configuração completa persiste | Recarregar página e editar novamente |
| Movimento reduzido | Controles continuam funcionais sem animação desnecessária | Emular preferência do sistema |
| Miniatura pequena | Silhueta legível, sem cotas sobre a obra | Painel em desktop e celular |

## Licença e limites da pesquisa

A licença consultada é **MIT, copyright 2026 Lucas Marques**. Ao copiar código ou porções substanciais, preservar o aviso de copyright e a licença no material distribuído. Uma implementação própria inspirada na técnica pode registrar a referência sem alegar que usa o pacote original. [Licença](https://raw.githubusercontent.com/lucasmarkes/hairline/main/LICENSE).

Esta pesquisa verificou fontes públicas, não fez comparação visual em navegador do Hairline nem execução dos testes upstream. Não obteve commit imutável; versão e hash declarado acima documentam o recorte possível. Não avaliou precisão de fabricação, espessura de parede, difusão térmica, encaixes físicos ou exportação CAD.
