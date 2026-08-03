*Escrito em 02/08/2026, pelo Claude do Caio, para o sócio (e o Claude dele) entenderem o que aconteceu e o que verificar do lado do Mac.*

---

## O problema que percebemos

O cofre do Obsidian do Caio (Windows) e o cofre do sócio (Mac) estavam **muito diferentes**: o do sócio tinha "cheio de documentos, pastas e subpastas" que não existiam do lado do Caio, e nenhum dos dois batia com o que estava realmente salvo no GitHub.

A pergunta inicial foi "será que é porque um é Mac e o outro é Windows?" — **não é isso**. Obsidian e Git funcionam de forma idêntica nos dois sistemas. O problema era de configuração, não de plataforma.

## Como a sincronização deste projeto realmente funciona

Existem **dois mecanismos de sincronização diferentes e independentes** rodando ao mesmo tempo neste projeto:

1. **Git + GitHub** — o mecanismo "oficial", recomendado no documento mestre do projeto. Cada um trabalha na sua máquina, com `git pull` (traz as mudanças dos outros) e `git push` (envia as suas). É manual, mas é o que garante que o **código** (o site, o configurador) fique igual nas duas máquinas.
2. **Obsidian Sync** — um serviço pago do próprio Obsidian, que o Caio ativou para o sócio ter acesso às notas sem precisar mexer com Git. Esse sincroniza a pasta inteira automaticamente, em tempo real, nos dois sentidos.

O problema é que **os dois mecanismos vivem na mesma pasta**, e ninguém coordenou os dois. Isso é receita para bagunça.

## A causa raiz que encontramos

Investigando o cofre do Caio, apareceu uma pasta chamada **`PerParte-Repo`** *dentro* do próprio cofre (`Projeto Per Parte/PerParte-Repo/`), com uma cópia inteira do repositório lá dentro — `apps/`, `packages/`, `docs/`, as mesmas notas de novo, tudo duplicado.

O motivo: em algum momento, **o repositório foi clonado (`git clone`) de dentro da própria pasta do cofre**, em vez de a pasta do cofre já ser o clone. Isso cria uma "boneca russa" — um clone dentro do clone.

Como o Obsidian Sync replica a pasta inteira entre as duas máquinas, essa pasta duplicada foi enviada do Mac para o Windows (ou vice-versa) — e é bem provável que seja essa mesma duplicação, multiplicada, que está deixando o cofre do sócio "cheio de pastas e documentos" que não deveriam estar ali.

**Confirmamos a causa**: apagamos a pasta `PerParte-Repo` duplicada do lado do Caio, ela voltou sozinha (prova de que o Sync estava repondo a partir do Mac), pedimos para o sócio apagar a dele, e assim que ele apagou, a duplicação sumiu dos dois lados ao mesmo tempo, sem precisar mexer de novo. Ou seja: **a origem do problema estava (e pode ainda estar, em outras formas) do lado do Mac**.

## O que já foi corrigido (lado do Caio / Windows)

- ✅ Removida a pasta `PerParte-Repo` duplicada de dentro do cofre `Projeto Per Parte`
- ✅ Removidas outras cópias soltas do documento mestre que estavam espalhadas em pastas antigas do Desktop
- ✅ Confirmado que o Git deste computador está conectado certinho ao repositório da organização: `https://github.com/Per-Parte/PerParte-Repo.git`, branch `main`, sem pendências
- 🔲 Ainda falta remover da lista de cofres do Obsidian (não do disco, só da lista) um cofre morto antigo chamado "per-parte", que aponta pra uma pasta que não existe mais de verdade — baixa prioridade, não afeta nada

## O que pedimos para o sócio verificar no Mac (com a ajuda do Claude dele)

Cole isso para o Claude dele, ou siga manualmente:

1. **Abra o Obsidian e olhe a lista de cofres** (clique no nome do cofre, embaixo à esquerda). Quantos cofres aparecem? Algum deles é uma pasta pessoal antiga, separada do projeto da Per Parte?
2. **Dentro do cofre que ele usa para a Per Parte**, procure se existe alguma pasta chamada `PerParte-Repo`, `PerParte`, ou qualquer coisa parecida, **dentro** de outra pasta que já parece ser o projeto. Se tiver clone-dentro-de-clone de novo, apagar a de dentro (a de fora fica).
3. **Abrir um terminal na pasta do cofre e rodar**:
   ```
   git remote -v
   git status
   ```
   O `remote` tem que apontar para `https://github.com/Per-Parte/PerParte-Repo.git`. Se `git status` reclamar que não é um repositório Git, é sinal de que o cofre dele **não é** o clone do projeto — é uma pasta separada onde ele só andou colando/criando notas por conta própria, sem nunca ter clonado o repositório de verdade.
4. **Se o cofre dele NÃO for o clone do repositório**: o conteúdo que ele criou lá (se tiver algo valioso — reuniões, ideias, anotações) precisa ser copiado manualmente para dentro da pasta que É o clone do repositório, e depois enviado com `git add`, `git commit`, `git push`, para não se perder. Depois disso, ele passa a usar **essa** pasta (a do clone) como cofre do Obsidian, e não outra.
5. **Regra de ouro daqui para frente**: nunca rodar `git clone` de novo dentro de uma pasta que já é um cofre/clone. Só usar `git pull` para trazer o que o Caio (ou o Claude do Caio) publicou.

## Recomendação de processo daqui para frente

Vale os dois decidirem entre:

- **Opção A — só Git.** Desativa o Obsidian Sync desse cofre. Cada um sincroniza dando `git pull` no começo do dia e `git push` no fim (ou pedindo para o respectivo Claude fazer isso). Mais controle, menos mágica, exige o hábito de puxar/empurrar.
- **Opção B — só Obsidian Sync para as notas, Git só para o código.** Mais simples no dia a dia, mas exige que a pasta de notas do Obsidian **não** seja a mesma pasta do repositório de código — para não repetir esse problema.

O documento mestre do projeto já recomendava a Opção A. Minha sugestão é manter assim, já que é o que está funcionando bem do lado do Caio.

---

*Este arquivo pode ser apagado depois que o problema for confirmado como resolvido dos dois lados — ele é um registro de diagnóstico, não parte da documentação permanente do produto.*
