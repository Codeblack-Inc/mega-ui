import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const rules = [
  [
    'UX001',
    /하십시오|하시겠습니까|바랍니다/gu,
    '쉽고 자연스러운 해요체로 바꾸세요.',
  ],
  [
    'UX002',
    /성공적으로|정상적으로|정말\s+삭제/gu,
    '의미 없는 수식어를 덜어내세요.',
  ],
  [
    'UX003',
    /지금\s*안\s*하면|놓치면\s*손해|혜택\s*포기/gu,
    '사실과 중립적인 선택을 안내하세요.',
  ],
  [
    'UX004',
    /(?:["'`]\s*(?:확인|확인하기|진행|클릭|여기)\s*["'`]|>\s*(?:확인|확인하기|진행|클릭|여기)\s*<)/gu,
    '닫기, 읽음으로 표시 등 실제 행동이나 대상을 쓰세요.',
  ],
];

// ponytail: lexical checks catch known phrases only; use an AST/data-flow lint if contextual false positives grow.
export function checkCopy(source, file = '<source>') {
  return rules.flatMap(([id, pattern, suggestion]) =>
    [...source.matchAll(pattern)].map((match) => {
      const line = source.slice(0, match.index).split('\n').length;
      return `${file}:${line} ${id} ${match[0].trim()} — ${suggestion}`;
    }),
  );
}

function filesAt(path) {
  if (statSync(path).isDirectory()) {
    return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
      entry.isSymbolicLink() ||
      ['node_modules', '.git', 'dist', 'site'].includes(entry.name)
        ? []
        : filesAt(resolve(path, entry.name)),
    );
  }
  return /\.(?:[cm]?[jt]sx?|json)$/.test(path) ? [path] : [];
}

export function checkPaths(paths) {
  return paths.flatMap((path) => {
    const files = filesAt(resolve(path));
    if (!files.length)
      throw new Error(`${path}: 검사할 JS/TS/JSON 파일이 없어요.`);
    return files.flatMap((file) => checkCopy(readFileSync(file, 'utf8'), file));
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const paths = process.argv.slice(2);
    if (!paths.length)
      throw new Error(
        '검사 경로를 지정하세요. 예: node docs/check-ux-writing.mjs src examples',
      );
    const violations = checkPaths(paths);
    if (violations.length) {
      console.error(violations.join('\n'));
      process.exitCode = 1;
    } else {
      console.log(
        'UX 라이팅 정적 검사 통과. docs/ux-writing.md의 의미 검토도 완료하세요.',
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
