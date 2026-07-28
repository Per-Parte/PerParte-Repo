# Per Parte — Produto e regras do configurador (v0.1)

*Documento de trabalho, 27/07/2026. Base para discussão entre os sócios. Os valores numéricos marcados com **[validar]** são pontos de partida tecnicamente razoáveis para impressão FDM — quem bate o martelo é a produção, com as impressoras e materiais reais de vocês.*

---

## 1. O princípio que organiza tudo: interfaces fixas, partes livres

Toda luminária Per Parte é feita de partes que se conectam por **interfaces padronizadas** — encaixes com geometria fixa (rosca ou baioneta) que nunca mudam. A forma de cada parte é livre dentro das regras; as bordas onde ela encontra as outras partes são sempre iguais.

É o mesmo princípio do LEGO: o pino é sagrado, o resto é liberdade. As consequências práticas são grandes. O modo fácil e o modo difícil produzem partes automaticamente compatíveis entre si. Qualquer parte nova criada por um cliente amplia a combinatória do catálogo inteiro. O marketplace pode vender partes avulsas, não só luminárias completas. E a fábrica precisa dominar apenas um vocabulário pequeno de conexões, não cada produto individualmente.

Essa é a decisão de engenharia que sustenta o nome da empresa: tudo, de fato, é por parte.

## 2. Anatomia de uma luminária Per Parte

**Kernel elétrico (nunca customizável).** Um módulo padronizado, comprado ou montado com componentes certificados: soquete, fonte/driver, cabo com interruptor e plugue no padrão NBR 14136. O cliente escolhe a luminária; a elétrica é sempre a mesma. Versões previstas: K1 — abajur de mesa com fio (lançamento); K2 — recarregável/sem fio (fase 2); K3 — pendente (fase 2).

**Partes criáveis (impressas em 3D).** Em geral três a quatro por luminária:

- **Base** — sustenta o conjunto e esconde o kernel; pode receber inserto de peso.
- **Corpo/haste** — o volume principal, onde há mais liberdade de forma.
- **Difusor/cúpula** — a parte que interage com a luz; parede fina e translúcida.
- **Anéis e adornos** (opcional) — peças decorativas intermediárias.

**Material.** PLA de base vegetal como padrão (mesma escolha da Gantri: imprime bem, acabamento bonito, apelo sustentável). Nas zonas próximas ao calor do soquete, considerar PETG ou similar, que aguenta mais temperatura. **[validar]**

## 3. Os dois modos

Nomes provisórios: **Montar** (o modo fácil) e **Criar** (o modo difícil). Alternativas com mais cara de marca: Compor / Esculpir. Decidir junto com a identidade.

### Modo Montar

O cliente combina partes prontas — oficiais e de criadores — escolhendo base, corpo, difusor e cor/acabamento, com preview 3D e preço atualizando em tempo real. Não existe combinação inválida: a compatibilidade é garantida pela arquitetura de interfaces, não por uma lista de regras. A combinatória trabalha a favor: com apenas 30 partes desenhadas (10 bases, 12 corpos, 8 difusores) e 12 cores, já são mais de 11 mil luminárias diferentes — e passa de 1 milhão se cada parte puder ter cor própria.

### Modo Criar

O ponto central: **não é um CAD livre**. É criação paramétrica — o cliente esculpe dentro de controles cujos limites garantem que tudo que sair dali imprime, para em pé e não esquenta onde não deve. A regra mestra do produto é uma só: *se a ferramenta deixou criar, a Per Parte consegue fabricar.*

Três níveis progressivos de liberdade:

1. **Remix** — parte de uma peça existente e ajusta parâmetros: altura, diâmetro, curvatura do perfil, torção, afunilamento.
2. **Texturas e padrões** — aplica e edita padrões de superfície (ranhuras, ondas, facetas, tramas) controlando densidade e profundidade.
3. **Perfil próprio** — desenha a curva de perfil em 2D e o sistema gera o sólido de revolução; depois aplica texturas. Sólidos de revolução quase sempre imprimem bem e quase sempre têm cara de produto de verdade — é o caminho com melhor razão liberdade/risco.

Cada nível esconde complexidade do anterior. O cliente nunca vê uma mensagem de erro de fabricação; ele vê controles que simplesmente não vão até onde não podem.

## 4. Regras de fabricação (que viram limites dos controles)

Estas são as regras que o cliente nunca lê — elas existem como limites embutidos nos sliders e validações do configurador:

