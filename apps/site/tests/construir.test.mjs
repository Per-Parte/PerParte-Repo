import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, readdir, realpath, symlink, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { construirSite } from '../construir.mjs';

async function fixture() {
  const raiz = await realpath(await mkdtemp(path.join(tmpdir(), 'perparte-build-teste-')));
  const site = path.join(raiz, 'apps', 'site');
  await mkdir(path.join(site, 'public', 'images'), { recursive: true });
  await mkdir(path.join(site, 'public', 'fonts'), { recursive: true });
  await mkdir(path.join(raiz, 'packages', 'design-system'), { recursive: true });
  for (const nome of ['index.html', 'styles.css', 'app.js', 'paleta.css', 'paleta.js', 'fonts.css', 'favicon.svg', 'comercio.html', 'comercio.css', 'comercio.js', 'catalogo.js', 'vitrine.js', 'navegacao.js', 'navegacao.css']) await writeFile(path.join(site, nome), `fixture pública: ${nome}`);
  await writeFile(path.join(raiz, 'packages', 'design-system', 'tokens.css'), ':root { --cor: red; }');
  await writeFile(path.join(site, 'public', 'images', 'luminaria.png'), 'imagem-fixture');
  await writeFile(path.join(site, 'public', 'fonts', 'fonte.woff2'), 'fonte-fixture');
  await writeFile(path.join(site, 'public', 'fonts', 'Figtree-OFL.txt'), 'licença-fixture');
  return { raiz, site, destino: path.join(site, 'dist'), construir: () => construirSite({ raizRepositorio: raiz }) };
}
const ausente = local => assert.rejects(access(local), { code: 'ENOENT' });

test('build substitui saída anterior e elimina .env, .vercel e extras sem copiá-los', async () => {
  const f = await fixture();
  await mkdir(path.join(f.destino, '.vercel'), { recursive: true });
  for (const nome of ['.env.local', '.gitignore', 'README.txt', 'antigo.js']) await writeFile(path.join(f.destino, nome), 'artefato-fictício');
  await writeFile(path.join(f.destino, '.vercel', 'project.json'), '{}');
  const resultado = await f.construir();
  assert.equal(resultado.destino, f.destino);
  assert.equal(await readFile(path.join(f.destino, 'index.html'), 'utf8'), 'fixture pública: index.html');
  assert.equal(await readFile(path.join(f.destino, 'fonts', 'Figtree-OFL.txt'), 'utf8'), 'licença-fixture');
  for (const nome of ['.env.local', '.gitignore', '.vercel', 'README.txt', 'antigo.js']) await ausente(path.join(f.destino, nome));
  assert(!(await readdir(f.site)).some(nome => nome.startsWith('.build-site-')));
  await f.construir();
  assert.equal(await readFile(path.join(f.destino, 'images', 'luminaria.png'), 'utf8'), 'imagem-fixture');
});

test('artefatos privados nas fontes públicas recusam build e preservam saída anterior', async () => {
  for (const relativo of ['.env.local', 'images/.env.local', 'images/.vercel/project.json', 'images/credenciais.json']) {
    const f = await fixture();
    await mkdir(f.destino); await writeFile(path.join(f.destino, 'anterior.txt'), 'preservado');
    const indevido = path.join(f.site, 'public', relativo);
    await mkdir(path.dirname(indevido), { recursive: true }); await writeFile(indevido, 'fixture-privada');
    await assert.rejects(f.construir());
    assert.equal(await readFile(path.join(f.destino, 'anterior.txt'), 'utf8'), 'preservado');
    assert(!(await readdir(f.site)).some(nome => nome.startsWith('.build-site-')));
  }
});

test('falha de fonte fixa não apaga saída anterior e limpa staging', async () => {
  const f = await fixture();
  await mkdir(f.destino); await writeFile(path.join(f.destino, 'anterior.txt'), 'preservado');
  await unlink(path.join(f.site, 'app.js'));
  await assert.rejects(f.construir());
  assert.equal(await readFile(path.join(f.destino, 'anterior.txt'), 'utf8'), 'preservado');
  assert(!(await readdir(f.site)).some(nome => nome.startsWith('.build-site-')));
});

test('dist junction/symlink é recusado sem alterar seu alvo externo', async () => {
  const f = await fixture(); const externo = await mkdtemp(path.join(tmpdir(), 'perparte-build-preservar-'));
  await writeFile(path.join(externo, 'preservar.txt'), 'fora-do-destino');
  await symlink(externo, f.destino, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(f.construir(), /links|junctions/);
  assert.equal(await readFile(path.join(externo, 'preservar.txt'), 'utf8'), 'fora-do-destino');
});

test('junction nas fontes públicas nunca é seguida', async () => {
  const f = await fixture(); const externo = await mkdtemp(path.join(tmpdir(), 'perparte-build-nao-copiar-'));
  await writeFile(path.join(externo, 'imagem.png'), 'conteúdo-privado-fictício');
  await symlink(externo, path.join(f.site, 'public', 'images', 'atalho'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(f.construir(), /links|junctions/);
  await ausente(f.destino);
});
