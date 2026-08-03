# Per Parte — Documento mestre do projeto

*Versão consolidada, 03/08/2026. Reúne tudo que foi discutido e decidido até aqui sobre produto, regras e forma de trabalho. É o documento de entrada: quem ler só este entende o projeto inteiro. Substitui os rascunhos anteriores (briefing, produto v0.1, regras v0.2), que ficam como histórico.*

*Convenções de status: **▸ proposto** = decidido em tese, aberto a discussão. **⚑ validar** = depende de dado real da produção. **✗ em aberto** = ninguém decidiu ainda.*

---

## 1. O que é a Per Parte

A empresa já existe juridicamente. Foi criada pelo sócio fundador para vender peças impressas em 3D — mini esculturas voltadas ao público do mercado financeiro. Com a entrada do Caio, os dois decidiram fazer um rebranding completo e mudar o posicionamento: a Per Parte passa a ser uma plataforma onde o cliente monta a própria luminária e a empresa fabrica sob demanda a peça que ele montou.

A referência de mercado é a Gantri, americana, que imprime luminárias em 3D sob demanda e paga royalties a designers. A diferença que a Per Parte propõe está em quem cria: na Gantri, designers convidados desenham produtos fechados; aqui, qualquer cliente compõe a sua luminária, e os clientes que quiserem podem publicar as peças que criaram e ganhar royalties quando outras pessoas as usarem.

O nome vem de "por parte" — personalizar a parte. E ele não é só nome: a identidade de marca deve trabalhar a ideia de tudo em partes, no site, no Instagram, na caixa de encomenda. Ora parece que está sobrando algo, ora parece que está faltando. Incompletude e modularidade propositais.

## 2. O princípio que organiza tudo: interfaces fixas, partes livres

Toda luminária Per Parte é feita de partes que se conectam por interfaces padronizadas — encaixes de geometria fixa que nunca mudam. A forma de cada parte é livre dentro das regras; as bordas onde ela encontra as outras são sempre iguais.

É o princípio do LEGO: o pino é sagrado, o resto é liberdade. As consequências práticas são grandes. Peças criadas no modo fácil e no modo difícil são automaticamente compatíveis entre si. Qualquer parte nova criada por um cliente amplia a combinatória do catálogo inteiro. O marketplace pode vender partes avulsas, não só luminárias completas. E a fábrica precisa dominar um vocabulário pequeno de conexões, não cada produto individualmente.

Dessa decisão de engenharia decorre a regra mestra do produto, que vale para tudo o que for construído daqui em diante: **se a ferramenta deixou criar, a Per Parte consegue fabricar.** O cliente nunca vê uma mensagem de erro de fabricação. Ele vê controles que simplesmente não vão até onde não podem.

## 3. Anatomia de uma luminária

**O kernel elétrico** é a parte que o cliente nunca customiza: um módulo padronizado com componentes certificados — soquete, cabo com interruptor e plugue no padrão NBR 14136. O cliente escolhe a luminária; a elétrica é sempre a mesma. A evolução prevista é K1, abajur de mesa com fio, no lançamento; K2, recarregável sem fio, e K3, pendente, numa segunda fase.

**As partes criáveis**, impressas em 3D, são três ou quatro por luminária. A base sustenta o conjunto, esconde o kernel e pode receber inserto de peso. O corpo ou haste é o volume principal, onde há mais liberdade de forma. O difusor ou cúpula é a parte que interage com a luz, de parede fina e translúcida. Anéis e adornos intermediários são opcionais.

**O material padrão é PLA de base vegetal** — mesma escolha da Gantri: imprime bem, tem bom acabamento e apelo sustentável. Nas zonas próximas ao calor do soquete, considerar PETG ou similar, que aguenta mais temperatura. ⚑

## 4. Os dois modos

Os nomes provisórios são **Montar** (o modo fácil) e **Criar** (o modo difícil); alternativas com mais cara de marca seriam Compor e Esculpir. A decisão fica junto com a identidade. ✗

No **modo Montar**, o cliente combina partes prontas — oficiais e de criadores — escolhendo base, corpo, difusor e cor, com preview 3D e preço atualizando em tempo real. Não existe combinação inválida, porque a compatibilidade é garantida pela arquitetura de interfaces e não por uma lista de regras. A combinatória trabalha a favor: com 30 partes desenhadas (10 bases, 12 corpos, 8 difusores) e 12 cores já são mais de 11 mil luminárias diferentes, e passa de 1 milhão se cada parte puder ter cor própria.

