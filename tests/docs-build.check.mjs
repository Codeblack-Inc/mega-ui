import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
const css = readdirSync('site/assets')
  .filter((name) => name.endsWith('.css'))
  .map((name) => readFileSync(`site/assets/${name}`, 'utf8'))
  .join('\n');
for (const selector of [
  '.mega-text-editor',
  '.mega-text-editor__panel',
  '.mega-pro-grid',
  '.mega-cartesian-chart',
  '.mega-chart-pro',
]) {
  assert.ok(css.includes(selector), `Production CSS missing ${selector}`);
}
console.log('Production editor, data grid and charts CSS verified.');
