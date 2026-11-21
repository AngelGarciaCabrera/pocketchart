// Construye la librería:
//   dist/pocketchart.min.js   → <script> (expone window.PocketChart y registra <pocket-chart>)
//   dist/pocketchart.esm.js   → import { create } from '...'
//   integrations/react-native/pocketchart-lib.js → la librería como texto para la WebView
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src/pocketchart.js');
const footer = { js: 'if(typeof window!=="undefined"){window.PocketChart=PocketChart.default||PocketChart;window.PocketChart.register();}' };

await build({ entryPoints: [src], bundle: true, minify: true, format: 'iife', globalName: 'PocketChart', outfile: join(root, 'dist/pocketchart.min.js'), target: 'es2020', footer });
await build({ entryPoints: [src], bundle: true, minify: true, format: 'esm', outfile: join(root, 'dist/pocketchart.esm.js'), target: 'es2020' });

const lib = readFileSync(join(root, 'dist/pocketchart.min.js'), 'utf8');
writeFileSync(join(root, 'integrations/react-native/pocketchart-lib.js'),
  '// Generado por build.mjs: no editar a mano.\nexport default ' + JSON.stringify(lib) + ';\n');
console.log('Listo: dist/ e integrations/react-native/pocketchart-lib.js');
