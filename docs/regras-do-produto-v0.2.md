# Per Parte — Regras do produto (especificação de trabalho v0.2)

*27/07/2026. Aprofunda a seção de regras do doc "Produto e regras v0.1". Cada regra tem: o limite, o valor de partida, o porquê, e **onde ela vive** — porque uma regra só funciona se tiver um lugar para ser aplicada. Os lugares são três: a **Ferramenta** (o configurador simplesmente não deixa criar fora do limite), o **Backend** (validação automática antes de ir para a fábrica) e a **Curadoria** (julgamento humano, só para o marketplace).*

*Status: ▸ proposto = para discutir · ⚑ validar = depende de dados reais da produção.*

---

## F — Fabricação

- **F1 · Volume máximo por parte** — nenhuma parte excede o volume útil da impressora. Partida: 25 × 25 × 30 cm. Luminária maior = mais partes, nunca parte maior. *Vive na Ferramenta (limite dos controles).* ⚑ validar com as impressoras reais.
- **F2 · Parede mínima estrutural** — 1,6–2,4 mm em base e corpo. Menos que isso a peça flexiona e quebra no encaixe. *Ferramenta.* ⚑
- **F3 · Parede do difusor** — 0,8–1,2 mm. É a faixa em que o PLA fica translúcido bonito; mais grosso vira opaco, mais fino fura. *Ferramenta.* ⚑
- **F4 · Balanço (overhang) ≤ 45–50°** — o gerador de formas não produz superfícies que precisem de suporte; suporte em superfície aparente arruína o acabamento. *Ferramenta (é o limite dos sliders de curva e textura).* ⚑
- **F5 · Encaixes padronizados** — folga única de 0,2–0,4 mm em todas as interfaces, definida uma vez, testada, e nunca mais tocada. *Backend (as interfaces são geradas pelo sistema, o cliente nem as vê).* ⚑
- **F6 · Sem cavidades fechadas** — toda cavidade precisa de saída para material solto. *Backend (checagem geométrica automática).* ▸
- **F7 · Peso máximo por parte** — teto de material por peça (partida: 350 g) para segurar custo e tempo de máquina. *Ferramenta (o preço em tempo real também educa isso).* ⚑
- **F8 · Orientação de impressão conhecida** — toda parte gerada já nasce com orientação de impressão definida pelo sistema (em geral, eixo de revolução na vertical). Se um dia houver formas não revolucionadas, esta regra vira um problema real de engenharia. *Backend.* ▸

## S — Segurança e elétrica

- **S1 · Só LED, potência limitada** — partida: máx. 9 W. PLA amolece a ~55–60 °C; incandescente e halógena são proibidas para sempre. *Kernel (fisicamente não há soquete para outra coisa) + termo na compra da lâmpada.* ▸
- **S2 · Distância mínima da fonte de luz** — ≥ 25 mm entre lâmpada e qualquer parede impressa. *Ferramenta (o miolo é um "volume proibido" que os sliders não conseguem invadir — já está assim no protótipo).* ⚑
- **S3 · Ventilação automática** — se a geometria fecha demais o entorno do soquete, o sistema insere respiros. *Backend.* ▸
- **S4 · Cliente nunca desenha condutor** — nenhuma parte criável toca eletricidade. Plugue (NBR 14136), cabo e soquete vêm certificados de fornecedor, montados no kernel. *Arquitetura do produto.* ▸
- **S5 · Zona quente em material apropriado** — se a parte encosta na região do soquete, o sistema a marca para impressão em PETG (ou exige distância maior em PLA). *Backend.* ⚑
- **S6 · Conformidade regulatória** — enquadramento na Portaria INMETRO 231/2026 (nova, de maio/2026) definido com consultor **antes** de fechar o kernel. *Processo, não software.* ▸ urgente.

## E — Estabilidade

- **E1 · Centro de gravidade dentro da base** — a projeção do CG cai no terço central do raio da base. *Ferramenta.* ▸
- **E2 · Base adaptativa** — se a criação fica pesada no topo, a base alarga automaticamente (em vez de bloquear o cliente com um erro). Demonstrado no protótipo. *Ferramenta.* ▸
- **E3 · Peso mínimo de base** — bases muito leves recebem inserto de peso (arruela/concreto) no kernel. *Backend + produção.* ⚑

## M — Marketplace e curadoria