O **modo Criar** é o coração do produto, e o ponto mais importante a entender sobre ele é o que ele não é: não é um CAD livre. É criação paramétrica, em que o cliente esculpe dentro de controles cujos limites garantem que tudo que sair dali imprime, para em pé e não esquenta onde não deve. São três níveis progressivos de liberdade. No primeiro, **remix**, o cliente parte de uma peça existente e ajusta parâmetros: altura, diâmetro, curvatura, torção, afunilamento. No segundo, **texturas e padrões**, aplica ranhuras, ondas, facetas e tramas controlando densidade e profundidade. No terceiro, **perfil próprio**, desenha a curva de perfil em 2D e o sistema gera o sólido de revolução, ao qual as texturas são aplicadas depois. Sólidos de revolução quase sempre imprimem bem e quase sempre têm cara de produto de verdade — é o caminho com a melhor razão entre liberdade e risco.

## 5. As regras

Cada regra abaixo tem um limite, um valor de partida e, principalmente, **um lugar onde é aplicada** — porque regra sem lugar de aplicação é só intenção. Os lugares são três: a **Ferramenta** (o configurador não deixa criar fora do limite), o **Backend** (validação automática antes de ir para a fábrica) e a **Curadoria** (julgamento humano, só no marketplace).

### F — Fabricação

- **F1 · Volume máximo por parte.** Nenhuma parte excede o volume útil da impressora. Partida: 25 × 25 × 30 cm. Luminária maior significa mais partes, nunca parte maior. *Ferramenta.* ⚑
- **F2 · Parede mínima estrutural.** De 1,6 a 2,4 mm em base e corpo. Menos que isso a peça flexiona e quebra no encaixe. *Ferramenta.* ⚑
- **F3 · Parede do difusor.** De 0,8 a 1,2 mm — a faixa em que o PLA fica translúcido bonito. Mais grosso vira opaco, mais fino fura. *Ferramenta.* ⚑
- **F4 · Balanço (overhang) até 45–50°.** O gerador de formas não produz superfícies que precisem de suporte, porque suporte em superfície aparente arruína o acabamento. *Ferramenta — é o limite dos sliders de curva e textura.* ⚑
- **F5 · Encaixes padronizados.** Folga única de 0,2 a 0,4 mm em todas as interfaces, definida uma vez, testada, e nunca mais tocada. *Backend — as interfaces são geradas pelo sistema; o cliente nem as vê.* ⚑
- **F6 · Sem cavidades fechadas.** Toda cavidade precisa de saída para material solto. *Backend, checagem geométrica automática.* ▸
- **F7 · Peso máximo por parte.** Teto de material por peça, partida em 350 g, para segurar custo e tempo de máquina. *Ferramenta — o preço em tempo real também educa isso.* ⚑
- **F8 · Orientação de impressão conhecida.** Toda parte nasce com orientação definida pelo sistema, em geral com o eixo de revolução na vertical. Se um dia houver formas não revolucionadas, esta regra vira um problema real de engenharia. *Backend.* ▸

### S — Segurança e elétrica

- **S1 · Só LED, potência limitada.** Partida: máximo 9 W. O PLA amolece por volta de 55–60 °C; incandescente e halógena são proibidas para sempre. *Kernel — fisicamente não há soquete para outra coisa — mais termo na compra da lâmpada.* ▸
- **S2 · Distância mínima da fonte de luz.** Ao menos 25 mm entre lâmpada e qualquer parede impressa. *Ferramenta — o miolo é um volume proibido que os sliders não conseguem invadir; já está assim no protótipo.* ⚑
- **S3 · Ventilação automática.** Se a geometria fecha demais o entorno do soquete, o sistema insere respiros. *Backend.* ▸
- **S4 · O cliente nunca desenha condutor.** Nenhuma parte criável toca eletricidade. Plugue, cabo e soquete vêm certificados de fornecedor, montados no kernel. *Arquitetura do produto.* ▸
- **S5 · Zona quente em material apropriado.** Se a parte encosta na região do soquete, o sistema a marca para impressão em PETG, ou exige distância maior em PLA. *Backend.* ⚑
- **S6 · Conformidade regulatória.** Enquadramento na Portaria INMETRO 231/2026 definido com consultor antes de fechar o kernel. *Processo, não software.* ▸ **urgente**

### E — Estabilidade

- **E1 · Centro de gravidade dentro da base.** A projeção do CG cai no terço central do raio da base. *Ferramenta.* ▸
- **E2 · Base adaptativa.** Se a criação fica pesada no topo, a base alarga automaticamente, em vez de bloquear o cliente com um erro. Já demonstrado no protótipo. *Ferramenta.* ▸
- **E3 · Peso mínimo de base.** Bases muito leves recebem inserto de peso — arruela ou concreto — no kernel. *Backend e produção.* ⚑

### M — Marketplace e curadoria

