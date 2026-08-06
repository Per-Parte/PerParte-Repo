# Montagem v2 — modo blocos (decisão definitiva Per Parte, 05-08-2026)

> **Origem**: nota "Prompt VS Code — Montagem v2, modo blocos (05-08-2026)" do cofre Obsidian — decisão alinhada entre Davi e Caio. Copiada para o repo para ser a fonte de verdade da frente `montagem-v2`. Estado da execução: `docs/montagem-v2-handoff.md`.

Você vai refazer o sistema de montagem de luminárias do configurador (`apps/web` + `packages/nucleo`). Esta é uma decisão alinhada entre os dois sócios. O trabalho é grande — por isso o rollout é **faseado e reversível** (regras na seção 0). Nada do que está no ar pode quebrar durante a construção.

## 0. Segurança do rollout (obrigatório, antes de qualquer código)

1. **Branch dedicada** `montagem-v2`; commits pequenos; a Vercel gera preview por branch — `main` e o site publicado ficam intocados até o aceite final.
2. **Rota paralela**: o sistema novo nasce em `/criar` (ou `/configurador?v2=1`), com o configurador atual continuando 100% funcional na rota atual. Nenhum arquivo do fluxo atual é deletado nesta fase.
3. **Links antigos nunca quebram**: o `?c=` atual (schema v1) continua abrindo no motor atual. O sistema novo serializa com `v: 2` e schema próprio. Migração de v1→v2 NÃO faz parte deste escopo.
4. **O núcleo cresce, não muda**: módulo novo `packages/nucleo/src/blocos/` com testes próprios. Os invariantes existentes (malha estanque, F2/F4, clamps, física E1–E3) são REUTILIZADOS, não reescritos. `npm test` verde o tempo todo — os testes atuais não podem regredir.
5. **Convergência**: antes de codar, procure no repo trabalho recente de blocos/alças/snap/ancoragem (frente "Ferramentas do Criar" — commits recentes). Se existir, **integre e estenda; não duplique**. Se houver conflito de abordagem, pare e liste as diferenças em vez de escolher sozinho.
6. **Princípio inviolável herdado**: *limites de fabricação viram limites de slider/snap, nunca mensagens de erro*. E o invariante de ancoragem: **peça flutuando é estado impossível, não proibido** — o sistema não permite criar o estado inválido.

## 1. O sistema em uma frase

O usuário monta a luminária **empilhando e encostando formas**: 4 formas-base — **Esfera, Quadrado (cubo), Cilindro, Pirâmide** — cada uma com variações (oca/sólida, furos ○ △ □ em quantidades diferentes, esticada/achatada, alargada/afinada), mais um **ponto de luz** padronizado; toda forma na cena está sempre **tangenciando** outra (nada flutua), e o resultado é uma obra fabricável.

## 2. Layout (seguir o wireframe de referência e suas proporções)

Referência: wireframe do Davi (estrela ao centro = luminária; retângulos = áreas de UI).

- **Centro**: viewport 3D com a obra **centralizada e fixa** (câmera orbita; a obra não sai do centro).
- **Esquerda** (barra vertical estreita): **4 ferramentas**, nesta ordem: a. **Selecionar** · b. **Tamanho** · c. **Mover** · d. **Rotacionar**
- **Base central** (barra horizontal): **as 4 formas + o Ponto de luz**: Quadrado · Esfera · Cilindro · Pirâmide · 💡 Ponto de luz.
- **Direita** (painel alto): painel de conteúdo variável — ora **grade de variações**, ora **propriedades da forma selecionada** (regras na seção 4). Grade em **3 colunas**, com scroll quando precisar.

## 3. As ferramentas (para gente comum, não técnicos)

Público: pessoas comuns, de idades variadas, sem experiência com 3D. Portanto:

- **Ícones universais + rótulo em texto embaixo** (nunca ícone sozinho): Selecionar = cursor/seta · Tamanho = quadrado com setas para fora · Mover = cruz de setas · Rotacionar = seta circular. Área de toque generosa (≥ 44 px), tooltip em português na primeira visita.
- **Selecionar**: clicar numa forma da cena a seleciona (contorno destacado + painel direito mostra as propriedades dela). Clicar no vazio desseleciona.
- **Tamanho**: alças de escala na forma selecionada (uniforme ao arrastar o canto; os eixos individuais equivalem aos sliders esticar/achatar/alargar/afinar).
- **Mover**: arrasta a forma selecionada **deslizando sobre a superfície das outras** — o snap de tangência (seção 5) é o trilho; não existe mover para o vazio.
- **Rotacionar**: gira a forma selecionada em torno do ponto/face de contato, mantendo a tangência.
- **Lixeira**: visível quando há forma selecionada; apaga a forma (com as que dependiam dela re-ancoradas ou apagadas junto — comportamento: avisar e re-ancorar o que der, apagar órfãos com undo disponível).
- **Desfazer/refazer** (essencial para este público): botão + `Ctrl/Cmd+Z`.
- Estado vazio da cena: instrução curta e convidativa ("Toque numa forma para começar").

## 4. Formas, variações e o painel direito (a coreografia)

