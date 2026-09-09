import { test, expect, type Page } from '@playwright/test';
const cell = (page: Page, row: number, key: string) =>
  page.locator(
    `[data-pro-row="ORD-${String(row).padStart(6, '0')}"][data-pro-column="${key}"]`,
  );
const clipboard = async (page: Page, text: string) => {
  await page
    .locator('[role="grid"], [role="treegrid"]')
    .evaluate((grid, text) => {
      const transfer = new DataTransfer();
      transfer.setData('text/plain', text);
      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'clipboardData', { value: transfer });
      (document.activeElement ?? grid).dispatchEvent(event);
    }, text);
};
test.beforeEach(async ({ page }) => {
  await page.goto('/#data-grid-pro?full=1');
  await expect(page.getByRole('grid', { name: '주문 원장' })).toBeVisible();
});
test('edit, undo/redo, failed save, retry and reload preserve the document', async ({
  page,
}) => {
  await cell(page, 1, 'customer').dblclick();
  await page.getByLabel('고객 편집').fill('새 고객');
  await page.getByLabel('고객 편집').press('Enter');
  await expect(cell(page, 1, 'customer')).toHaveText('새 고객');
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(cell(page, 1, 'customer')).toHaveText('고객 1');
  await page.getByRole('button', { name: '다시 실행', exact: true }).click();
  await expect(cell(page, 1, 'customer')).toHaveText('새 고객');
  await page.getByLabel('저장 실패 시뮬레이션').check();
  await page
    .getByRole('button', { name: '변경 저장 (1)', exact: true })
    .click();
  await expect(page.getByText(/변경 사항을 저장하지 못했어요/)).toBeVisible();
  await expect(cell(page, 1, 'customer')).toHaveText('새 고객');
  await page.getByLabel('저장 실패 시뮬레이션').uncheck();
  await page
    .getByRole('button', { name: '변경 저장 (1)', exact: true })
    .click();
  await expect(page.getByText(/^저장했어요\./)).toBeVisible();
  await page.reload();
  await expect(cell(page, 1, 'customer')).toHaveText('새 고객');
});
test('range paste is atomic, rejects readonly/invalid cells, and cancellation restores data', async ({
  page,
}) => {
  await cell(page, 1, 'quantity').click();
  await clipboard(page, '8\t2000\n9\t3000');
  await expect(cell(page, 1, 'quantity')).toHaveText('8');
  await expect(cell(page, 2, 'price')).toHaveText('3000');
  await cell(page, 1, 'quantity').click();
  await clipboard(page, '-1\t2000\n6\t3000');
  await expect(
    page.getByRole('alert').filter({ hasText: '수량은' }),
  ).toBeVisible();
  await expect(cell(page, 2, 'quantity')).toHaveText('9');
  await page.getByRole('button', { name: '변경 취소', exact: true }).click();
  await page
    .getByRole('button', { name: '변경 취소 확인', exact: true })
    .click();
  await expect(cell(page, 1, 'quantity')).toHaveText('1');
  await cell(page, 1, 'id').click();
  await clipboard(page, 'oops');
  await expect(page.getByText(/수정할 수 없는 셀/)).toBeVisible();
  await expect(cell(page, 1, 'id')).toHaveText('ORD-000001');
});
test('shift range selection, copy and fill a rectangle', async ({ page }) => {
  await cell(page, 1, 'quantity').click();
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.getByText(/선택 범위 2행 × 2열/)).toBeVisible();
  const copied = await page.locator('[role="grid"]').evaluate((grid) => {
    const transfer = new DataTransfer();
    const event = new ClipboardEvent('copy', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'clipboardData', { value: transfer });
    (document.activeElement ?? grid).dispatchEvent(event);
    return transfer.getData('text/plain');
  });
  expect(copied).toBe('1\t1000\r\n2\t2000');
  await clipboard(page, '5');
  await expect(cell(page, 1, 'quantity')).toHaveText('5');
  await expect(cell(page, 2, 'price')).toHaveText('5');
});
test('filters, column state, grouping and aggregates work together', async ({
  page,
}) => {
  await page.getByRole('button', { name: '필터', exact: true }).click();
  await page.getByLabel('필터 열', { exact: true }).selectOption('team');
  await page.getByLabel('필터 연산').selectOption('equals');
  await page.getByLabel('필터 값').fill('제품');
  await page.getByRole('button', { name: '조건 추가' }).click();
  await expect(page.getByText(/조회 667건/)).toBeVisible();
  await page.getByRole('button', { name: '열 설정', exact: true }).click();
  await page.getByLabel('담당 팀 그룹', { exact: true }).check();
  await expect(page.getByRole('treegrid')).toBeVisible();
  await page.getByRole('button', { name: '모두 펼치기' }).click();
  await expect(cell(page, 1, 'customer')).toBeVisible();
  await page.getByRole('button', { name: '보기 저장', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('treegrid')).toBeVisible();
  await expect(page.getByText(/조회 667건/)).toBeVisible();
});
test('server pagination, filtering and cross-page row selection retain state', async ({
  page,
}) => {
  await page.getByLabel('데이터 모드').selectOption('server');
  await expect(cell(page, 1, 'customer')).toBeVisible();
  await page
    .locator('[role="row"]')
    .filter({ has: cell(page, 1, 'id') })
    .getByRole('checkbox')
    .check();
  await page.getByRole('button', { name: '다음 페이지', exact: true }).click();
  await expect(cell(page, 101, 'customer')).toBeVisible();
  await expect(page.getByText(/선택 1건/)).toBeVisible();
  await page.getByLabel('주문 원장 검색', { exact: true }).fill('고객 1999');
  await expect(cell(page, 1999, 'customer')).toBeVisible();
  await expect(page.getByText(/조회 1건/)).toBeVisible();
});
test('tree expands real parent rows and preserves ancestors during filtering', async ({
  page,
}) => {
  await page.getByLabel('데이터 모드').selectOption('tree');
  await expect(page.getByRole('treegrid')).toBeVisible();
  await expect(cell(page, 2, 'customer')).toHaveCount(0);
  await page
    .getByRole('button', { name: '고객 1 펼치기', exact: true })
    .click();
  await expect(cell(page, 2, 'customer')).toBeVisible();
  await page.getByLabel('주문 원장 검색', { exact: true }).fill('고객 2');
  await expect(cell(page, 1, 'customer')).toBeVisible();
  await expect(cell(page, 2, 'customer')).toBeVisible();
});
test('100k rows stay virtualized and the last row remains reachable', async ({
  page,
}) => {
  const start = Date.now();
  await page.getByLabel('데이터 규모').selectOption('100000');
  await expect(page.getByText(/조회 100,000건/)).toBeVisible();
  expect(await page.locator('[role="row"]').count()).toBeLessThan(80);
  await page.getByRole('grid').evaluate((grid) => {
    grid.scrollTop = grid.scrollHeight;
  });
  await expect(cell(page, 100000, 'id')).toBeVisible();
  expect(Date.now() - start).toBeLessThan(10000);
});

test('invalid editor input and Korean composition never commit prematurely', async ({
  page,
}) => {
  await cell(page, 1, 'quantity').dblclick();
  const input = page.getByLabel('수량 편집');
  await input.fill('-1');
  await input.press('Enter');
  await expect(input).toHaveValue('-1');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.press('Escape');
  await expect(cell(page, 1, 'quantity')).toHaveText('1');
  await cell(page, 1, 'customer').dblclick();
  const name = page.getByLabel('고객 편집');
  await name.fill('한글 입력');
  await name.dispatchEvent('compositionstart');
  await name.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await expect(name).toBeVisible();
  await name.dispatchEvent('compositionend', { data: '력' });
  await name.press('Enter');
  await expect(cell(page, 1, 'customer')).toHaveText('한글 입력');
});
test('drafts survive server pages and save as one batch', async ({ page }) => {
  await page.getByLabel('데이터 모드').selectOption('server');
  await expect(cell(page, 1, 'customer')).toBeVisible();
  await cell(page, 1, 'customer').dblclick();
  await page.getByLabel('고객 편집').fill('첫 페이지 편집');
  await page.getByLabel('고객 편집').press('Enter');
  await page.getByRole('button', { name: '다음 페이지', exact: true }).click();
  await expect(cell(page, 101, 'customer')).toBeVisible();
  await cell(page, 101, 'customer').dblclick();
  await page.getByLabel('고객 편집').fill('다음 페이지 편집');
  await page.getByLabel('고객 편집').press('Enter');
  await page
    .getByRole('button', { name: '변경 저장 (2)', exact: true })
    .click();
  await expect(page.getByText(/^저장했어요\./)).toBeVisible();
  await page.getByRole('button', { name: '이전 페이지', exact: true }).click();
  await expect(cell(page, 1, 'customer')).toHaveText('첫 페이지 편집');
  await page.reload();
  await expect(cell(page, 1, 'customer')).toHaveText('첫 페이지 편집');
  await page.getByRole('button', { name: '다음 페이지', exact: true }).click();
  await expect(cell(page, 101, 'customer')).toHaveText('다음 페이지 편집');
});
test('column hiding, frozen edges, keyboard reorder and numeric multi-sort persist', async ({
  page,
}) => {
  await page.getByRole('columnheader', { name: '수량', exact: true }).click();
  await page
    .getByRole('columnheader', { name: '단가', exact: true })
    .click({ modifiers: ['ControlOrMeta'] });
  await page.getByRole('button', { name: '보기 저장', exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('mega-grid-pro-view-v1')!).sorts,
    ),
  ).toEqual([
    { columnKey: 'quantity', direction: 'ASC' },
    { columnKey: 'price', direction: 'ASC' },
  ]);
  await page.getByRole('button', { name: '열 설정', exact: true }).click();
  await page.getByLabel('고객 너비', { exact: true }).fill('240');
  await page.getByLabel('고객 고정', { exact: true }).selectOption('end');
  await page.getByRole('button', { name: '단가 앞으로', exact: true }).click();
  await page.getByRole('checkbox', { name: '납기일', exact: true }).uncheck();
  await expect(
    page.getByRole('columnheader', { name: '납기일', exact: true }),
  ).toHaveCount(0);
  await expect(cell(page, 1, 'customer')).toHaveClass(/rdg-cell-frozen-end/);
  await page.getByRole('button', { name: '보기 저장', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('columnheader', { name: '납기일', exact: true }),
  ).toHaveCount(0);
  await expect(cell(page, 1, 'customer')).toHaveClass(/rdg-cell-frozen-end/);
});
test('source conflicts preserve drafts and readonly grids cannot accept paste', async ({
  page,
}) => {
  await page.goto('/data-grid-test.html');
  const first = page.getByRole('region', { name: '검증 원장 작업 영역' });
  const memo = first.locator('[data-pro-row="1"][data-pro-column="note"]');
  await memo.dblclick();
  await first.getByLabel('메모 편집').fill('편집 초안');
  await first.getByLabel('메모 편집').press('Enter');
  await page
    .getByRole('button', { name: '외부 원본 변경', exact: true })
    .click();
  await expect(memo).toHaveText('편집 초안');
  await expect(first.getByRole('alert')).toContainText('원본 값이 바뀌었어요');
  await expect(
    first.getByRole('button', { name: '변경 저장 (1)', exact: true }),
  ).toBeDisabled();
  const second = page.getByRole('region', { name: '읽기 전용 원장 작업 영역' });
  await second.locator('[data-pro-row="1"][data-pro-column="name"]').dblclick();
  await expect(second.getByRole('textbox')).toHaveCount(0);
  await expect(second.getByRole('button', { name: /변경 저장/ })).toHaveCount(
    0,
  );
});
test('large grids support keyboard jumps, editing at the end, grouping and export', async ({
  page,
}) => {
  await page.getByLabel('데이터 규모').selectOption('10000');
  await expect(page.getByText(/조회 10,000건/)).toBeVisible();
  await cell(page, 1, 'customer').click();
  await page.keyboard.press('ControlOrMeta+End');
  await expect(cell(page, 10000, 'id')).toBeVisible();
  await cell(page, 10000, 'customer').dblclick();
  await page.getByLabel('고객 편집').fill('마지막 행');
  await page.getByLabel('고객 편집').press('Enter');
  await expect(cell(page, 10000, 'customer')).toHaveText('마지막 행');
  await page.getByRole('button', { name: '열 설정', exact: true }).click();
  await page.getByLabel('담당 팀 그룹', { exact: true }).check();
  await page.getByRole('button', { name: '모두 펼치기' }).click();
  await page
    .getByRole('treegrid')
    .evaluate((grid) => (grid.scrollTop = grid.scrollHeight));
  expect(await page.getByRole('treegrid').getAttribute('aria-rowcount')).toBe(
    '10005',
  );
  expect(await page.locator('[role="row"]').count()).toBeLessThan(80);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV 내보내기', exact: true }).click();
  expect((await download).suggestedFilename().normalize('NFC')).toBe(
    '주문 원장.csv',
  );
});
test('narrow dark layout scrolls within the grid and keeps touch actions reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() =>
    document
      .querySelector('[data-mega-theme]')
      ?.setAttribute('data-mega-theme', 'dark'),
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole('grid')
    .evaluate((grid) => (grid.scrollLeft = grid.scrollWidth));
  await expect(cell(page, 1, 'approved')).toBeVisible();
  await page.screenshot({
    path: `output/data-grid-mobile-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test('save from an open editor and toolbar includes the current input', async ({
  page,
}) => {
  await cell(page, 1, 'customer').dblclick();
  await page.getByLabel('고객 편집').fill('편집 중 저장');
  await page.getByLabel('고객 편집').press('ControlOrMeta+s');
  await expect(page.getByText(/^저장했어요\./)).toBeVisible();
  await page.reload();
  await expect(cell(page, 1, 'customer')).toHaveText('편집 중 저장');
  await cell(page, 1, 'quantity').dblclick();
  await page.getByLabel('수량 편집').fill('14');
  await page.getByRole('button', { name: /^변경 저장/ }).click();
  await expect(page.getByText(/^저장했어요\./)).toBeVisible();
  await page.reload();
  await expect(cell(page, 1, 'quantity')).toHaveText('14');
  await expect(
    page.getByRole('button', { name: '초안 복구', exact: true }),
  ).toHaveCount(0);
});

test('invalid raw input survives focus changes and reload, blocks saving, and can be corrected or cancelled', async ({
  page,
}) => {
  await cell(page, 1, 'quantity').dblclick();
  await page.getByLabel('수량 편집').fill('12x');
  await cell(page, 1, 'customer').click();
  await expect(cell(page, 1, 'quantity')).toHaveText('12x');
  await page.getByRole('button', { name: /^변경 저장/ }).click();
  await expect(page.getByText(/^저장했어요\./)).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: '초안 복구', exact: true }).click();
  await cell(page, 1, 'quantity').dblclick();
  await expect(page.getByLabel('수량 편집')).toHaveValue('12x');
  await page.getByLabel('수량 편집').fill('-1');
  await cell(page, 1, 'customer').click();
  await expect(cell(page, 1, 'quantity')).toHaveText('-1');
  await cell(page, 1, 'quantity').dblclick();
  await page.getByLabel('수량 편집').fill('15');
  await page.getByLabel('수량 편집').press('ControlOrMeta+s');
  await expect(page.getByText(/^저장했어요\./)).toBeVisible();
  await cell(page, 1, 'quantity').dblclick();
  await page.getByLabel('수량 편집').fill('bad');
  await page.getByLabel('수량 편집').press('Escape');
  await expect(cell(page, 1, 'quantity')).toHaveText('15');
  await page.reload();
  await expect(
    page.getByRole('button', { name: '초안 복구', exact: true }),
  ).toHaveCount(0);
});

test('recovery retains original values for conflict checks and explicit discard removes the snapshot', async ({
  page,
}) => {
  await page.goto('/data-grid-test.html');
  const writable = page.getByRole('region', {
    name: '검증 원장 작업 영역',
    exact: true,
  });
  const amount = writable.locator(
    '[data-pro-row="1"][data-pro-column="amount"]',
  );
  await amount.dblclick();
  await page.getByLabel('금액 편집').fill('4');
  await page.getByLabel('금액 편집').press('Enter');
  await page.reload();
  await page.getByRole('button', { name: '외부 원본 변경' }).click();
  await page.getByRole('button', { name: '초안 복구', exact: true }).click();
  await expect(writable.getByText(/원본 값이 바뀌었어요/)).toBeVisible();
  await expect(
    writable.getByRole('button', { name: /^변경 저장/ }),
  ).toBeDisabled();
  await writable
    .getByRole('button', { name: '변경 취소', exact: true })
    .click();
  await writable
    .getByRole('button', { name: '변경 취소 확인', exact: true })
    .click();
  await expect(amount).toHaveText('10');
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('mega-grid-fixture-v1')),
    )
    .toBeNull();
  await page.reload();
  await expect(
    page.getByRole('button', { name: '초안 복구', exact: true }),
  ).toHaveCount(0);
});

test('storage failures retain input and changed snapshots are not overwritten', async ({
  page,
}) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
  });
  await cell(page, 1, 'customer').dblclick();
  await page.getByLabel('고객 편집').fill('보관 실패 입력');
  await expect(
    page.getByText(/초안을 브라우저에 보관하지 못했어요/),
  ).toBeVisible();
  await expect(page.getByLabel('고객 편집')).toHaveValue('보관 실패 입력');
  await page.reload();
  await expect(cell(page, 1, 'customer')).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem('mega-ui-order-draft-v1-client', 'another tab draft'),
  );
  await cell(page, 1, 'customer').dblclick();
  await page.getByLabel('고객 편집').fill('다른 탭 충돌 입력');
  await expect(
    page.getByText(/초안을 브라우저에 보관하지 못했어요/),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem('mega-ui-order-draft-v1-client'),
    ),
  ).toBe('another tab draft');
  await page.reload();
  await expect(page.getByText(/초안을 불러오지 못했어요/)).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem('mega-ui-order-draft-v1-client'),
    ),
  ).toBe('another tab draft');
});

test('undo history obeys the configured batch limit', async ({ page }) => {
  await page.goto('/data-grid-test.html');
  const writable = page.getByRole('region', {
    name: '검증 원장 작업 영역',
    exact: true,
  });
  const amount = writable.locator(
    '[data-pro-row="1"][data-pro-column="amount"]',
  );
  for (const value of ['2', '3', '4']) {
    await amount.dblclick();
    await page.getByLabel('금액 편집').fill(value);
    await page.getByLabel('금액 편집').press('Enter');
  }
  const undo = writable.getByRole('button', { name: '실행 취소', exact: true });
  await undo.click();
  await expect(amount).toHaveText('3');
  await undo.click();
  await expect(amount).toHaveText('2');
  await expect(undo).toBeDisabled();
  await writable
    .getByRole('button', { name: '다시 실행', exact: true })
    .click();
  await expect(amount).toHaveText('3');
});

test('recovered valid input commits with Tab and Enter without retyping', async ({
  page,
}) => {
  for (const key of ['Tab', 'Enter']) {
    await cell(page, 1, 'customer').dblclick();
    await page.getByLabel('고객 편집').fill(`복구 ${key}`);
    await page.reload();
    await page.getByRole('button', { name: '초안 복구', exact: true }).click();
    await cell(page, 1, 'customer').dblclick();
    await expect(page.getByLabel('고객 편집')).toHaveValue(`복구 ${key}`);
    await page.getByLabel('고객 편집').press(key);
    await expect(
      page.getByRole('button', { name: '변경 저장 (1)', exact: true }),
    ).toBeEnabled();
    await page
      .getByRole('button', { name: '변경 저장 (1)', exact: true })
      .click();
    await expect(page.getByText(/^저장했어요\./)).toBeVisible();
    await page.reload();
    await expect(cell(page, 1, 'customer')).toHaveText(`복구 ${key}`);
  }
});

test('viewer keeps search, sort, selection, copy and export but blocks editing with callbacks supplied', async ({
  page,
}) => {
  await page.getByLabel('사용 모드', { exact: true }).selectOption('viewer');
  const grid = page.getByRole('grid', { name: '주문 원장' });
  await expect(
    page.getByRole('button', {
      name: /변경 저장|실행 취소|다시 실행|변경 취소/,
    }),
  ).toHaveCount(0);
  await expect(page.getByText(/Enter\/F2로 편집/)).toHaveCount(0);
  const customer = cell(page, 1, 'customer');
  await customer.dblclick();
  await page.keyboard.press('F2');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('고객 편집')).toHaveCount(0);
  await expect(customer).toHaveAttribute('aria-readonly', 'true');
  await clipboard(page, '변경 시도');
  await page.keyboard.press('Delete');
  await expect(customer).toHaveText('고객 1');
  for (const action of ['copy', 'cut']) {
    const copied = await grid.evaluate((element, action) => {
      const data = new DataTransfer();
      const event = new ClipboardEvent(action, {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'clipboardData', { value: data });
      (document.activeElement ?? element).dispatchEvent(event);
      return data.getData('text/plain');
    }, action);
    expect(copied).toBe('고객 1');
    await expect(customer).toHaveText('고객 1');
  }
  await page.getByLabel('주문 원장 검색', { exact: true }).fill('고객 1');
  await expect(cell(page, 2, 'customer')).toHaveCount(0);
  await grid.getByRole('columnheader', { name: /^고객/ }).click();
  await expect(
    grid.getByRole('columnheader', { name: /^고객/ }),
  ).toHaveAttribute('aria-sort', 'ascending');
  await grid.getByRole('checkbox').first().check();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: '선택 행 내보내기', exact: true })
    .click();
  expect((await download).suggestedFilename().normalize('NFC')).toBe(
    '주문 원장.csv',
  );
  await page.getByLabel('사용 모드', { exact: true }).selectOption('editor');
  await expect(page.getByRole('button', { name: /^변경 저장/ })).toBeDisabled();
});

test('viewer transition shows canonical rows and preserves drafts and invalid input for editing later', async ({
  page,
}) => {
  await page.goto('/data-grid-test.html');
  const region = page.getByRole('region', {
    name: '검증 원장 작업 영역',
    exact: true,
  });
  const amount = region.locator('[data-pro-row="1"][data-pro-column="amount"]');
  const name = region.locator('[data-pro-row="1"][data-pro-column="name"]');
  await name.dblclick();
  await region.getByLabel('이름 편집').fill('보관 초안');
  await region.getByLabel('이름 편집').press('Enter');
  await amount.dblclick();
  await region.getByLabel('금액 편집').fill('invalid');
  await page
    .getByRole('button', { name: '조회 전용 전환', exact: true })
    .click();
  await expect(name).toHaveText('가');
  await expect(amount).toHaveText('1');
  await expect(region.getByLabel('금액 편집')).toHaveCount(0);
  await expect(region.getByRole('button', { name: /^변경 저장/ })).toHaveCount(
    0,
  );
  await expect(region.getByText(/미저장 변경은 유지하고 있어요/)).toBeVisible();
  await page
    .getByRole('button', { name: '조회 전용 전환', exact: true })
    .click();
  await expect(name).toHaveText('보관 초안');
  await amount.dblclick();
  await expect(region.getByLabel('금액 편집')).toHaveValue('invalid');
});