- **M1 · Criar para si não é publicar.** Para uso próprio vale tudo que a ferramenta permite; publicar exige curadoria. *Processo.* ▸
- **M2 · Publicam-se luminárias e partes.** Uma cúpula avulsa pode entrar no catálogo e ser usada nas montagens de outras pessoas. *Produto.* ▸
- **M3 · Royalty por parte.** O royalty é da parte, não da luminária: cada peça vendida distribui frações aos criadores das partes usadas. Partes oficiais não pagam royalty. O modelo de receita repete o nome da empresa e incentiva criadores a fazer partes boas e reutilizáveis, não só produtos fechados. Percentual a definir. *Backend.* ▸
- **M4 · A primeira impressão é o teste.** A peça só fica pública depois que o primeiro exemplar físico é impresso e aprovado — idealmente o comprado pelo próprio criador. *Processo.* ▸
- **M5 · Curadoria leve e com prazo.** Checklist objetivo (nome próprio, renders automáticos em ordem, sem violação aparente de IP) com resposta em prazo definido. A proposta é não julgar gosto — o filtro estético é o mercado. Ponto a discutir entre os sócios: vocês querem ou não um filtro editorial de estética? ✗
- **M6 · Nomes e vitrine.** Toda parte publicada tem nome, autor e página própria; o criador tem perfil público com suas partes e a contagem de usos. *Produto.* ▸
- **M7 · Despublicação.** O criador pode despublicar quando quiser; luminárias já vendidas não são afetadas, e a reimpressão de reposição de uma peça já comprada continua permitida. *Política.* ▸

### IP — Propriedade intelectual e conteúdo

- **IP1 · Declaração de originalidade.** Ao publicar, o criador declara que o design é dele e não reproduz marca, personagem ou produto de terceiro. *Termo de publicação.* ▸
- **IP2 · Takedown por denúncia.** Canal de denúncia e remoção rápida em caso plausível; royalties da peça contestada ficam retidos até a resolução. *Política.* ▸
- **IP3 · Licença do criador para a Per Parte.** O criador mantém a autoria e licencia fabricação e venda. A recomendação é licença **não exclusiva, mas com exclusividade do arquivo**: a Per Parte nunca entrega o STL nem qualquer arquivo de produção, nem ao comprador nem ao criador — o criador tem o design paramétrico dentro da plataforma, não o arquivo. Isso protege o negócio sem prender o criador. Confirmar com advogado na formalização. ✗
- **IP4 · Conteúdo.** Sem formas ofensivas, odiosas ou sexualmente explícitas no catálogo público; recusa editorial documentada. *Curadoria.* ▸

## 6. A decisão crítica: o kernel elétrico

Quase tudo — regulatório, estética, logística, custo — depende desta escolha, e por isso ela é provavelmente a decisão técnica mais importante do início do projeto.

A **opção A é soquete E27 ou E14 com lâmpada LED certificada de mercado**. A luminária é vendida com uma lâmpada comum, certificada pelo fabricante dela, ou até sem lâmpada. O enquadramento regulatório fica mais leve, porque a certificação da fonte de luz é da lâmpada e não sua; a reposição é trivial para o cliente; os fornecedores são abundantes e o kernel é barato. Em contrapartida, o soquete E27 é volumoso e limita formas mais esculturais, e a lâmpada aparente pode comprometer a estética se o difusor for muito aberto.

A **opção B é módulo LED integrado**. Dá liberdade formal total, luz mais bem desenhada e cara de produto premium — é o caminho da Gantri. O custo é que o produto passa a ser uma luminária LED integrada, com enquadramento cheio na Portaria 231/2026, responsabilidade de assistência técnica e engenharia térmica por conta de vocês.

**Recomendação: opção A no lançamento**, com o difusor sempre cobrindo a lâmpada por regra de geometria, deixando a opção B como evolução quando houver volume que pague a certificação. Nada disso se decide sem antes falar com um consultor de certificação.

**O contexto regulatório**, que torna isso urgente: em maio de 2026 saiu a Portaria INMETRO nº 231/2026, que atualiza as regras para lâmpadas LED e luminárias, substituindo a Portaria 69/2022, com prazo de adequação de 18 meses e exigências novas como a divulgação da etiqueta ENCE no e-commerce. O enquadramento exato de uma luminária decorativa de mesa vendida com ou sem lâmpada precisa ser verificado com consultor **antes de qualquer compra de componente**.

## 7. O que ainda está em aberto

Os nomes definitivos dos dois modos, a decidir junto com a identidade de marca. A escolha do kernel, que depende da consulta regulatória. A exclusividade ou não da licença dos criadores. O percentual de royalty e a política de preços, que pertencem à frente de modelo de negócio. Os valores reais de impressora e material, que substituem todos os ⚑. E o escopo do lançamento — a sugestão é começar apenas com o K1, abajur de mesa com fio, e o modo Montar, deixando o modo Criar em beta fechado.

