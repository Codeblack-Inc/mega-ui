import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/#board?full=1');
  const board = page.getByRole('region', {
    name: '릴리스 작업 보드',
    exact: true,
  });
  await expect(board).toBeVisible();
  return board;
}
test('board edits, filters, WIP, undo, save failure, concurrent save and reload', async ({
  page,
}) => {
  const board = await open(page);
  await board.getByRole('button', { name: '카드 추가', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '카드 추가', exact: true });
  await dialog.getByRole('textbox', { name: '카드 이름' }).fill('출시 점검');
  await dialog.getByLabel('카드 열', { exact: true }).selectOption('doing');
  await dialog.getByLabel('카드 담당자', { exact: true }).selectOption('mega');
  await dialog.getByLabel('카드 기한', { exact: true }).fill('2026-09-20');
  await dialog.getByRole('button', { name: '카드 추가', exact: true }).click();
  await expect(board.getByText('출시 점검', { exact: true })).toBeVisible();
  await board.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(board.getByText('출시 점검', { exact: true })).toHaveCount(0);
  await board.getByRole('button', { name: '다시 실행', exact: true }).click();
  await board.getByLabel('카드 검색', { exact: true }).fill('출시');
  await expect(board.locator('[data-board-card]')).toHaveCount(1);
  await board.getByRole('button', { name: '필터 지우기', exact: true }).click();
  await board
    .getByLabel('담당자 필터', { exact: true })
    .selectOption('person:mega');
  await expect(board.locator('[data-board-card]')).toHaveCount(3);
  await board.getByLabel('기한 필터', { exact: true }).fill('2026-09-18');
  await expect(board.locator('[data-board-card]')).toHaveCount(2);
  await board.getByRole('button', { name: '필터 지우기', exact: true }).click();
  await board
    .getByRole('button', { name: '진행 중 열 편집', exact: true })
    .first()
    .click();
  await page
    .getByRole('dialog', { name: '열 편집' })
    .getByLabel('열의 카드 제한', { exact: true })
    .fill('1');
  await page
    .getByRole('dialog', { name: '열 편집' })
    .getByRole('button', { name: '열 변경 적용' })
    .click();
  await expect(
    page.getByRole('dialog', { name: '열 편집' }).getByRole('alert'),
  ).toContainText('제한');
  await page.getByRole('button', { name: '편집 취소', exact: true }).click();
  await page.getByLabel('저장 실패 재현', { exact: true }).check();
  await board.getByRole('button', { name: '보드 저장', exact: true }).click();
  await expect(board.getByRole('alert')).toContainText(
    '보드를 저장하지 못했어요.',
  );
  await expect(board.getByText('출시 점검', { exact: true })).toBeVisible();
  await page.getByLabel('저장 실패 재현', { exact: true }).uncheck();
  await board.getByRole('button', { name: '보드 저장', exact: true }).click();
  await expect(board.getByText('저장한 상태', { exact: true })).toBeVisible();
  await board
    .getByRole('button', { name: '출시 점검 카드 편집', exact: true })
    .click();
  await page.getByLabel('카드 이름', { exact: true }).fill('출시 점검 수정');
  await page
    .getByRole('button', { name: '카드 변경 적용', exact: true })
    .click();
  await board
    .getByRole('button', { name: '저장한 상태로 되돌리기', exact: true })
    .click();
  await page
    .getByRole('button', { name: '보드 교체 적용', exact: true })
    .click();
  await expect(board.getByText('출시 점검', { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: '브라우저 저장본 불러오기', exact: true })
    .click();
  await page
    .getByRole('button', { name: '저장본으로 교체', exact: true })
    .click();
  await expect(board.getByText('출시 점검', { exact: true })).toBeVisible();
});

test('board keyboard, pointer card and column sorting, lane CRUD, JSON replacement and delete preservation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  const board = await open(page);
  const handle = board.getByRole('button', {
    name: '결제 오류 문구 정리 카드 이동',
    exact: true,
  });
  await handle.focus();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(
    board.locator('[data-column-id="doing"] [data-board-card="task-1"]'),
  ).toHaveCount(1);
  await board.getByRole('button', { name: '실행 취소', exact: true }).click();
  await board.getByLabel('구획별 보기', { exact: true }).uncheck();
  const source = board.locator('[data-card-handle="task-1"]');
  const destination = board.locator('[data-board-card="task-2"]');
  await source.scrollIntoViewIfNeeded();
  const a = (await source.boundingBox())!,
    b = (await destination.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height - 4, { steps: 12 });
  await page.mouse.up();
  const ids = await board
    .locator('[data-column-id="backlog"] [data-board-card]')
    .evaluateAll((elements) =>
      elements.map((e) => e.getAttribute('data-board-card')),
    );
  expect(ids.slice(0, 2)).toEqual(['task-2', 'task-1']);
  await board.getByLabel('구획별 보기', { exact: true }).check();
  await board
    .getByRole('button', { name: '검토 대기 열 이동', exact: true })
    .first()
    .focus();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(board.locator('[data-board-slot]').first()).toHaveAttribute(
    'data-column-id',
    'doing',
  );
  await board.getByRole('button', { name: '구획 추가', exact: true }).click();
  await page.getByLabel('구획 이름', { exact: true }).fill('운영');
  await page
    .getByRole('dialog', { name: '구획 추가' })
    .getByRole('button', { name: '구획 추가', exact: true })
    .click();
  await expect(
    board.getByRole('heading', { name: '운영', exact: true }),
  ).toBeVisible();
  const pending = page.waitForEvent('download');
  await board
    .getByRole('button', { name: '보드 파일 내려받기', exact: true })
    .click();
  const download = await pending;
  const json = await readFile((await download.path())!, 'utf8');
  const parsed = JSON.parse(json);
  expect(parsed.columns[0].id).toBe('doing');
  expect(parsed.lanes.at(-1).title).toBe('운영');
  await board.getByLabel('보드 파일 불러오기', { exact: true }).setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  });
  await expect(board.getByRole('alert')).toBeVisible();
  await board.getByLabel('보드 파일 불러오기', { exact: true }).setInputFiles({
    name: 'board.json',
    mimeType: 'application/json',
    buffer: Buffer.from(json),
  });
  await page
    .getByRole('button', { name: '보드 교체 적용', exact: true })
    .click();
  await expect(
    board.getByRole('heading', { name: '운영', exact: true }),
  ).toBeVisible();
  await board
    .getByRole('button', { name: '검토 대기 열 편집', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: '열 삭제', exact: true }).click();
  await page.getByLabel('카드를 옮길 열', { exact: true }).selectOption('done');
  await page.getByRole('button', { name: '삭제 적용', exact: true }).click();
  expect(await board.locator('[data-board-card]').count()).toBe(6);
  await expect(board.locator('[data-column-id="backlog"]')).toHaveCount(0);
});

