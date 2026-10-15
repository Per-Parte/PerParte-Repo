import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, readdir, realpath, symlink, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { construirSite } from '../construir.mjs';
import { criarServidor } from '../servidor.mjs';
import { lerModoCaptacao } from '../modo-captacao.mjs';

async function fixture() {
  const raiz = await realpath(await mkdtemp(path.join(tmpdir(), 'perparte-build-teste-')));
  const site = path.join(raiz, 'apps', 'site');
  await mkdir(path.join(site, 'public', 'images'), { recursive: true });
  await mkdir(path.join(site, 'public', 'fonts'), { recursive: true });
  await mkdir(path.join(raiz, 'packages', 'design-system'), { recursive: true });
  for (const nome of ['index.html', 'styles.css', 'app.js', 'paleta.css', 'paleta.js', 'fonts.css', 'favicon.svg', 'comercio.html', 'comercio.css', 'comercio.js', 'catalogo.js', 'vitrine.js', 'navegacao.js', 'navegacao.css', 'captacao.html', 'captacao.css', 'captacao.js']) await writeFile(path.join(site, nome), `fixture pública: ${nome}`);
  await writeFile(path.join(raiz, 'packages', 'design-system', 'tokens.css'), ':root { --cor: red; }');
  await writeFile(path.join(site, 'public', 'images', 'luminaria.png'), 'imagem-fixture');
  await writeFile(path.join(site, 'public', 'fonts', 'fonte.woff2'), 'fonte-fixture');
  await writeFile(path.join(site, 'public', 'fonts', 'Figtree-OFL.txt'), 'licença-fixture');
  return { raiz, site, destino: path.join(site, 'dist'), construir: (ambiente = {}) => construirSite({ raizRepositorio: raiz, ambiente }) };
}
const ausente = local => assert.rejects(access(local), { code: 'ENOENT' });

test('modo aceita TRUE/FALSE sem distinguir caixa e recusa outros valores', () => {
  for (const valor of [undefined, '', 'false', ' FALSE ']) assert.equal(lerModoCaptacao({ PERPARTE_LP_ATIVA: valor }), false);
  for (const valor of ['true', 'TRUE', ' TrUe ']) assert.equal(lerModoCaptacao({ PERPARTE_LP_ATIVA: valor }), true);
  for (const valor of ['1', 'sim', 'enabled']) assert.throws(() => lerModoCaptacao({ PERPARTE_LP_ATIVA: valor }), /PERPARTE_LP_ATIVA deve ser TRUE ou FALSE/);
});

test('TRUE oculta ambas as entradas e FALSE restaura o site sem alterar suas fontes', async () => {
  const f = await fixture();
  await f.construir({ PERPARTE_LP_ATIVA: 'TRUE' });
  for (const nome of ['index.html', 'comercio.html']) {
    assert.equal(await readFile(path.join(f.destino, nome), 'utf8'), 'fixture pública: captacao.html');
    assert.equal(await readFile(path.join(f.site, nome), 'utf8'), `fixture pública: ${nome}`);
  }
  assert.deepEqual(JSON.parse(await readFile(path.join(f.destino, 'modo-site.json'), 'utf8')), { captacaoAtiva: true });
  for (const nome of ['app.js', 'comercio.js', 'styles.css', 'captacao.html']) await ausente(path.join(f.destino, nome));
  assert.equal(await readFile(path.join(f.destino, 'captacao.js'), 'utf8'), 'fixture pública: captacao.js');
  await f.construir({ PERPARTE_LP_ATIVA: 'FALSE' });
  for (const nome of ['index.html', 'comercio.html']) assert.equal(await readFile(path.join(f.destino, nome), 'utf8'), `fixture pública: ${nome}`);
  assert.deepEqual(JSON.parse(await readFile(path.join(f.destino, 'modo-site.json'), 'utf8')), { captacaoAtiva: false });
  await ausente(path.join(f.destino, 'captacao.js'));
});

test('flag inválida recusa o build antes de substituir a saída anterior', async () => {
  const f = await fixture();
  await f.construir();
  await assert.rejects(f.construir({ PERPARTE_LP_ATIVA: 'sim' }), /PERPARTE_LP_ATIVA deve ser TRUE ou FALSE/);
  assert.equal(await readFile(path.join(f.destino, 'index.html'), 'utf8'), 'fixture pública: index.html');
});

async function iniciarServidor(t, f, opcoes) {
  const servidor = criarServidor({ raizSite: f.site, fetchImpl: async () => { throw new Error('O gate não deve chamar serviços externos.'); }, ...opcoes });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { servidor.closeAllConnections(); servidor.close(resolve); }));
  return (rota, init) => fetch(`http://127.0.0.1:${servidor.address().port}${rota}`, init);
}

test('servidor local aplica o gate às páginas, aliases, assets e APIs', async t => {
  const f = await fixture();
  for (const ativo of [true, false]) {
    const consultar = await iniciarServidor(t, f, { ambiente: { PERPARTE_LP_ATIVA: String(ativo) } });
    for (const rota of ['/', '/index.html', '/comercio.html', '/loja', '/conta', '/carrinho', '/produtos/marco']) {
      const resposta = await consultar(rota);
      assert.equal(resposta.status, 200, rota);
      const fonte = ativo ? 'captacao.html' : ['/', '/index.html'].includes(rota) ? 'index.html' : 'comercio.html';
      assert.equal(await resposta.text(), `fixture pública: ${fonte}`, rota);
    }
    assert.equal((await consultar('/api/loja/config')).status, ativo ? 404 : 200);
    assert.equal((await consultar('/api/captacao')).status, ativo ? 405 : 404);
    assert.equal((await consultar('/captacao.html')).status, 404);
    assert.equal((await consultar('/captacao.css')).status, ativo ? 200 : 404);
    assert.equal((await consultar('/app.js')).status, ativo ? 404 : 200);
    assert.equal((await consultar('/images/luminaria.png')).status, 200);
    assert.equal((await consultar('/tokens.css')).status, 200);
    assert.equal((await consultar('/index.html', { method: 'HEAD' })).status, 200);
  }
});

test('prévia --dist respeita o modo gerado mesmo com ambiente local oposto', async t => {
  const f = await fixture();
  for (const ativo of [true, false]) {
    await f.construir({ PERPARTE_LP_ATIVA: String(ativo) });
    const consultar = await iniciarServidor(t, f, { dist: true, ambiente: { PERPARTE_LP_ATIVA: String(!ativo) } });
    for (const rota of ['/', '/loja', '/index.html', '/comercio.html']) {
      const resposta = await consultar(rota);
      assert.equal(resposta.status, 200, rota);
      const fonte = ativo ? 'captacao.html' : ['/', '/index.html'].includes(rota) ? 'index.html' : 'comercio.html';
      assert.equal(await resposta.text(), `fixture pública: ${fonte}`, rota);
    }
    assert.equal((await consultar('/api/loja/config')).status, ativo ? 404 : 200);
    assert.equal((await consultar('/api/captacao')).status, ativo ? 405 : 404);
  }
});

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
