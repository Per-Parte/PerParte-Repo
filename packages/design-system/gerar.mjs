import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const pasta = dirname(fileURLToPath(import.meta.url));
const fonte = JSON.parse(await readFile(join(pasta, 'tokens.json'), 'utf8'));
const nome = (valor) => valor.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);

const css = [
  '/* Gerado de tokens.json. Edite a fonte e rode npm run tokens:gerar. */',
  ':root {',
];
for (const grupo of Object.values(fonte.cores)) {
  for (const [chave, valor] of Object.entries(grupo)) {
    css.push(`  --pp-cor-${nome(chave)}: ${valor};`);
  }
}
for (const [chave, familia] of Object.entries(fonte.tipografia.familias)) {
  css.push(`  --pp-fonte-${nome(chave)}: "${familia}", ${chave === 'tecnica' ? 'monospace' : 'sans-serif'};`);
}
for (const [chave, estilo] of Object.entries(fonte.tipografia.escala)) {
  const prefixo = `--pp-tipo-${nome(chave)}`;
  css.push(`  ${prefixo}-fonte: var(--pp-fonte-${estilo.familia});`);
  css.push(`  ${prefixo}-tamanho: ${estilo.tamanhoPx}px;`);
  css.push(`  ${prefixo}-entrelinha: ${estilo.entrelinhaPx ? `${estilo.entrelinhaPx}px` : estilo.entrelinha};`);
  css.push(`  ${prefixo}-peso: ${estilo.peso};`);
  css.push(`  ${prefixo}-tracking: ${estilo.trackingEm}em;`);
}
css.push(`  --pp-raio-proporcional: ${fonte.forma.raioProporcional};`);
css.push(`  --pp-sombra-decorativa: ${fonte.forma.sombraDecorativa};`);
css.push('}', '');

const saídas = [
  ['tokens.css', css.join('\n')],
  ['tokens.mjs', `// Gerado de tokens.json. Edite a fonte e rode npm run tokens:gerar.\nexport const tokens = ${JSON.stringify(fonte, null, 2)};\nexport default tokens;\n`],
];

if (process.argv.includes('--check')) {
  for (const [arquivo, esperado] of saídas) {
    const atual = await readFile(join(pasta, arquivo), 'utf8').catch(() => '');
    if (atual !== esperado) {
      console.error(`${arquivo} está desatualizado. Rode npm run tokens:gerar.`);
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) console.log('Tokens CSS e JS conferem com tokens.json.');
} else {
  for (const [arquivo, conteudo] of saídas) await writeFile(join(pasta, arquivo), conteudo);
  console.log('Tokens CSS e JS gerados.');
}
