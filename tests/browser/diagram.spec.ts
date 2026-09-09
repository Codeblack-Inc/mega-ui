import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/#diagram?full=1');
  const view = page.getByRole('region', {
    name: '주문 처리 흐름',
    exact: true,
  });
  await expect(view).toBeVisible();
  return view;
}
const node = (
  view: ReturnType<typeof open> extends Promise<infer T> ? T : never,
  id: string,
) => view.locator(`[data-node-id="${id}"]`);

test('diagram edits a node, connects ports, refuses a bad link and undoes', async ({
  page,
}) => {
  const view = await open(page);
  await expect(view.locator('[data-node-id]')).toHaveCount(6);
  await expect(view.locator('[data-edge-id]')).toHaveCount(6);
  await node(view, 'pack').click();
  await expect(view.getByRole('heading', { name: '노드 편집' })).toBeVisible();
  await view.getByLabel('노드 이름', { exact: true }).fill('포장·검수');
  await view.getByLabel('노드 종류', { exact: true }).click();
  await expect(node(view, 'pack')).toHaveAttribute(
    'aria-label',
    /포장·검수 노드/,
  );
  await view
    .getByLabel('노드 메모', { exact: true })
    .fill('파손 여부를 확인해요.');
  await view.getByLabel('노드 이름', { exact: true }).click();
  const from = (await node(view, 'done')
    .locator('[data-port-id="out"]')
    .boundingBox())!;
  const to = (await node(view, 'intake')
    .locator('[data-port-id="in"]')
    .boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(view.locator('[data-edge-id]')).toHaveCount(7);
  const self = (await node(view, 'ship')
    .locator('[data-port-id="out"]')
    .boundingBox())!;
  const selfIn = (await node(view, 'ship')
    .locator('[data-port-id="in"]')
    .boundingBox())!;
  await page.mouse.move(self.x + self.width / 2, self.y + self.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    selfIn.x + selfIn.width / 2,
    selfIn.y + selfIn.height / 2,
    {
      steps: 8,
    },
  );
  await page.mouse.up();
  await expect(view.getByRole('alert')).toContainText(
    '같은 노드끼리는 연결할 수 없어요',
  );
  await expect(view.locator('[data-edge-id]')).toHaveCount(7);
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(view.locator('[data-edge-id]')).toHaveCount(6);
  await view.getByRole('button', { name: '다시 실행', exact: true }).click();
  await expect(view.locator('[data-edge-id]')).toHaveCount(7);
});

test('diagram drags, selects with a marquee, moves with the keyboard and deletes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const view = await open(page);
  const before = await node(view, 'intake').getAttribute('transform');
  const box = (await node(view, 'intake').locator('rect').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 120, {
    steps: 12,
  });
  await page.mouse.up();
  const after = await node(view, 'intake').getAttribute('transform');
  expect(after).not.toEqual(before);
  const [, x, y] = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(after ?? '')!;
  expect(Number(x) % 16).toBe(0);
  expect(Number(y) % 16).toBe(0);
  expect(Number(y)).toBeGreaterThan(160);
  await node(view, 'intake').focus();
  await page.keyboard.press('ArrowRight');
  const moved = /translate\((-?[\d.]+) /.exec(
    (await node(view, 'intake').getAttribute('transform')) ?? '',
  )!;
  expect(Number(moved[1])).toBe(Number(x) + 16);
  const stage = (await view.locator('.mega-diagram__canvas').boundingBox())!;
  await page.mouse.move(stage.x + 12, stage.y + 12);
  await page.mouse.down();
  await page.mouse.move(
    stage.x + stage.width - 20,
    stage.y + stage.height - 20,
    {
      steps: 15,
    },
  );
  await page.mouse.up();
  await expect(view.getByRole('heading', { name: /개 선택/ })).toBeVisible();
  await view.getByRole('button', { name: '선택 삭제', exact: true }).click();
  await page
    .getByRole('dialog', { name: '선택한 항목을 삭제할까요?' })
    .getByRole('button', { name: '삭제', exact: true })
    .click();
  await expect(view.locator('[data-node-id]')).toHaveCount(0);
  await expect(view.locator('[data-edge-id]')).toHaveCount(0);
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(view.locator('[data-node-id]')).toHaveCount(6);
});

test('diagram adds nodes, lays them out, zooms and keeps the file round trip', async ({
  page,
}) => {
  const view = await open(page);
  await view.getByRole('button', { name: '분기 추가', exact: true }).click();
  await expect(view.locator('[data-node-id]')).toHaveCount(7);
  await expect(view.getByLabel('노드 이름', { exact: true })).toHaveValue(
    '분기',
  );
  await view.getByRole('button', { name: '자동 배치', exact: true }).click();
  await expect(view.locator('[data-node-id="intake"]')).toHaveAttribute(
    'transform',
    'translate(40 40)',
  );
  await view.getByRole('button', { name: '확대', exact: true }).click();
  await expect(view.locator('.mega-diagram__zoom span')).not.toHaveText('100%');
  await view.getByRole('button', { name: '전체 맞추기', exact: true }).click();
  const download = page.waitForEvent('download');
  await view
    .getByRole('button', { name: 'JSON 내려받기', exact: true })
    .click();
  const file = await (await download).path();
  const json = JSON.parse(await readFile(file, 'utf8'));
  expect(json.nodes).toHaveLength(7);
  expect(json.nodes[0].ports).toHaveLength(2);
  const svg = page.waitForEvent('download');
  await view.getByRole('button', { name: 'SVG 내려받기', exact: true }).click();
  const exported = await readFile(await (await svg).path(), 'utf8');
  expect(exported).toContain('<svg');
  expect(exported).toContain('주문 접수');
  expect(exported).not.toContain('mega-diagram__grid');
  await view
    .getByLabel('다이어그램 파일 불러오기', { exact: true })
    .setInputFiles(file);
  await page.getByRole('button', { name: '파일로 교체', exact: true }).click();
  await expect(view.locator('[data-node-id]')).toHaveCount(7);
});

test('diagram saves, recovers from a failure and reopens the stored file', async ({
  page,
}) => {
  const view = await open(page);
  await node(view, 'ship').click();
  await view.getByLabel('노드 이름', { exact: true }).fill('출고 준비');
  await view.getByLabel('노드 메모', { exact: true }).click();
  await page.getByLabel('저장 실패 재현', { exact: true }).check();
  await view
    .getByRole('button', { name: '다이어그램 저장', exact: true })
    .click();
  await expect(view.getByRole('alert')).toContainText('저장하지 못했어요');
  await expect(node(view, 'ship')).toHaveAttribute(
    'aria-label',
    /출고 준비 노드/,
  );
  await page.getByLabel('저장 실패 재현', { exact: true }).uncheck();
  await view
    .getByRole('button', { name: '다이어그램 저장', exact: true })
    .click();
  await expect(view.getByText('저장한 상태', { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: '브라우저 저장본 불러오기', exact: true })
    .click();
  await page
    .getByRole('button', { name: '저장본으로 교체', exact: true })
    .click();
  await expect(node(view, 'ship')).toHaveAttribute(
    'aria-label',
    /출고 준비 노드/,
  );
});

test('diagram catalog card, dark mobile layout and 60-node performance', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('mega-docs-theme', 'dark'),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const view = await open(page);
  await expect(view.locator('.mega-diagram__minimap')).toBeVisible();
  await view.screenshot({
    path: `test-results/diagram-mobile-${test.info().project.name}.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const start = Date.now();
  await page
    .getByLabel('다이어그램 예제 데이터', { exact: true })
    .selectOption('large');
  await expect(view.locator('[data-node-id]')).toHaveCount(60);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(1500);
  console.log(`${test.info().project.name}: 60 nodes ${elapsed}ms`);
  await page
    .getByLabel('다이어그램 예제 데이터', { exact: true })
    .selectOption('empty');
  await expect(
    view.getByText('선택한 항목 없음', { exact: true }),
  ).toBeVisible();
  await page.goto('/#components/professional?to=DiagramEditor');
  await expect(
    page.getByRole('region', { name: '주문 처리 흐름', exact: true }),
  ).toBeVisible();
});
