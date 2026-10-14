import { readdir, readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const raiz = new URL('./',import.meta.url);
for(const nome of ['servidor.mjs','construir.mjs',...(await readdir(new URL('src/',raiz))).map(n=>'src/'+n)]) execFileSync(process.execPath,['--check',fileURLToPath(new URL(nome,raiz))]);
for(const nome of ['index.html','fonts.css','styles.css','favicon.svg']) await access(new URL(nome,raiz));
const css = await readFile(new URL('styles.css',raiz),'utf8');
if(!css.includes('prefers-reduced-motion')) throw Error('Falta suporte a movimento reduzido.');
console.log('Módulos, assets e movimento reduzido verificados.');
