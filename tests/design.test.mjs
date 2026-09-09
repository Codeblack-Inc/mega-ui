import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const stylesDir = new URL('../src/styles/', import.meta.url);
const tokens = readFileSync(new URL('_tokens.scss', stylesDir), 'utf8');
const componentStyles = readdirSync(stylesDir)
  .filter(
    (name) =>
      name.endsWith('.scss') && !['_tokens.scss', '_icons.scss'].includes(name),
  )
  .map((name) => [name, readFileSync(new URL(name, stylesDir), 'utf8')]);
const definedTokens = new Set(
  [...tokens.matchAll(/(--mega-[\w-]+)\s*:/g)].map((match) => match[1]),
);
const runtimeValues = new Set([
  '--mega-gap',
  '--mega-grid-min',
  '--mega-chart-value',
]);
const styles = Object.fromEntries(componentStyles);

test('design contract keeps core Toss-inspired tokens stable', () => {
  assert.match(tokens, /--mega-font:\s*'Pretendard Variable', Pretendard/);
  assert.match(tokens, /--mega-blue-600:\s*#3182f6/);
  assert.match(tokens, /--mega-brand:\s*var\(--mega-blue-600\)/);
  assert.match(tokens, /--mega-disabled-opacity:\s*0\.3/);
  assert.match(tokens, /--mega-press-overlay:\s*rgb\(0 0 0 \/ 26%\)/);
  assert.match(tokens, /--mega-duration-fast:\s*120ms/);
  assert.match(tokens, /--mega-duration-base:\s*200ms/);
  assert.match(tokens, /--mega-duration-slow:\s*320ms/);
});

test('component styles use defined semantic colors only', () => {
  for (const [name, css] of componentStyles) {
    for (const [, token] of css.matchAll(/var\((--mega-[\w-]+)/g))
      assert.ok(
        definedTokens.has(token) || runtimeValues.has(token),
        `${name}: ${token}`,
      );
    assert.doesNotMatch(
      css,
      /var\(--mega-(?:grey|blue|red|green|yellow|teal|purple|white)-(?:a?\d+)/,
      `${name}: use a semantic color token`,
    );
    assert.doesNotMatch(
      css,
      /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(/i,
      `${name}: raw colors belong in _tokens.scss`,
    );
  }
});

test('component styles reject known visual-language violations', () => {
  const css = componentStyles.map(([, source]) => source).join('\n');
  assert.doesNotMatch(
    css,
    /skeleton-shimmer|\b(?:bounce|overshoot|parallax)\b/i,
  );
  assert.doesNotMatch(css, /font-weight:\s*(?:800|900)\b/);
  assert.doesNotMatch(css, /filter:\s*(?:brightness|contrast)\(/);
  assert.doesNotMatch(css, /:disabled[^{}]*\{[^{}]*opacity:\s*0\./);
});

test('dense controls keep checkmarks visible and short labels intact', () => {
  assert.match(
    styles['_controls.scss'],
    /\.mega-checkbox--square input[\s\S]*&:checked::after[\s\S]*background: var\(--mega-on-brand\)/,
  );
  assert.match(
    styles['_controls.scss'],
    /\[aria-checked='mixed'\][\s\S]*inset: 50% auto auto 50%/,
  );
  assert.match(styles['_typography.scss'], /word-break: keep-all/);
  assert.match(
    styles['_patterns.scss'],
    /&__controls > label > span[\s\S]*white-space: nowrap/,
  );
  assert.match(
    styles['_enterprise.scss'],
    /\.mega-data-grid \.mega-checkbox input[\s\S]*width: 20px/,
  );
});
