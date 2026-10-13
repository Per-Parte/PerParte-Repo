# Quadro de projeto

Interface visual local da Per Parte. Rode `npm run quadro` na raiz do monorepo e abra <http://127.0.0.1:4173>.

O quadro vem com dez cartões de partida ligados aos documentos oficiais e à Gantri. Crie notas, decisões e links pelos botões da esquerda; adicione arquivos pelo botão **Arquivo** ou soltando-os sobre o canvas. Arraste o topo de um cartão para movê-lo. Selecione um cartão para editar, abrir ou conectá-lo a outro. A busca encontra títulos, descrições e categorias. O botão de enquadramento fica ao lado do zoom.

O conteúdo editado e os anexos ficam no IndexedDB do navegador. **Exportar quadro** cria um JSON que inclui os arquivos adicionados; **Importar quadro** substitui o estado local. Faça exportações periódicas. A versão atual não sincroniza entre pessoas ou dispositivos. Os documentos de origem seguem no repositório e só são abertos pelo quadro; editar um cartão não altera esses documentos.

Implementação: HTML, CSS e JavaScript sem dependências de interface, com servidor estático Node. As cores e famílias tipográficas referenciam `packages/design-system/tokens.css`; a renderização de fontes depende de carregamento do Google Fonts, com fallback local.
