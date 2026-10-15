import { constants, createWriteStream } from 'node:fs';
import { lstat, mkdir, mkdtemp, open, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lerModoCaptacao } from './modo-captacao.mjs';

const raizPadrao = fileURLToPath(new URL('../../', import.meta.url));
const arquivosSite = ['index.html', 'styles.css', 'app.js', 'paleta.css', 'paleta.js', 'fonts.css', 'favicon.svg', 'comercio.html', 'comercio.css', 'comercio.js', 'catalogo.js', 'vitrine.js', 'navegacao.js', 'navegacao.css'];
const arquivosCaptacao = ['captacao.css', 'captacao.js', 'fonts.css', 'favicon.svg'];
const arquivosFontes = new Set(['README.md', 'Figtree-OFL.txt', 'Unbounded-OFL.txt']);
const extensoes = { images: new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico']), fonts: new Set(['.woff2', '.woff', '.ttf', '.otf']) };
const mesmaLocalizacao = (a, b) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;

async function informacao(local) {
  try { return await lstat(local); } catch (erro) { if (erro.code === 'ENOENT') return null; throw erro; }
}
async function diretorioReal(local) {
  const info = await informacao(local);
  if (!info?.isDirectory() || info.isSymbolicLink()) throw new Error('O build exige diretórios reais, sem links simbólicos ou junctions.');
  if (!mesmaLocalizacao(await realpath(local), path.resolve(local))) throw new Error('O diretório do build está fora do caminho esperado.');
}
function validarDestino(local, site, temporario = false) {
  const absoluto = path.resolve(local);
  if (!mesmaLocalizacao(path.dirname(absoluto), site) || (temporario ? !path.basename(absoluto).startsWith('.build-site-') : path.basename(absoluto) !== 'dist')) throw new Error('Destino de build fora do diretório permitido.');
  return absoluto;
}
async function validarSaida(local, site, temporario = false) {
  const absoluto = validarDestino(local, site, temporario);
  if (await informacao(absoluto)) await diretorioReal(absoluto);
  return absoluto;
}
async function listarPublicos(publico, lista) {
  await diretorioReal(publico);
  for (const grupo of await readdir(publico, { withFileTypes: true })) {
    if (!Object.hasOwn(extensoes, grupo.name) || !grupo.isDirectory() || grupo.isSymbolicLink()) throw new Error('A pasta public contém uma entrada não permitida.');
    async function percorrer(diretorio, relativo) {
      await diretorioReal(diretorio);
      for (const item of await readdir(diretorio, { withFileTypes: true })) {
        if (item.name.startsWith('.') || item.isSymbolicLink()) throw new Error('Artefatos ocultos, privados ou links não podem entrar no build público.');
        const origem = path.join(diretorio, item.name);
        const destino = path.posix.join(relativo, item.name);
        if (item.isDirectory()) await percorrer(origem, destino);
        else if (item.isFile() && (extensoes[grupo.name].has(path.extname(item.name).toLowerCase()) || (relativo === 'fonts' && arquivosFontes.has(item.name)))) lista.push({ origem, relativo: destino });
        else throw new Error(`Arquivo público fora da lista permitida: ${destino}`);
      }
    }
    await percorrer(path.join(publico, grupo.name), grupo.name);
  }
}
async function copiarArquivo(origem, destino) {
  const esperado = await lstat(origem);
  if (!esperado.isFile() || esperado.isSymbolicLink()) throw new Error('O build não copia links ou arquivos especiais.');
  const arquivo = await open(origem, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    const atual = await arquivo.stat();
    if (!atual.isFile() || atual.dev !== esperado.dev || atual.ino !== esperado.ino) throw new Error('A origem mudou durante a preparação do build.');
    await mkdir(path.dirname(destino), { recursive: true });
    await pipeline(arquivo.createReadStream({ autoClose: false }), createWriteStream(destino, { flags: 'wx', mode: 0o644 }));
  } finally { await arquivo.close(); }
}
async function verificarMontagem(diretorio, esperados, prefixo = '') {
  for (const item of await readdir(diretorio, { withFileTypes: true })) {
    const relativo = path.posix.join(prefixo, item.name);
    if (item.name.startsWith('.') || item.isSymbolicLink()) throw new Error('A montagem pública contém artefato privado ou link.');
    if (item.isDirectory()) await verificarMontagem(path.join(diretorio, item.name), esperados, relativo);
    else if (!item.isFile() || !esperados.delete(relativo)) throw new Error('A montagem pública contém arquivo não previsto.');
  }
}

// A raiz é injetável para fixtures; o destino nunca é livre: sempre <raiz>/apps/site/dist.
// Todas as origens são validadas e copiadas antes de remover a saída anterior.
export async function construirSite({ raizRepositorio = raizPadrao, ambiente = process.env } = {}) {
  const captacaoAtiva = lerModoCaptacao(ambiente);
  const raiz = await realpath(path.resolve(raizRepositorio));
  const site = path.join(raiz, 'apps', 'site');
  for (const local of [path.join(raiz, 'apps'), site, path.join(raiz, 'packages'), path.join(raiz, 'packages', 'design-system')]) await diretorioReal(local);
  const destino = await validarSaida(path.join(site, 'dist'), site);
  const lista = (captacaoAtiva ? arquivosCaptacao : arquivosSite).map(relativo => ({ origem: path.join(site, relativo), relativo }));
  // As duas entradas públicas recebem a LP; as fontes originais ficam intactas.
  // Os rewrites de Loja/produto/conta/carrinho já apontam para comercio.html.
  if (captacaoAtiva) for (const relativo of ['index.html', 'comercio.html']) lista.push({ origem: path.join(site, 'captacao.html'), relativo });
  lista.push({ origem: path.join(raiz, 'packages', 'design-system', 'tokens.css'), relativo: 'tokens.css' });
  await listarPublicos(path.join(site, 'public'), lista);
  const temporario = await mkdtemp(path.join(site, '.build-site-'));
  try {
    for (const arquivo of lista) await copiarArquivo(arquivo.origem, path.join(temporario, arquivo.relativo));
    await writeFile(path.join(temporario, 'modo-site.json'), `${JSON.stringify({ captacaoAtiva })}\n`, { flag: 'wx', mode: 0o644 });
    const esperados = new Set([...lista.map(arquivo => arquivo.relativo), 'modo-site.json']);
    await verificarMontagem(temporario, esperados);
    if (esperados.size) throw new Error('A montagem pública está incompleta.');
    // Revalidar caminhos absolutos e links imediatamente antes de qualquer remoção.
    await diretorioReal(site);
    await validarSaida(destino, site);
    await validarSaida(temporario, site, true);
    await rm(destino, { recursive: true, force: true });
    await rename(temporario, destino);
    return { destino, arquivos: lista.length + 1, captacaoAtiva };
  } finally {
    if (await informacao(temporario)) {
      await diretorioReal(site);
      await validarSaida(temporario, site, true);
      await rm(temporario, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  construirSite().then(({ arquivos, captacaoAtiva }) => console.log(`Build público limpo: ${arquivos} arquivos em apps/site/dist. Modo: ${captacaoAtiva ? 'LP de captação' : 'site completo'}. A API exige runtime Node.`)).catch(erro => {
    console.error(erro.code === 'CONFIGURACAO_LP_INVALIDA' ? erro.message : 'Build recusado: confira fontes, lista de arquivos públicos e ausência de links/artefatos privados. A saída não deve ser publicada.');
    process.exitCode = 1;
  });
}
