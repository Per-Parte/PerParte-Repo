# Roadmap de reinício

**Atualizado em 14/10/2026.** Este roadmap acompanha decisões, sem inventar datas.

## Etapa 0 — Contexto e pesquisa

- [x] Proteger o estado antigo em Git e criar branch de reinício.
- [x] Limpar o checkout antigo; manter o histórico recuperável.
- [x] Registrar a Revista de Marca como fonte primária e criar texto pesquisável.
- [x] Criar monorepo com workspaces separados para site e configurador, ambos vazios no reinício de 13/10/2026.
- [x] Organizar contexto conforme projetos em `Desktop/fainow-projects`.
- [x] Extrair tokens iniciais da revista e pesquisar Gantri como benchmark separado.
- [x] Criar quadro visual local para navegar documentos, notas, links e decisões.

## Etapa 1 — Decisões antes do produto

- [ ] Validar com Davi e Caio as pendências da revista: logo/wordmark, tipografia final, filamentos e cores medidas na peça real, persona, preço, prazo, garantia, devolução e royalties.
- [ ] Reconciliar as guardas elétricas e de fabricação com protótipos e ensaios.
- [ ] Definir stack, infraestrutura e contrato compartilhado de domínio/produção em ADRs.
- [ ] Escolher critérios de aceite da experiência Montar/Inventar com usuários novatos.
- [ ] Definir se o quadro precisará de colaboração simultânea e armazenamento compartilhado; a versão inicial é local com exportação/importação.

## Etapa 2 — Aplicativos

- [x] Criar a landing visual local para três luminárias, com direção Per Parte e referência estrutural Gantri.
- [x] Adotar HTML, CSS e JavaScript com Node nativo para o protótipo reversível do site (ADR 0003).
- [x] Concluir a verificação do protótipo em desktop/mobile e registrar os resultados em `.claude/state.md`.
- [x] Implementar a revisão visual: menu de vidro escuro, três cenas e triptico de fotos, modais/fotos arredondados, Missão, rodapé amplo, processo por scroll e paleta visual de 25 cores.
- [x] Verificar na revisão desktop a sequência dos três passos por PageDown e a paleta/ocultação durante modal sem alterar as imagens dos produtos.
- [x] Verificar cor branca de Marco, seção Missão e navegação/paleta móvel em 351 × 760 CSS px, sem overflow e com seleção por teclado.
- [x] Concluir enquadramento do hero masculino móvel, confirmar console sem erros e repetir build/check após as últimas alterações; resultados em `docs/revisao-landing-2026-10-13.md`.
- [ ] Gerar e integrar vídeo real de pessoa dançando com luminária Per Parte; acesso a gerador ainda pendente, sem resposta do usuário à pergunta de conexão.
- [ ] Revisar com os sócios coleção, nomes propostos, imagens conceituais e linguagem visual antes da versão comercial.
- [ ] Implementar a versão comercial do site após conteúdo, condições e integrações aprovados.
- [x] Pesquisar a fonte do Hairline com a abordagem REA e registrar técnica, limites e matriz de interação em `docs/pesquisa/hairline.md`.
- [x] Implementar a interface local do configurador separado: painel, três presets + livre, formas/variações por parte, cotas, rotação SVG, cores, conclusão e reabertura.
- [x] Implementar persistência local versionada, proteção contra corrupção e preparação/download de rascunhos de pedido sem envio.
- [x] Registrar o protótipo reversível HTML/CSS/ESM + Node na porta 4175 no ADR 0004.
- [x] Concluir e registrar a revisão funcional/visual do configurador em desktop e móvel, incluindo giro, cotas, persistência e rascunhos.
- [ ] Validar o configurador com usuários novatos e revisar presets/dimensões exploratórias com engenharia.
- [ ] Evoluir o configurador para controles fabricáveis, preço vivo e prévia fiel ao contrato de produção.
- [ ] Integrar fabricação, contas e checkout somente após contratos e decisões aprovados.

**Revisão atual:** dez imagens conceituais originais; Marco é a referência da revista, Duna e Farol são propostas. A foto da mulher em gesto de dança não conclui o pedido de vídeo. A paleta reproduz um estudo visual do benchmark sem instituir catálogo comercial de cores. A landing permite exploração local, sem compra ou conexão comercial. O configurador já permite criar e editar composições localmente; os pedidos são rascunhos não enviados, login foi adiado e a fabricação permanece pendente. Publicação e push seguem adiados por decisão do usuário.

**Nota:** a revista lista uma janela entre Carnaval e Páscoa de 2027 e um D-Zero ainda sem data (pp. 8–9, 65–66). Não é prazo assumido pelo código.
