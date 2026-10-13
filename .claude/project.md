# Per Parte — visão do projeto

**Fonte primária:** Revista de Marca, edição 01, 12/10/2026, em `docs/fonte/Per-Parte-Revista-de-Marca.pdf`. Esta síntese é operacional; em caso de conflito, consulte o PDF. **Última atualização:** 13/10/2026.

## O que é

A Per Parte vende autoria por meio de luminárias de mesa impressas em 3D sob demanda. A pessoa cria sua obra parte por parte no configurador, a Per Parte fabrica depois e entrega com certificado de autoria. Visão: **“A era do criar.”** Assinatura: **“Criado por você, feito por partes.”** (pp. 4–6, 10–11, 28).

O diferencial diante da Gantri é quem cria: na Gantri, o designer cria e a pessoa escolhe; na Per Parte, a criação da obra é da pessoa que vai viver com ela. Criadores independentes poderão publicar partes e receber royalties no marketplace futuro. A marca é premium acessível, vibrante e lúdica com rigor, com acabamento industrial preciso (pp. 13–15).

## Público

1. **Decorador(a) criativo(a), 20–30 anos**: quer uma peça única sem aprender modelagem 3D. Persona prioritária; nome e profissão ainda em aberto.
2. **Criador(a) independente**: quer publicar partes, ter vitrine e ganhar royalties.
3. **Presenteador(a) afetivo(a)**: quer criar uma peça com significado para outra pessoa (pp. 16–18).

## Produto e experiência

Escopo inicial: luminária de mesa. Modos **Montar** (encaixar partes prontas) e **Inventar** (dar forma a partir de bases). A experiência deve levar um novato a criar algo bonito na primeira visita, com controles que respeitem a fabricação e com prévia equivalente ao arquivo de produção. O preço acompanha escolhas, mas valores finais dependem do custo real (pp. 8, 50–52).

## Marca

A constante visual é a **Luz Acesa** `#F6E7C4`; Brasa `#A90000` é a assinatura do lançamento. Cores entram por famílias. O símbolo é um “p” em duas partes; o desenho final do wordmark e a tipografia seguem provisórios. Fotografia tem território de campanha saturado e loja bege clean, ambos com a obra acesa (pp. 30–46). Ver `docs/design-system.md`.

## Limites desta etapa

O monorepo separa `apps/site`, `apps/configurador`, `apps/quadro` e `packages/design-system`. O site é um protótipo visual de landing em HTML, CSS e JavaScript, servido localmente por Node, para apresentar três composições. O configurador continua vazio; sua stack permanece em aberto. O quadro reúne documentos e notas locais, sem sincronização entre pessoas, e não substitui a revista nem os documentos oficiais.

### Landing em revisão

A página usa a estrutura editorial e os comportamentos observados na Gantri por capturas da extensão do Chrome, adaptados à identidade Per Parte: fotografia ampla, navegação sobre o destaque, títulos com respiro, botões arredondados, coleção, ambientes, processo e manifesto. Cores e tipografia vêm do design system compartilhado; a tipografia continua **PROVISÓRIA**.

As três luminárias são **Marco**, cujo nome e composição-base aparecem na revista, e **Duna** e **Farol**, nomes e desenhos em **PROPOSTA**. Todas as imagens geradas são estudos conceituais; não comprovam fabricação nem homologação. A direção editorial e a origem das afirmações ficam em `docs/site-direcao-conteudo.md`.

Slideshow, seleção de ambientes, acordeão, detalhes de produto, busca e favoritos funcionam apenas na interface local. Não há preços inventados, checkout, conta, envio de cadastro, integração comercial ou configurador conectado. A geração de imagens faz parte da criação dos assets do protótipo; não adiciona IA ao produto. A revisão é local e a publicação foi adiada pelo usuário: “Publicamos depois”.

O recomeço está em `.claude/adr/0001-reinicio-e-fonte-mestre.md`, o quadro em `.claude/adr/0002-quadro-local.md` e a escolha reversível do site estático em `.claude/adr/0003-site-visual-estatico.md`. A pesquisa Gantri informa a composição, sem substituir as decisões da revista nem fixar a stack do futuro produto comercial.
