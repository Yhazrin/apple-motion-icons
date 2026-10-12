#!/usr/bin/env node
// Concatenates the runtime layers, in load order, into one file for pages and
// packages that cannot list seven <script> tags. No dependencies, no transforms:
// every layer is copied byte for byte, so the bundle behaves exactly like the gallery.
//
//   node scripts/build.mjs        → dist/motion-icons.js   (classic script / CommonJS)
//                                   dist/motion-icons.mjs  (ES module, default export)
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LAYERS = [
  'motion-icons.js',
  'motion-icons-recipes.js',
  'motion-icons-learning.js',
  'motion-icons-catalog.js',
  'motion-icons-refinements.js',
  'motion-icons-semantics.js',
  'motion-icons-signature.js',
  'motion-icon-element.js'
];

const {version} = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const parts = [];
const manifest = {};
for (const file of LAYERS) {
  const source = await readFile(join(ROOT, 'assets', file), 'utf8');
  manifest[file] = createHash('sha256').update(source).digest('hex');
  parts.push(`// ---- ${file}\n${source.trimEnd()}\n`);
}

// The engine exports through `module` when it sees one; the layers after it read
// window.MotionIcon. Shadowing `module` keeps every layer on the global path.
// Without a DOM (SSR, tests) nothing runs and the export is undefined.
const body = `if (typeof window !== 'undefined' && typeof document !== 'undefined') (function (module) {\n${parts.join('\n')}})(undefined);\n`;
const banner = `/*! apple-motion-icons ${version} · MIT · https://github.com/Yhazrin/apple-motion-icons\n`
  + ` * Single-file build of ${LAYERS.length} layers: ${LAYERS.join(', ')}. */\n`;
const global = 'typeof window !== \'undefined\' ? window.MotionIcon : globalThis.MotionIcon';

await mkdir(join(ROOT, 'dist'), {recursive: true});
await writeFile(join(ROOT, 'dist/motion-icons.js'), banner + body
  + `if (typeof module === 'object' && module.exports) module.exports = ${global};\n`);
await writeFile(join(ROOT, 'dist/motion-icons.mjs'), banner + body
  + `const MotionIcon = ${global};\nexport default MotionIcon;\nexport {MotionIcon};\n`);
await writeFile(join(ROOT, 'dist/manifest.json'), JSON.stringify({version, layers: manifest}, null, 2) + '\n');
console.log(`dist/motion-icons.js · dist/motion-icons.mjs · ${LAYERS.length} layers · v${version}`);
