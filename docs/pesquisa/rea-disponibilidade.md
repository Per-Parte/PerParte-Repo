# Disponibilidade da REA para a pesquisa Gantri

Data: 13/10/2026. Alvo solicitado: homepage pública da Gantri. Esta nota registra o diagnóstico da ferramenta; a evidência visual deve ser consultada junto às capturas de navegador da pesquisa.

## Observado nesta sessão

- A skill `reverse-engineer-anything` está em `C:/Users/Antônio/.codex/skills/reverse-engineer-anything/SKILL.md`, versão declarada `41`; foram lidos os guias locais `connection-and-recovery.md` e `runtime-observation.md`.
- A sessão Codex não expõe ferramentas MCP REA.
- `npx -y rea-agents@latest doctor --client codex --json` não chegou a executar o diagnóstico: a resolução de `registry.npmjs.org` falhou com `ENOTFOUND` no sandbox.
- O launcher global existente `rea` foi encontrado em `C:/Users/Antônio/AppData/Roaming/npm/rea.ps1`. `rea --version` retornou `6.4.0`; Node é `24.13.0`.
- `rea doctor --client codex --json` executou e retornou código `1`: Node saudável; registro Codex ausente em `C:/Users/Antônio/.codex/config.toml`, classificado como `config_drift`; conexão ao servidor ativo permanece desconhecida. O diagnóstico não registra nem conecta MCP.
- A CLI espera identidade da skill empacotada versão `37` e informou identidade instalada ausente. Isso não contradiz a existência do `SKILL.md` manual versão `41`: são verificações diferentes. Os comandos abaixo foram confirmados pelo `--help` da CLI efetivamente instalada.
- Hopper, Ghidra e IDA indisponíveis foram verificações informativas. Esses motores não são pré-requisito para inspeção de website/JavaScript.

## Alternativa CLI confirmada

A CLI permite análise web sem registrar MCP, mas precisa de um endpoint CDP HTTP de loopback com porta literal e de um alvo descoberto naquele navegador. Os comandos não recebem simplesmente uma URL pública como substituta do endpoint.

```text
rea list-browser-targets <endpoint> --json
rea inspect-web-page <endpoint> <targetId> --include-accessibility-text --include-script-sources --json
rea analyze-web-bundle <endpoint> <targetId> --json
rea capture-web-screenshot <endpoint> <targetId> --json
```

`inspect-web-page` faz observação passiva e oferece duração de observação, fontes de scripts, texto de acessibilidade e formatos de resposta sem credenciais. `analyze-web-bundle` captura e analisa estaticamente scripts do alvo; buscar source maps é uma opção explícita. O guia oficial também documenta essa rota pela CLI: [Browser and Network Analysis](https://rea.tools/guides/browser/).

Para uma árvore JavaScript/ASAR local já obtida legitimamente, a alternativa sem navegador é `rea analyze-javascript-application <caminho-absoluto> --json`. Essa análise de arquivos não prova aparência ou execução de animações no site. Ver [CLI and Evidence](https://github.com/morluto/rea/blob/main/docs/cli.md).

## Limite e procedimento adotado

Nenhum endpoint CDP da sessão Chrome da extensão foi fornecido a este diagnóstico. Não foram iniciados outro Chrome, perfil de navegador ou servidor MCP, nem alteradas configurações do usuário. Capturas feitas pela extensão do Chrome e leituras do DOM são evidência desse navegador, não registros `Evidence` da REA.

A skill orienta separar observação, inferência e decisão de reconstrução. Portanto, layout e interações da Gantri devem ser anotados a partir das capturas e da inspeção realizada pelo navegador; animações não observadas não devem ser atribuídas à Gantri. A implementação Per Parte pode acrescentar decisões próprias, identificadas como adaptações.

Uma futura conexão MCP pode ser preparada por `rea setup --client codex --dry-run --json`, com revisão dos caminhos/backup/substituição da skill antes de qualquer escrita. Não foi necessária para a continuidade da pesquisa visual e não foi executada nesta etapa.