- **M1 · Criar para si ≠ publicar** — para uso próprio vale tudo que a ferramenta permite; publicar exige curadoria. *Processo.* ▸
- **M2 · Publica-se luminárias E partes** — uma cúpula avulsa pode entrar no catálogo e ser usada em montagens de outros. *Produto.* ▸
- **M3 · Royalty por parte** — o royalty é da parte, não da luminária: cada peça vendida distribui frações aos criadores das partes usadas. Partes oficiais não pagam royalty. Percentual: definir na frente de negócio. *Backend.* ▸
- **M4 · Primeira impressão é o teste** — a peça só fica pública depois que o primeiro exemplar físico é impresso e aprovado (idealmente, o comprado pelo próprio criador). *Processo.* ▸
- **M5 · Curadoria leve e com prazo** — checklist objetivo (nome próprio, renders automáticos ok, sem violação de IP aparente) com resposta em X dias úteis. Sem julgamento de "gosto" — o filtro estético é o mercado. *Processo.* ▸ para discutir: vocês querem filtro estético editorial ou não?
- **M6 · Nomes e vitrine** — toda parte publicada tem nome, autor e página própria; o criador tem perfil público com suas partes e contagem de usos. *Produto.* ▸
- **M7 · Despublicação** — o criador pode despublicar a qualquer momento; luminárias já vendidas não são afetadas; reimpressão de reposição de uma peça já comprada continua permitida. *Política.* ▸

## IP — Propriedade intelectual e conteúdo

- **IP1 · Declaração de originalidade** — ao publicar, o criador declara que o design é dele e não reproduz marca, personagem ou produto de terceiro. *Termo de publicação.* ▸
- **IP2 · Takedown por denúncia** — canal de denúncia + remoção rápida em caso plausível; royalties da peça contestada ficam retidos até resolver. *Política.* ▸
- **IP3 · Licença do criador para a Per Parte** — o criador mantém a autoria e licencia fabricação e venda. Decidir: exclusiva (só a Per Parte fabrica) ou não. Recomendação inicial: **não exclusiva, mas com exclusividade do arquivo** — a Per Parte nunca entrega o STL/arquivo da peça, nem ao comprador nem ao criador (o criador tem o *design paramétrico* dentro da plataforma, não o arquivo de produção). Isso protege o negócio sem prender o criador. ▸ discutir com advogado quando formalizar.
- **IP4 · Conteúdo** — sem formas ofensivas, odiosas ou sexualmente explícitas no catálogo público; recusa editorial documentada. *Curadoria.* ▸

---

## A decisão crítica: o kernel elétrico

Duas opções, e quase tudo (regulatório, estética, logística) depende dela:

**Opção A — Soquete E27/E14 + lâmpada LED certificada de mercado.** A luminária é vendida com uma lâmpada LED comum, certificada pelo fabricante dela (ou até sem lâmpada). Prós: enquadramento regulatório mais leve (a certificação da fonte de luz é da lâmpada, não sua), reposição trivial para o cliente, fornecedores abundantes, kernel barato. Contras: o soquete E27 é volumoso e limita formas mais esculturais; a lâmpada aparente pode vazar na estética se o difusor for muito aberto.

**Opção B — Módulo LED integrado.** Prós: liberdade formal total, luz mais bem desenhada, cara de produto premium (caminho da Gantri). Contras: o produto vira "luminária LED integrada" — enquadramento cheio na Portaria 231/2026, responsabilidade de assistência técnica, engenharia térmica por conta de vocês.

**Recomendação de partida: Opção A no lançamento**, com o difusor sempre cobrindo a lâmpada (regra de geometria), e a Opção B como evolução quando houver volume que pague a certificação. **Validar com consultor de certificação antes de qualquer compra de componente.**

## Perguntas para o sócio (produção) — destravam os ⚑

1. Quais impressoras temos (modelo) e qual o volume útil real de impressão?
2. Que materiais ele já domina (PLA de qual fornecedor? PETG?) e com qual bico/altura de camada?
3. Tempo e custo médios de uma peça típica de ~200 g hoje (material + máquina + energia)?
4. Quantas horas de máquina disponíveis por dia? Quantas impressoras dá para escalar rápido?
5. Que pós-processamento ele faz (lixamento, primer)? Isso muda o acabamento que prometemos?
6. Dos designs antigos (mini esculturas), o que aprendemos sobre falhas de impressão e devoluções?

## Próximos passos naturais

1. Sócio responde as 6 perguntas → substituímos os ⚑ por valores reais (vira v1.0).
2. Consulta sobre a Portaria 231/2026 → decisão do kernel.
3. Testar o protótipo do configurador e anotar o que incomodou → refino.
4. Com produto estabilizado: benchmark Gantri/mercado, identidade de marca e números do negócio.
