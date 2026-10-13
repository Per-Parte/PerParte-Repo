# Roadmap de reinício

**13/10/2026.** Este roadmap acompanha decisões, sem inventar datas.

## Etapa 0 — Contexto e pesquisa

- [x] Proteger o estado antigo em Git e criar branch de reinício.
- [x] Limpar o checkout antigo; manter o histórico recuperável.
- [x] Registrar a Revista de Marca como fonte primária e criar texto pesquisável.
- [x] Criar monorepo com workspaces separados para site e configurador, ambos vazios.
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
- [ ] Revisar com os sócios coleção, nomes propostos, imagens conceituais e linguagem visual antes da versão comercial.
- [ ] Implementar a versão comercial do site após conteúdo, condições e integrações aprovados.
- [ ] Implementar o configurador com controles fabricáveis, preço vivo e prévia fiel.
- [ ] Integrar fabricação, contas e checkout somente após contratos e decisões aprovados.

**Revisão atual:** Marco é a referência da revista; Duna e Farol são propostas. A interface permite exploração local, sem compra ou configuração conectada. Publicação e push seguem adiados por decisão do usuário.

**Nota:** a revista lista uma janela entre Carnaval e Páscoa de 2027 e um D-Zero ainda sem data (pp. 8–9, 65–66). Não é prazo assumido pelo código.
