import { cp, mkdir } from 'node:fs/promises';
const destino = new URL('./dist/', import.meta.url);
await mkdir(destino, { recursive: true });
for (const arquivo of ['index.html', 'styles.css', 'app.js', 'fonts.css', 'favicon.svg']) {
  await cp(new URL(arquivo, import.meta.url), new URL(arquivo, destino));
}
await cp(new URL('./public/', import.meta.url), destino, { recursive: true });
await cp(new URL('../../packages/design-system/tokens.css', import.meta.url), new URL('tokens.css', destino));
console.log('Landing estática gerada em apps/site/dist.');
