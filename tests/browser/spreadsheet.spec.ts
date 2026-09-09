import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/#spreadsheet?full=1');
  const view = page.getByRole('region', { name: '9월 매출 시트', exact: true });
  await expect(view).toBeVisible();
  return view;
}
const cell = (
  view: ReturnType<typeof open> extends Promise<infer T> ? T : never,
  ref: string,
) => view.locator(`[data-ref="${ref}"]`);

test('sheet edits cells, recalculates formulas and reports a circular reference', async ({
  page,
}) => {
  const view = await open(page);
  await expect(cell(view, 'D2')).toHaveText('4,080,000원');
  await cell(view, 'C2').click();
  await page.keyboard.type('400');
  await page.keyboard.press('Enter');
  await expect(cell(view, 'D2')).toHaveText('4,800,000원');
  await expect(cell(view, 'D6')).toHaveText('10,460,000원');
  await cell(view, 'D2').click();
  await expect(view.getByLabel('수식 입력줄', { exact: true })).toHaveValue(
    '=B2*C2',
  );
  await cell(view, 'G2').click();
  await page.keyboard.type('=G3+1');
  await page.keyboard.press('Enter');
  await page.keyboard.type('=G2+1');
  await page.keyboard.press('Enter');
  await expect(cell(view, 'G2')).toHaveText('#순환!');
  await expect(cell(view, 'G3')).toHaveText('#순환!');
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(cell(view, 'G2')).toHaveText('');
  await cell(view, 'A2').click();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Delete');
  await expect(cell(view, 'A2')).toHaveText('');
  await expect(cell(view, 'D2')).toHaveText('0원');
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(cell(view, 'A2')).toHaveText('온라인');
});

test('sheet fills a range, pastes tab separated text and sorts values', async ({
  page,
}) => {
  const view = await open(page);
  await cell(view, 'G1').click();
  await page.keyboard.type('1');
  await page.keyboard.press('Enter');
  await page.keyboard.type('3');
  await page.keyboard.press('Enter');
  await cell(view, 'G1').click();
  await page.keyboard.press('Shift+ArrowDown');
  const handle = view.locator('[data-fill-handle]');
  const from = (await handle.boundingBox())!;
  const to = (await cell(view, 'G5').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(cell(view, 'G5')).toHaveText('9');
  await cell(view, 'A10').click();
  await page.evaluate(() => {
    const grid = document.querySelector('.mega-spreadsheet__grid')!;
    const data = new DataTransfer();
    data.setData('text/plain', '나\t2\n가\t1\n다\t3');
    // Firefox ignores clipboardData in the ClipboardEvent constructor.
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: data });
    grid.dispatchEvent(event);
  });
  await expect(cell(view, 'A10')).toHaveText('나');
  await expect(cell(view, 'B12')).toHaveText('3');
  await cell(view, 'A10').click();
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowRight');
  await view
    .getByRole('button', { name: '오름차순 정렬', exact: true })
    .click();
  await expect(cell(view, 'A10')).toHaveText('가');
  await expect(cell(view, 'A12')).toHaveText('다');
});

test('sheet merges, freezes, filters rows and switches sheets', async ({
  page,
}) => {
  const view = await open(page);
  await cell(view, 'A8').click();
  await page.keyboard.press('Shift+ArrowRight');
  await view.getByRole('button', { name: '셀 병합', exact: true }).click();
  await expect(cell(view, 'A8')).toHaveAttribute('style', /width: 248px/);
  await view.getByRole('button', { name: '병합 해제', exact: true }).click();
  await expect(cell(view, 'A8')).not.toHaveAttribute('style', /width: 248px/);
  await view.getByLabel('행 필터', { exact: true }).fill('매장');
  await expect(view.locator('[data-row="1"]')).toHaveCount(0);
  await expect(view.locator('[data-row="2"]')).toHaveCount(1);
  await view.getByLabel('행 필터', { exact: true }).fill('');
  await view.getByRole('tab', { name: '요약', exact: true }).click();
  await expect(cell(view, 'B2')).toHaveText('9,740,000원');
  await expect(cell(view, 'B4')).toHaveText('13,750원');
  await view.getByRole('button', { name: '시트 추가', exact: true }).click();
  await expect(view.getByRole('tab')).toHaveCount(3);
  await view.getByRole('button', { name: '시트 삭제', exact: true }).click();
  await expect(view.getByRole('tab')).toHaveCount(2);
});

test('sheet exports CSV and xlsx and reads the file back', async ({ page }) => {
  const view = await open(page);
  const csv = page.waitForEvent('download');
  await view.getByRole('button', { name: 'CSV 내려받기', exact: true }).click();
  const csvText = await readFile(await (await csv).path(), 'utf8');
  expect(csvText).toContain('채널,단가,수량,매출');
  expect(csvText).toContain('"4,080,000원"');
  const xlsx = page.waitForEvent('download');
  await view
    .getByRole('button', { name: 'xlsx 내려받기', exact: true })
    .click();
  const file = await (await xlsx).path();
  const bytes = await readFile(file);
  expect(bytes[0]).toBe(0x50);
  expect(bytes[1]).toBe(0x4b);
  await view
    .getByLabel('시트 파일 불러오기', { exact: true })
    .setInputFiles(file);
  await page.getByRole('button', { name: '파일로 교체', exact: true }).click();
  // xlsx carries values and formulas; cell formats stay behind by design.
  await expect(cell(view, 'D2')).toHaveText('4080000');
  await cell(view, 'D2').click();
  await expect(view.getByLabel('수식 입력줄', { exact: true })).toHaveValue(
    '=B2*C2',
  );
});

test('sheet saves, recovers from a failure and reopens the stored file', async ({
  page,
}) => {
  const view = await open(page);
  await cell(view, 'H3').click();
  await page.keyboard.type('검토 완료');
  await page.keyboard.press('Enter');
  await page.getByLabel('저장 실패 재현', { exact: true }).check();
  await view.getByRole('button', { name: '시트 저장', exact: true }).click();
  await expect(view.getByRole('alert')).toContainText('저장하지 못했어요');
  await expect(cell(view, 'H3')).toHaveText('검토 완료');
  await page.getByLabel('저장 실패 재현', { exact: true }).uncheck();
  await view.getByRole('button', { name: '시트 저장', exact: true }).click();
  await expect(view.getByText('저장한 상태', { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: '브라우저 저장본 불러오기', exact: true })
    .click();
  await page
    .getByRole('button', { name: '저장본으로 교체', exact: true })
    .click();
  await expect(cell(view, 'H3')).toHaveText('검토 완료');
});

test('sheet catalog, dark mobile layout and 500-row performance', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('mega-docs-theme', 'dark'),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const view = await open(page);
  await view.screenshot({
    path: `test-results/spreadsheet-mobile-${test.info().project.name}.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const start = Date.now();
  await page
    .getByLabel('시트 예제 데이터', { exact: true })
    .selectOption('large');
  await expect(cell(view, 'D2')).toHaveText('1,000원');
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(2500);
  console.log(`${test.info().project.name}: 500 rows ${elapsed}ms`);
  // Only the visible window renders, not all 500 rows.
  expect(await view.locator('.mega-spreadsheet__row').count()).toBeLessThan(80);
  await page.goto('/#components/professional?to=SpreadsheetPro');
  await expect(
    page.getByRole('region', { name: '9월 매출 시트', exact: true }),
  ).toBeVisible();
});