- **Volume máximo por parte:** dentro da área de impressão das máquinas de vocês (referência comum: 25 × 25 × 30 cm). Luminárias maiores = mais partes, nunca partes maiores. **[validar]**
- **Espessura mínima de parede:** ~1,6–2,4 mm em partes estruturais; ~0,8–1,2 mm em difusores (é a faixa que dá translucidez bonita em PLA). **[validar]**
- **Ângulo de balanço (overhang):** superfícies até ~45–50° imprimem sem suporte; o gerador de formas só produz geometrias dentro disso, porque suporte em superfície aparente arruína o acabamento. **[validar]**
- **Encaixes:** folga padrão de ~0,2–0,4 mm nas interfaces, definida uma vez e usada em todas as partes. **[validar]**
- **Sem cavidades fechadas** que acumulem material solto ou impeçam limpeza.
- **Peso e tempo:** cada parte tem peso máximo (custo de material) e o preço em tempo real sai da estimativa de tempo de impressão + material calculada no backend.

## 5. Regras de segurança e elétrica

- **Só LED**, com potência limitada (ex.: 6–9 W — mais que suficiente para abajur). PLA amolece a partir de ~55–60 °C, então a fonte de luz precisa ser fria e distante. **[validar]**
- **Distância mínima** entre a lâmpada e qualquer parede impressa (ex.: ≥ 25 mm), garantida por construção no gerador de formas. **[validar]**
- **Ventilação:** aberturas de respiro geradas automaticamente pelo configurador quando a geometria fecha demais o entorno do soquete.
- **Estabilidade:** teste de tombamento virtual — a projeção do centro de gravidade precisa cair no terço central da base, e a base tem diâmetro/peso mínimos proporcionais à altura. **[validar]**
- **Kernel fechado:** o cliente nunca desenha nada que conduza eletricidade. Plugue, cabo e soquete vêm certificados de fornecedor.

**Certificação — lição de casa urgente.** Saiu em maio de 2026 a **Portaria INMETRO nº 231/2026**, que atualiza as regras para lâmpadas LED e luminárias (substituindo a Portaria 69/2022), com prazo de adequação de 18 meses para fabricantes e exigências novas como divulgação de etiqueta ENCE no e-commerce. O enquadramento exato de uma luminária decorativa de mesa vendida com (ou sem) a lâmpada precisa ser verificado com um consultor de certificação **antes** de definir o kernel — a escolha entre "vender com soquete E27 e lâmpada certificada de mercado" e "vender com módulo LED integrado" muda completamente a obrigação regulatória. Essa é possivelmente a decisão técnica mais importante do início do projeto.

## 6. Regras do marketplace de criadores

**Criar para si ≠ publicar.** Para uso próprio, vale tudo que a ferramenta permite. Para entrar no catálogo público, passa por curadoria leve: a validação técnica já está garantida pela ferramenta, então a curadoria é estética e de catálogo — nome da peça, fotos (renders gerados automaticamente), e a **primeira impressão como teste**: a peça só fica à venda depois que o primeiro exemplar físico é produzido e aprovado (que pode ser justamente o exemplar comprado pelo próprio criador).

**O que se publica: luminárias e partes.** Um criador pode publicar a luminária completa ou uma parte avulsa (uma cúpula nova, por exemplo) que outros clientes passam a usar nas montagens deles.

**Royalty por parte.** Proposta: o royalty não é da luminária, é de cada parte. Se uma luminária vendida usa a cúpula do criador A e o corpo do criador B, cada um recebe sua fração; partes oficiais Per Parte não pagam royalty. O modelo de receita repete o nome da empresa — e incentiva criadores a fazer partes boas e reutilizáveis, não só produtos fechados. (O percentual fica para a frente de modelo de negócio.)

**Propriedade intelectual.** O criador declara originalidade ao publicar; é proibido reproduzir marcas, personagens e designs de terceiros; remoção por denúncia (takedown). O criador mantém a autoria e licencia a fabricação/venda para a Per Parte. Decidir: a licença é exclusiva ou o criador pode vender o design em outro lugar?

**Conteúdo.** Sem formas ofensivas, e a Per Parte reserva o direito de recusar publicação por critério editorial.

## 7. Decisões em aberto

1. Nomes definitivos dos dois modos (junto com a identidade de marca).
2. Kernel: soquete E27 com lâmpada certificada de mercado vs. módulo LED integrado — decidir após consulta sobre a Portaria 231/2026.
3. Exclusividade ou não da licença dos criadores.
4. Percentual de royalty e precificação (frente de modelo de negócio).
5. Specs reais das impressoras e materiais de vocês → substituir todos os **[validar]**.
6. Escopo do lançamento: sugestão de começar só com K1 (abajur de mesa com fio) e o modo Montar, com o modo Criar em beta fechado.

## Próximo passo sugerido

Um protótipo navegável do configurador (HTML interativo, com preview da luminária e os controles paramétricos do modo Criar) para vocês dois testarem o conceito na prática e usarem em conversas com terceiros.