test('board catalog, dark mobile layout, empty state and 500-card performance', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('mega-docs-theme', 'dark'),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const board = await open(page);
  await board.screenshot({
    path: `test-results/task-board-mobile-${test.info().project.name}.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel('보드 예제 데이터', { exact: true })
    .selectOption('empty');
  await expect(
    board.getByText('열이 없어요. 열을 추가해 카드를 분류해 보세요.'),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  const start = Date.now();
  await page
    .getByLabel('보드 예제 데이터', { exact: true })
    .selectOption('large');
  await expect(board.locator('[data-board-card]')).toHaveCount(500);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(1500);
  console.log(`${test.info().project.name}: 500 cards ${elapsed}ms`);
  const handle = board.locator('[data-card-handle="large-0"]');
  await handle.focus();
  const movedAt = Date.now();
  await handle.press('Alt+ArrowRight');
  await expect(
    board.locator('[data-column-id="doing"] [data-board-card="large-0"]'),
  ).toHaveCount(1);
  const moveTime = Date.now() - movedAt;
  expect(moveTime).toBeLessThan(800);
  console.log(`${test.info().project.name}: 500-card move ${moveTime}ms`);
  await board.screenshot({
    path: `test-results/task-board-desktop-${test.info().project.name}.png`,
  });
  await page.goto('/#components/professional?to=TaskBoard');
  await expect(
    page.getByRole('region', { name: '팀 작업 보드', exact: true }),
  ).toBeVisible();
});

test('save acknowledgement preserves later edits; drag cancel and WIP reject preserve source', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  const board = await open(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await board.getByRole('button', { name: '보드 저장', exact: true }).click();
  await board
    .getByRole('button', { name: '다음 릴리스 준비 카드 편집', exact: true })
    .click();
  await page.getByLabel('카드 이름', { exact: true }).fill('저장 중 추가 편집');
  await page
    .getByRole('button', { name: '카드 변경 적용', exact: true })
    .click();
  await page.clock.runFor(400);
  await expect(
    board.getByText('저장하지 않은 변경', { exact: true }),
  ).toBeVisible();
  await expect(
    board.getByText('저장 중 추가 편집', { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem('mega-task-board-example-v1')!,
      ).cards.find((card: { id: string }) => card.id === 'task-6').title,
  );
  expect(saved).toBe('다음 릴리스 준비');
  await page.clock.resume();
  await board.getByLabel('구획별 보기', { exact: true }).uncheck();
  const handle = board.locator('[data-card-handle="task-1"]');
  await handle.scrollIntoViewIfNeeded();
  const a = (await handle.boundingBox())!;
  await page.mouse.move(a.x + 10, a.y + 10);
  await page.mouse.down();
  await page.mouse.move(a.x + 80, a.y + 20, { steps: 5 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(board.locator('[data-dragging]')).toHaveCount(0);
  await expect(
    board.locator('[data-column-id="backlog"] [data-board-card="task-1"]'),
  ).toHaveCount(1);
  await board
    .getByRole('button', { name: '진행 중 열 편집', exact: true })
    .click();
  await page.getByLabel('열의 카드 제한', { exact: true }).fill('1');
  await page.getByRole('button', { name: '열 변경 적용', exact: true }).click();
  await handle.focus();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(board.getByRole('alert')).toContainText('카드 제한은 1개');
  await expect(
    board.locator('[data-column-id="backlog"] [data-board-card="task-1"]'),
  ).toHaveCount(1);
});

test('touch drag, column pointer order and Kanban search use the canonical board', async ({
  page,
  browser,
  browserName,
}) => {
  await page.goto('/#components/professional');
  await page.getByRole('button', { name: '글로벌 검색 열기' }).click();
  const search = page
    .getByRole('dialog', { name: '글로벌 검색' })
    .getByRole('searchbox');
  await search.fill('Kanban');
  await search.press('Enter');
  await expect(page).toHaveURL(/professional\?to=TaskBoard/);
  await page.setViewportSize({ width: 1440, height: 1200 });
  const board = await open(page);
  await board.getByLabel('구획별 보기', { exact: true }).uncheck();
  const first = board.locator('[data-column-handle="backlog"]');
  const second = board.locator('[data-column-handle="doing"]');
  await first.scrollIntoViewIfNeeded();
  const a = (await first.boundingBox())!,
    b = (await second.boundingBox())!;
  await page.mouse.move(a.x + 10, a.y + 10);
  await page.mouse.down();
  await page.mouse.move(b.x + 10, b.y + 10, { steps: 12 });
  await page.mouse.up();
  await expect(board.locator('[data-board-slot]').first()).toHaveAttribute(
    'data-column-id',
    'doing',
  );
  if (browserName !== 'chromium') return;
  const context = await browser.newContext({
    viewport: { width: 800, height: 1000 },
    hasTouch: true,
    isMobile: true,
  });
  const touch = await context.newPage();
  await touch.goto('http://127.0.0.1:4176/#board?full=1');
  const touchBoard = touch.getByRole('region', {
    name: '릴리스 작업 보드',
    exact: true,
  });
  await touchBoard.getByLabel('구획별 보기', { exact: true }).uncheck();
  const from = touchBoard.locator('[data-card-handle="task-1"]');
  await from.scrollIntoViewIfNeeded();
  const start = (await from.boundingBox())!;
  const target = touchBoard.locator('[data-column-id="doing"]');
  const end = (await target.boundingBox())!;
  const client = await context.newCDPSession(touch);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x + 10, y: start.y + 10 }],
  });
  for (let i = 1; i <= 12; i++)
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: start.x + 10 + ((end.x + 40 - start.x - 10) * i) / 12,
          y: start.y + 10,
        },
      ],
    });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(
    touchBoard.locator('[data-column-id="doing"] [data-board-card="task-1"]'),
  ).toHaveCount(1);
  await context.close();
});

test('card, column and lane dialogs apply edits and preserve cards when deleting a lane', async ({
  page,
}) => {
  const board = await open(page);
  await board.getByRole('button', { name: '열 추가', exact: true }).click();
  await page.getByLabel('열 이름', { exact: true }).fill('보류');
  await page.getByLabel('열의 카드 제한', { exact: true }).fill('2');
  await page
    .getByRole('dialog', { name: '열 추가' })
    .getByRole('button', { name: '열 추가', exact: true })
    .click();
  await expect(
    board.getByRole('heading', { name: '보류', exact: true }).first(),
  ).toBeVisible();
  await board
    .getByRole('button', { name: '제품 구획 편집', exact: true })
    .click();
  await page.getByLabel('구획 이름', { exact: true }).fill('제품 개발');
  await page
    .getByRole('button', { name: '구획 변경 적용', exact: true })
    .click();
  await expect(
    board.getByRole('heading', { name: '제품 개발', exact: true }),
  ).toBeVisible();
  await board
    .getByRole('button', { name: '제품 개발 구획 편집', exact: true })
    .click();
  await page.getByRole('button', { name: '구획 삭제', exact: true }).click();
  await page.getByRole('button', { name: '삭제 적용', exact: true }).click();
  await expect(
    board.getByRole('heading', { name: '제품 개발', exact: true }),
  ).toHaveCount(0);
  expect(await board.locator('[data-board-card]').count()).toBe(6);
  await expect(
    board.locator('[data-lane-id=""] [data-board-card="task-1"]'),
  ).toHaveCount(1);
  await board
    .getByRole('button', { name: '결제 오류 문구 정리 카드 편집', exact: true })
    .click();
  await page.getByRole('button', { name: '카드 삭제', exact: true }).click();
  await page.getByRole('button', { name: '삭제 적용', exact: true }).click();
  await expect(board.locator('[data-board-card="task-1"]')).toHaveCount(0);
  await board.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(board.locator('[data-board-card="task-1"]')).toHaveCount(1);
});

test('card bodies drag across columns and auto-scroll to lanes at a normal viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const board = await open(page);
  const card = board.locator('[data-board-card="task-6"]');
  const source = await card.locator('strong').boundingBox();
  expect(source).not.toBeNull();
  const destination = board.locator(
    '[data-column-id="doing"][data-lane-id=""]',
  );
  const box = await destination.boundingBox();
  await page.mouse.move(source!.x + 20, source!.y + 10);
  await page.mouse.down();
  await page.mouse.move(box!.x + 100, source!.y + 10, { steps: 15 });
  await expect(page.locator('.mega-task-board__drag-preview')).toContainText(
    '진행 중 · 미분류에 놓기',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('.mega-task-board__drag-preview')).toHaveCount(0);
  await page.mouse.up();
  await expect(destination.locator('[data-board-card="task-6"]')).toHaveCount(
    0,
  );
  await page.mouse.move(source!.x + 20, source!.y + 10);
  await page.mouse.down();
  await page.mouse.move(box!.x + 100, source!.y + 10, { steps: 15 });
  await page.mouse.up();
  await expect(destination.locator('[data-board-card="task-6"]')).toHaveCount(
    1,
  );
  await expect(page.locator('.mega-task-board__drag-preview')).toHaveCount(0);

  // Keep swimlanes enabled and reach a lane that initially lies below the viewport.
  await card.locator('strong').scrollIntoViewIfNeeded();
  const start = await card.locator('strong').boundingBox();
  await page.mouse.move(start!.x + 20, start!.y + 10);
  await page.mouse.down();
  await page.mouse.move(start!.x + 20, 710, { steps: 15 });
  const platform = board.locator(
    '[data-column-id="doing"][data-lane-id="platform"]',
  );
  await expect
    .poll(async () => {
      const bounds = await platform.boundingBox();
      return bounds!.y;
    })
    .toBeLessThan(560);
  const target = await platform.boundingBox();
  await page.mouse.move(target!.x + 90, target!.y + 65, { steps: 10 });
  await page.mouse.up();
  await expect(platform.locator('[data-board-card="task-6"]')).toHaveCount(1);
  await expect(board.locator('[data-board-card]')).toHaveCount(6);
  await board.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(destination.locator('[data-board-card="task-6"]')).toHaveCount(
    1,
  );
});

test('visible keyboard order, interactive controls and blocked pointer drops preserve cards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const board = await open(page);
  await board.getByLabel('구획별 보기').uncheck();
  const backlog = board.locator('[data-board-slot][data-column-id="backlog"]');
  await board.locator('[data-card-handle="task-6"]').press('Alt+ArrowUp');
  expect(
    await backlog
      .locator('[data-board-card]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-board-card')),
      ),
  ).toEqual(['task-1', 'task-6', 'task-2']);
  await board
    .getByRole('button', { name: '진행 중 열 편집', exact: true })
    .click();
  await expect(page.locator('.mega-task-board__drag-preview')).toHaveCount(0);
  const dialog = page.getByRole('dialog', { name: '열 편집', exact: true });
  await dialog.getByLabel('열의 카드 제한').fill('1');
  await dialog.getByRole('button', { name: '열 변경 적용' }).click();
  const card = backlog.locator('[data-board-card="task-1"]');
  await card.locator('strong').scrollIntoViewIfNeeded();
  const start = await card.locator('strong').boundingBox();
  const destination = await board
    .locator('[data-board-slot][data-column-id="doing"]')
    .boundingBox();
  await page.mouse.move(start!.x + 20, start!.y + 10);
  await page.mouse.down();
  await page.mouse.move(destination!.x + 100, start!.y + 10, { steps: 15 });
  await expect(page.locator('.mega-task-board__drag-preview')).toContainText(
    '열의 카드 제한에 도달했어요.',
  );
  await page.mouse.up();
  await expect(card).toHaveCount(1);
  await expect(board.getByRole('alert')).toContainText('제한');
  await expect(board.locator('[data-board-card]')).toHaveCount(6);
});

test('drag cancellation restores focus, boundaries announce and empty slots show an insertion line', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const board = await open(page);
  const handle = board.locator('[data-card-handle="task-6"]');
  await handle.click();
  await expect(handle).toBeFocused();
  await handle.press('Alt+ArrowUp');
  await expect(
    board.locator('.mega-visually-hidden[role="status"]'),
  ).toHaveText('이미 첫 번째 카드예요.');
  await handle.press('Alt+ArrowLeft');
  await expect(
    board.locator('.mega-visually-hidden[role="status"]'),
  ).toHaveText('이미 첫 번째 열이에요.');
  const start = await handle.boundingBox();
  await page.mouse.move(start!.x + 10, start!.y + 10);
  await page.mouse.down();
  await page.mouse.move(640, 120, { steps: 10 });
  await page.mouse.up();
  await expect(handle).toBeFocused();
  await expect(
    board.locator('.mega-visually-hidden[role="status"]'),
  ).toHaveText('이동을 취소했어요.');
  const source = await handle.boundingBox();
  const destination = await board
    .locator('[data-column-id="review"][data-lane-id=""]')
    .boundingBox();
  await page.mouse.move(source!.x + 10, source!.y + 10);
  await page.mouse.down();
  await page.mouse.move(destination!.x + 90, source!.y + 10, { steps: 10 });
  await expect(page.locator('.mega-task-board__drag-preview')).toContainText(
    '리뷰 · 미분류에 놓기',
  );
  const marker = board.locator('ul[data-drop-end]');
  await expect(marker).toHaveCount(1);
  expect(
    await marker.evaluate((node) => getComputedStyle(node, '::after').height),
  ).toBe('3px');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(handle).toBeFocused();
});
