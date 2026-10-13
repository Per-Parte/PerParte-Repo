import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(item => item[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs HTML devem ser únicos.');
for (const [, ancora] of html.matchAll(/\bhref="#([^"]+)"/g)) assert(ids.includes(ancora), `Âncora inexistente: ${ancora}`);
for (const [, caminho] of html.matchAll(/(?:src|href)="(\/images\/[^"?#]+)"/g)) await access(new URL(`./public${caminho}`, import.meta.url));
for (const arquivo of ['app.js', 'servidor.mjs', 'construir.mjs']) {
  const resultado = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(arquivo, import.meta.url))], { encoding: 'utf8' });
  if (resultado.status !== 0) throw new Error(`${arquivo}: ${resultado.stderr}`);
}
assert(html.includes('prefers-reduced-motion') || (await readFile(new URL('./styles.css', import.meta.url), 'utf8')).includes('prefers-reduced-motion'), 'Falta modo de movimento reduzido.');
console.log('Site verificado: sintaxe JS, IDs, âncoras, imagens e movimento reduzido.');
