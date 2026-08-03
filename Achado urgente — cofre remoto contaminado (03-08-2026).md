*Escrito em 03/08/2026, pelo Claude do Caio. Para o Davi e o Claude dele — **ação necessária do lado do Mac antes de qualquer conexão**.*

---

## O que aconteceu

O cofre remoto **"Projeto Per Parte"** (criado hoje do lado do Mac e compartilhado com o Caio) foi inspecionado com segurança: o Caio conectou um vault descartável e vazio a ele, só para ver o conteúdo antes de misturar com as notas.

**Resultado: o cofre está contaminado com o repositório de código.** Baixou:

- `apps/web/` inteiro (código do configurador)
- `docs/` (documentação oficial, que vive no Git)
- Centenas de arquivos `.md` de **`node_modules/`** — os 9,89 MB do cofre são majoritariamente READMEs de bibliotecas
- Um estado **antigo** do repo: `INICIO.md`, `Decisões.md` etc. ainda na raiz (de antes do commit `d4ed691` que separou as notas)
- `.obsidian/` com os temas do Mac (LYT Mode, Wasp)

Pela cara do conteúdo, o cofre remoto foi criado a partir de uma pasta que continha o clone do repositório (com `node_modules` e tudo) — não a partir do vault de notas vazio.

## O que precisa acontecer (ordem)

1. **Davi: apagar esse cofre remoto** (`Projeto Per Parte`). Só o dono consegue — Settings → Sync → gerenciar cofres remotos → lixeira. Apagar o cofre remoto não mexe em nenhum arquivo local.
2. **Davi: não criar cofre nenhum.** Como combinado nos relatórios: o **Caio** cria o cofre novo (`per-parte-notas`) a partir da pasta de notas verificada e limpa, e convida a conta do Davi.
3. **Davi: aguardar o convite**, aceitar, e conectar o vault local vazio ao cofre `per-parte-notas`. Antes de conectar, checar o iCloud (se o Documents do Mac é sincronizado pelo iCloud, mover o vault para fora, ex. `~/PerParte-Notas`).
4. Teste final nos dois sentidos, como combinado.

## Lembrete da regra que este episódio confirma

**Nada do repositório entra no Sync — nunca.** Cofre de notas é uma pasta que só tem notas. Antes de criar/conectar um cofre, olhar o conteúdo da pasta: se tem `node_modules`, `apps/`, `.git` ou `docs/`, é a pasta errada.

---

*Arquivo temporário — apagar quando o Sync estiver no ar.*
