import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('chart lookup, gaps, legend, table and CSV agree', async ({ page }) => {
  await page.goto('/#charts?full=1');
  const chart = page.getByRole('figure', {
    name: '월별 손익 비교',
    exact: true,
  });
  await expect(chart).toBeVisible();
  await page.screenshot({
    path: `test-results/charts-desktop-${test.info().project.name}.png`,
    fullPage: true,
  });
  const points = chart.locator('.mega-cartesian-chart__category');
  await points.first().focus();
  await expect(chart.getByRole('tooltip')).toContainText('320');
  await page.keyboard.press('ArrowRight');
  await expect(points.nth(1)).toBeFocused();
  await expect(chart.getByRole('tooltip')).toContainText('460');
  await page.keyboard.press('End');
  await expect(points.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(points.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(chart.getByRole('tooltip')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(chart.getByRole('tooltip')).toBeVisible();
  await page.getByRole('radio', { name: '선', exact: true }).check();
  const online = chart.locator('[data-series="online"]');
  const path = await online.locator('path').getAttribute('d');
  expect(path?.match(/M/g)).toHaveLength(2);
  await points.nth(2).hover();
  await expect(chart.getByRole('tooltip')).toContainText('값 없음');
  const onlineToggle = chart.getByRole('button', {
    name: '온라인',
    exact: true,
  });
  await onlineToggle.click();
  await expect(onlineToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(online).toHaveCount(0);
  await chart.getByText('전체 데이터 표 보기', { exact: true }).click();
  await expect(chart.getByRole('table')).toBeVisible();
  await expect(
    chart.getByRole('row', { name: '6월 값 없음 180 140' }),
  ).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await chart.getByRole('button', { name: '전체 데이터 CSV 내려받기' }).click();
  const download = await downloaded;
  expect(download.suggestedFilename().normalize('NFC')).toBe(
    '월별 손익 비교.csv',
  );
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain('월,온라인,매장,파트너');
  expect(csv).toContain('8월,-80,330,170');
  expect(csv).toContain('6월,,180,140');
  await page.evaluate(() => {
    const original = URL.createObjectURL;
    URL.createObjectURL = () => {
      URL.createObjectURL = original;
      throw new Error('Test export failure');
    };
  });
  await chart.getByRole('button', { name: '전체 데이터 CSV 내려받기' }).click();
  await expect(chart.getByRole('alert')).toContainText(
    'CSV 파일을 만들지 못했어요',
  );
  const retry = page.waitForEvent('download');
  await chart.getByRole('button', { name: '전체 데이터 CSV 내려받기' }).click();
  await retry;
  await expect(chart.getByRole('alert')).toHaveCount(0);
  await chart.getByRole('button', { name: '매장', exact: true }).click();
  await chart.getByRole('button', { name: '파트너', exact: true }).click();
  await expect(chart.getByRole('status')).toHaveText(
    '표시할 계열을 선택해 주세요.',
  );
  await onlineToggle.click();
  await expect(chart.locator('[data-series="online"]')).toBeVisible();
  await page.getByLabel('조회 기간').selectOption('empty');
  await expect(chart.getByRole('status')).toHaveText('표시할 값이 없어요.');
  await expect(
    chart.getByRole('button', { name: '전체 데이터 CSV 내려받기' }),
  ).toBeDisabled();
  await page.getByLabel('조회 기간').selectOption('error');
  await expect(page.getByRole('alert')).toContainText('불러오지 못했어요');
  await page.getByRole('button', { name: '예시 다시 불러오기' }).click();
  await expect(chart).toBeVisible();
});

test('narrow dark chart supports pointer selection and keeps scrolling inside the chart', async ({
  page: defaultPage,
  browser,
  browserName,
}) => {
  const touchContext =
    browserName === 'firefox'
      ? undefined
      : await browser.newContext({
          hasTouch: true,
          baseURL: 'http://127.0.0.1:4176',
        });
  const page = touchContext ? await touchContext.newPage() : defaultPage;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() =>
    localStorage.setItem('mega-docs-theme', 'dark'),
  );
  await page.goto('/#charts?full=1');
  await expect(page.locator('.mega-cartesian-chart').first()).toBeVisible();
  await expect(page.locator('.mega-theme').first()).toHaveAttribute(
    'data-mega-theme',
    'dark',
  );
  const target = page.locator('.mega-cartesian-chart__category').first();
  if (touchContext) await target.tap();
  else await target.click();
  await expect(page.getByRole('tooltip')).toContainText('4월');
  const layout = await page.evaluate(() => ({
    viewport: innerWidth,
    page: document.documentElement.scrollWidth,
    chart: document.querySelector('.mega-cartesian-chart__scroll')!.clientWidth,
    plot: document.querySelector('.mega-cartesian-chart__scroll')!.scrollWidth,
    targets: [...document.querySelectorAll('.mega-cartesian-chart button')].map(
      (el) => el.getBoundingClientRect().height,
    ),
  }));
  expect(layout.page).toBe(layout.viewport);
  expect(layout.plot).toBeGreaterThan(layout.chart);
  expect(layout.targets.every((height) => height >= 44)).toBe(true);
  await page.screenshot({
    path: `test-results/charts-mobile-${test.info().project.name}.png`,
    fullPage: true,
  });
  await touchContext?.close();
});

test('200 categories by 6 series render and respond within the recorded budget', async ({
  page,
}) => {
  await page.goto('/#charts?full=1');
  await expect(page.locator('.mega-cartesian-chart').first()).toBeVisible();
  const renderMs = await page.evaluate(async () => {
    const select = document.querySelector<HTMLSelectElement>('#chart-period')!;
    const start = performance.now();
    select.value = 'history';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return performance.now() - start;
  });
  await expect(page.locator('.mega-cartesian-chart__category')).toHaveCount(
    200,
  );
  expect(renderMs).toBeLessThan(500);
  const focusMs = await page.evaluate(async () => {
    const start = performance.now();
    const points = document.querySelectorAll<SVGGElement>(
      '.mega-cartesian-chart__category',
    );
    points[0]!.focus();
    points[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return performance.now() - start;
  });
  await expect(
    page.locator('.mega-cartesian-chart__category').last(),
  ).toBeFocused();
  expect(focusMs).toBeLessThan(200);
  console.log(
    `${test.info().project.name}: charts 200 x 6 render=${renderMs.toFixed(1)}ms focus=${focusMs.toFixed(1)}ms`,
  );
});

test('area, stacking, range zoom and pie/donut expose usable interactions', async ({
  page,
}) => {
  await page.goto('/#charts?full=1');
  const chart = page.getByRole('figure', {
    name: '월별 손익 비교',
    exact: true,
  });
  await page.getByRole('radio', { name: '영역', exact: true }).check();
  await page.getByRole('checkbox', { name: '누적 표시' }).check();
  await expect(chart.locator('.mega-cartesian-chart__area')).toHaveCount(3);
  await chart.getByRole('button', { name: '확대', exact: true }).click();
  await expect(chart.locator('.mega-cartesian-chart__category')).toHaveCount(4);
  await expect(chart.getByRole('status')).toContainText('5월 – 8월');
  await chart.getByRole('button', { name: '다음 구간' }).click();
  await expect(chart.getByRole('status')).toContainText('6월 – 9월');
  await chart.getByRole('button', { name: '이전 구간' }).click();
  await expect(chart.getByRole('status')).toContainText('4월 – 7월');
  await chart.getByRole('button', { name: '전체 구간', exact: true }).click();
  await expect(chart.locator('.mega-cartesian-chart__category')).toHaveCount(6);
  await chart.getByRole('slider', { name: '시작 항목' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(chart.locator('.mega-cartesian-chart__category')).toHaveCount(5);
  await chart.getByRole('button', { name: '전체 구간', exact: true }).click();
  await chart.getByRole('button', { name: '온라인', exact: true }).click();
  await expect(chart.locator('.mega-cartesian-chart__area')).toHaveCount(2);
  const pie = page.getByRole('figure', {
    name: '9월 채널별 매출 비율',
    exact: true,
  });
  const slices = pie.locator('.mega-pie-chart__slice');
  await expect(slices).toHaveCount(3);
  await expect(slices.first()).toHaveAccessibleName('온라인: 1,200, 50%');
  await slices.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(slices.nth(1)).toBeFocused();
  await expect(pie.getByRole('status')).toContainText('800 만원 · 33.3%');
  await page.getByRole('radio', { name: '원형', exact: true }).check();
  await expect(pie.locator('.mega-pie-chart__center')).toHaveCount(0);
  await page.getByRole('radio', { name: '도넛', exact: true }).check();
  await expect(pie.locator('.mega-pie-chart__center')).toHaveText('100%');
  await pie.getByText('전체 데이터 표 보기', { exact: true }).click();
  await expect(pie.getByRole('row', { name: '매장 800' })).toBeVisible();
  const download = page.waitForEvent('download');
  await pie.getByRole('button', { name: '전체 데이터 CSV 내려받기' }).click();
  expect(await readFile((await (await download).path())!, 'utf8')).toContain(
    '매장,800',
  );
  await page.screenshot({
    path: `test-results/charts-expanded-${test.info().project.name}.png`,
    fullPage: true,
  });
});
