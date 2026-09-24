// tsc keeps the extensionless specifiers from src in the emitted .d.ts files.
// Consumers on moduleResolution node16/nodenext need explicit `.js`, so
// rewrite every relative specifier to the file it resolves to.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = new URL('../dist', import.meta.url).pathname;
const files = readdirSync(root, { recursive: true }).filter((file) =>
  file.endsWith('.d.ts'),
);

for (const file of files) {
  const path = join(root, file);
  const source = readFileSync(path, 'utf8');
  const next = source.replace(
    /((?:from|import\()\s*['"])(\.{1,2}\/[^'"]*)(['"])/g,
    (_, head, specifier, tail) => {
      const base = specifier.replace(/\.(?:tsx?|jsx?)$/, '');
      const resolved = existsSync(join(dirname(path), `${base}.d.ts`))
        ? `${base}.js`
        : existsSync(join(dirname(path), base, 'index.d.ts'))
          ? `${base}/index.js`
          : null;
      if (!resolved) throw new Error(`${file}: cannot resolve ${specifier}`);
      return `${head}${resolved}${tail}`;
    },
  );
  if (next !== source) writeFileSync(path, next);
}
