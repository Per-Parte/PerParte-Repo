import { cp, mkdir } from 'node:fs/promises';
const destino = new URL('./dist/',import.meta.url);
await mkdir(destino,{recursive:true});
for (const nome of ['index.html','styles.css','fonts.css','favicon.svg','src']) await cp(new URL(nome,import.meta.url),new URL(nome,destino),{recursive:true});
await cp(new URL('../site/public/fonts/',import.meta.url),new URL('fonts/',destino),{recursive:true});
await cp(new URL('../../packages/design-system/tokens.css',import.meta.url),new URL('tokens.css',destino));
console.log('Configurador estático gerado em apps/configurador/dist.');