## 8. Perguntas para a produção

Estas seis respostas do sócio transformam os valores provisórios em regras reais e fazem a especificação virar v1.0:

1. Quais impressoras temos, de que modelo, e qual o volume útil real de impressão?
2. Que materiais já dominamos — PLA de qual fornecedor, PETG? — e com qual bico e altura de camada?
3. Qual o tempo e o custo médios de uma peça típica de cerca de 200 g hoje, somando material, máquina e energia?
4. Quantas horas de máquina temos disponíveis por dia, e quantas impressoras dá para escalar rápido?
5. Que pós-processamento é feito — lixamento, primer? Isso muda o acabamento que podemos prometer?
6. O que os designs antigos, das mini esculturas, ensinaram sobre falhas de impressão e devoluções?

## 9. O protótipo

Existe um protótipo navegável do configurador: um arquivo HTML único, sem dependências, com renderizador 3D próprio em canvas. Ele demonstra na prática os dois modos, os encaixes fixos, os sliders com limites de fabricação embutidos, a base que se alarga sozinha quando o topo fica pesado, o preço calculado por estimativa de material e o fluxo de publicação no marketplace.

Ele serve para três coisas: os sócios testarem o conceito com a mão, mostrarem a ideia a terceiros e servirem de base para a versão real. A stack definitiva ainda não está escolhida — o protótipo é deliberadamente vanilla para não ancorar essa decisão.

## 10. Como trabalhamos

A Per Parte tem uma organização no Claude, no plano Team premium, com os dois sócios. Este documento e os demais vivem no projeto compartilhado da organização, que é a memória comum do negócio: o que estiver aqui, o Claude de qualquer um dos dois enxerga.

Cada sócio trabalha no seu computador, com o Claude Code dentro do VS Code, sobre uma cópia local da pasta do projeto. A recomendação é que essa pasta seja um repositório Git privado no GitHub, que é o que permite os dois mexerem no mesmo código sem se atropelar: cada um trabalha na sua máquina e o Git costura as versões. A pasta contém os documentos em markdown, o protótipo e, no futuro, o código da plataforma; um arquivo `CLAUDE.md` na raiz dá ao Claude Code o contexto do projeto automaticamente, sem ninguém precisar reexplicar nada a cada sessão.

As contas pessoais de cada sócio permanecem separadas da organização, para que trabalho de outras empresas não se misture ao da Per Parte.

## 11. Próximos passos

O primeiro é o sócio responder as seis perguntas de produção, o que fecha a especificação em v1.0. Em paralelo, a consulta sobre a Portaria 231/2026 destrava a decisão do kernel — e ela é bloqueante para comprar componentes. O terceiro é os dois testarem o protótipo e anotarem o que incomodou, para refinar o produto antes de escrever código de verdade.

Com o produto estabilizado, abrem-se as frentes seguintes: benchmark da Gantri e do mercado brasileiro, identidade de marca (que carrega o conceito de partes) e os números do negócio — precificação, custo por peça, percentual de royalty e projeção.

---

## Anexo — texto sugerido para "Instruções da organização"

*Cole no campo Instruções da organização, nas configurações do Claude. Ele passa a valer para todas as conversas dos dois sócios.*

> A Per Parte é uma empresa brasileira de luminárias impressas em 3D e fabricadas sob demanda. O cliente monta ou cria a própria luminária num configurador web, e um marketplace permite que criadores publiquem partes e recebam royalties por parte usada. Referência de mercado: Gantri. Sócios: Caio e o sócio fundador, responsável pela produção.
>
> O princípio de engenharia que organiza o produto é "interfaces fixas, partes livres": as peças se conectam por encaixes padronizados que nunca mudam, e a forma de cada parte é livre dentro das regras. Daí decorre a regra mestra: se a ferramenta deixou criar, a Per Parte consegue fabricar — o cliente nunca vê erro de fabricação, apenas controles que não vão até onde não podem.
>
> Ao trabalhar neste projeto: escreva em português do Brasil. Trate a especificação de regras do projeto como fonte de verdade, e não invente valores técnicos novos sem marcá-los explicitamente como proposta a validar com a produção. As regras de segurança elétrica são invioláveis em qualquer proposta: apenas LED de até 9 W, no mínimo 25 mm entre lâmpada e qualquer parede impressa, e o cliente nunca desenha nada que conduza eletricidade. No modo de criação, a geometria é sempre paramétrica, nunca CAD livre; limites de fabricação viram limites de controle, não mensagens de erro. Não trate como decididas as questões ainda em aberto: kernel elétrico com soquete E27 versus LED integrado, percentual de royalty, nomes definitivos dos modos e exclusividade da licença de criadores.