1. **Clicar numa forma da barra** (ex.: Cilindro) → painel direito vira **grade de variações** daquela forma (3 colunas, miniaturas renderizadas, nome curto embaixo; scroll se passar da altura). **A primeira variação é sempre a forma pura.**
2. **Clicar numa variação** → a forma entra na cena, **tangenciando o topo da forma mais alta existente** (primeira forma da cena: assenta no chão/plano de base) → ela **já entra selecionada** → painel direito troca para **propriedades**.
3. **Painel de propriedades** (sliders com valor visível, todos com clamps de fabricação): Tamanho geral · Esticar/achatar (altura) · Alargar/afinar (largura/profundidade) · Oca ↔ sólida (toggle) + espessura da parede quando oca (piso = parede mínima imprimível F2) · Furos: forma (○/△/□), quantidade (0–N), tamanho (clamps garantem parede remanescente e estanqueidade) · Cor (uma cor por forma — cada forma imprime separada, é de graça na produção)
4. **Clicar em outra forma da barra** a qualquer momento → painel volta para a grade de variações daquela forma. Clicar numa forma da cena (com Selecionar) → painel volta para propriedades daquela.

**Variações iniciais "seguras" por forma** (miniaturas geradas pelo próprio motor; começar com estas 8 por forma): pura · oca (borda aberta em cima) · furos ○ poucos (3–5) · furos ○ muitos (grade) · furos □ · furos △ · achatada (≈50% altura) · esticada (≈150% altura). Novas variações entram depois — a grade é alimentada por catálogo, não hardcode.

## 5. Snap de tangência (o coração do sistema)

- **Invariante A1 — ancoragem**: toda forma tem pelo menos um contato de tangência com outra forma (ou com o plano de base, no caso da primeira). O estado "flutuando" é **inconstruível**: mover/rotacionar deslizam a peça pela superfície de contato; soltar fora de contato faz a peça assentar no ponto válido mais próximo (animação curta de "imã").
- Feedback visual do contato: realce sutil no ponto/região de tangência durante o arrasto.
- **Física herdada**: a escada de estabilidade existente do núcleo (CG → base alarga → contrapeso → aviso honesto) roda sobre a composição de blocos. Composição que tombaria segue o mesmo comportamento honesto de hoje.
- **Fabricação**: cada forma vira um STL estanque próprio (malha paramétrica por primitivo — furos e ocos gerados proceduralmente por forma, sem CSG global nesta fase). Overhangs respeitam F4 nos clamps dos sliders. ⚑ A fixação física entre formas tangentes (pino, cola, encaixe) é decisão de produção em aberto — **não bloqueia esta fase**; registrar no código como TODO comentado.

## 6. Ponto de luz

- Item fixo na barra de formas. **Clicar → adiciona automaticamente tangenciando a forma mais alta da cena.**
- Geometria fixa nesta fase: **base quadrada 5 × 5 cm com bulbo de 4 cm de altura** colado sobre ela (é a peça que abrigará o soquete; um único tamanho por enquanto).
- O bulbo acende (emissivo quente 2700K, `#F6E7C4`) e ilumina a cena — a poça de luz aparece no chão do estúdio.
- Ao menos 1 ponto de luz por obra para concluir; máximo nesta fase: 2 (clamp, não erro).

## 7. O que preservar do configurador atual

- Cena/ambiente (estúdio e cenários), card de **preço evolutivo** (recalculado por soma das formas: material + tempo estimado por volume ⚑ premissas atuais), **salvar/obras** e link compartilhável (schema v2), export STL por forma.
- Tema visual atual da rota atual — a rota nova pode nascer já no visual claro se for barato, mas **função vem antes de estética** nesta fase.

## 8. Critérios de aceite

- [ ] Fluxo completo sem instrução: adicionar 3 formas variadas + ponto de luz, ajustar sliders, mover/rotacionar com snap, apagar uma forma, desfazer, salvar e reabrir pelo link — **testado por alguém que nunca viu a tela**.
- [ ] Impossível criar peça flutuante por qualquer caminho (mover, rotacionar, apagar âncora, redimensionar vizinha).
- [ ] Todos os sliders com clamps — zero mensagens de erro de fabricação.
- [ ] STL de cada forma: estanque, mm, eixo de impressão correto (verificar com os utilitários de teste existentes do núcleo).
- [ ] Links v1 antigos continuam abrindo o configurador atual; links v2 abrem a montagem nova.
- [ ] `npm test` verde: suíte antiga intacta + testes novos do módulo blocos (tangência, ancoragem, estanqueidade com furos, clamps).
- [ ] 60 fps em máquina comum com ~10 formas na cena.
- [ ] Funciona em touch (tablet) — o público não é só desktop.

## 9. Fases de entrega (commits/PRs separados)

1. **F1 — Núcleo blocos**: primitivos paramétricos (4 formas + variações + furos + oco), malhas estanques, testes.
2. **F2 — Cena e ancoragem**: adicionar/selecionar/apagar, snap de tangência, empilhamento automático, undo.
3. **F3 — UI completa**: layout do wireframe (barras + painel 3 colunas ↔ propriedades), ícones+rótulos, ponto de luz.
4. **F4 — Persistência e preço**: schema v2 no `?c=`, salvar, preço por soma, STLs por forma.
5. **F5 — Polimento e aceite**: touch, performance, teste com usuário leigo, revisão dos critérios.

Comece pela F1 e **apresente um plano dos arquivos que vai criar/tocar antes do primeiro commit**.
