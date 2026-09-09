import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { checkCopy, checkPaths } from '../docs/check-ux-writing.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('copy checker rejects known violations, handles nested files and fails closed', () => {
  for (const [copy, rule] of [
    ['진행하시겠습니까?', 'UX001'],
    ['성공적으로 저장했어요', 'UX002'],
    ['지금 안 하면 손해예요', 'UX003'],
    ['<Button>\n확인\n</Button>', 'UX004'],
    ['<Button>{"확인하기"}</Button>', 'UX004'],
    ['{"label":"확인"}', 'UX004'],
  ])
    assert.ok(
      checkCopy(copy).some((message) => message.includes(rule)),
      copy,
    );
  assert.deepEqual(checkCopy('<Button>문서 삭제</Button>'), []);
  assert.deepEqual(
    checkCopy('이메일을 입력해 주세요. 저장하지 못했어요. 다시 시도해 주세요.'),
    [],
  );
  assert.deepEqual(checkCopy('<Input label="새 비밀번호 확인" />'), []);
  assert.match(
    checkCopy('\n성공적으로 저장했어요', 'example.tsx')[0],
    /example.tsx:2 UX002/,
  );
  const dir = mkdtempSync(join(tmpdir(), 'mega-ux-'));
  const run = (...paths) =>
    spawnSync(
      process.execPath,
      [join(root, 'docs/check-ux-writing.mjs'), ...paths],
      { encoding: 'utf8' },
    );
  try {
    assert.notEqual(run().status, 0);
    assert.notEqual(run(dir).status, 0);
    assert.notEqual(run(join(dir, 'missing')).status, 0);
    mkdirSync(join(dir, 'nested'));
    const file = join(dir, 'nested/ko.json');
    writeFileSync(file, '{"action":"확인"}');
    assert.notEqual(run(dir).status, 0);
    assert.match(run(dir).stderr, /ko.json:1 UX004/);
    writeFileSync(file, '{"action":"문서 삭제"}');
    assert.equal(run(dir).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('component defaults and examples follow the static UX writing contract', () => {
  assert.deepEqual(checkPaths([join(root, 'src'), join(root, 'examples')]), []);
});
