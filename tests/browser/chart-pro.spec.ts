import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('all professional chart types render, export and expose the source table', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#charts?full=1');
  const chart = page.getByRole('figure', {
    name: '전문 차트 탐색',
    exact: true,
  });
  const kind = page.getByLabel('전문 차트 종류', { exact: true });
  for (const type of [
    'bar',
    'stacked-bar',
    'line',
    'area',
    'stacked-area',
    'pie',
    'donut',
    'scatter',
    'heatmap',
    'treemap',
    'candlestick',
    'time',
  ]) {
    await kind.selectOption(type);
    await expect(chart.locator('.mega-chart-pro__canvas svg')).toBeVisible();
    await expect(chart.getByRole('alert')).toHaveCount(0);
    expect(
      await chart.locator('.mega-chart-pro__canvas path').count(),
    ).toBeGreaterThan(0);
    await chart.locator('summary').click();
    await expect(chart.locator('tbody tr').first()).toBeVisible();
    await chart.locator('tbody input').first().check();
    await expect(
      chart.getByRole('button', {
        name: '선택 데이터 CSV 내려받기',
        exact: true,
      }),
    ).toBeEnabled();
    await chart.locator('summary').click();
    await chart.screenshot({
      path: `test-results/chart-pro-${type}-${test.info().project.name}.png`,
    });
  }
  await kind.selectOption('scatter');
  const surface = chart.getByRole('group', { name: '전문 차트 탐색 값 탐색' });
  await surface.focus();
  await page.keyboard.press('End');
  await expect(chart.locator('p[role="status"]')).toContainText('그룹 B');
  await page.keyboard.press('Space');
  await expect(chart.getByText('1개 선택', { exact: true })).toBeVisible();
  for (const format of ['SVG', 'PNG', 'CSV']) {
    const pending = page.waitForEvent('download');
    await chart
      .getByRole('button', {
        name:
          format === 'CSV'
            ? '전체 데이터 CSV 내려받기'
            : `현재 차트 ${format} 내려받기`,
        exact: true,
      })
      .click();
    const download = await pending;
    const file = await readFile((await download.path())!);
    if (format === 'SVG') {
      expect(file.toString()).toContain('<svg');
      expect(file.toString()).toContain('그룹 A');
    }
    if (format === 'PNG')
      expect(file.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    if (format === 'CSV') expect(file.toString()).toContain('그룹 B,9,4');
  }
  await kind.selectOption('empty');
  await expect(chart.getByText('표시할 값이 없어요.')).toBeVisible();
  await kind.selectOption('loading');
  await expect(chart).toHaveAttribute('aria-busy', 'true');
  await kind.selectOption('error');
  await chart.getByRole('button', { name: '차트 다시 불러오기' }).click();
  await expect(kind).toHaveValue('scatter');
  expect(errors).toEqual([]);
});

test('pointer zoom, pan, brush selection and native range controls', async ({
  page,
}) => {
  await page.goto('/#charts?full=1');
  const chart = page.getByRole('figure', {
    name: '전문 차트 탐색',
    exact: true,
  });
  const canvas = chart.locator('.mega-chart-pro__canvas');
  await expect(canvas.locator('svg')).toBeVisible();
  await chart
    .getByRole('button', { name: '드래그로 확대', exact: true })
    .click();
  await canvas.scrollIntoViewIfNeeded();
  let box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.65, box.y + 250, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(async () =>
      Number(
        await chart
          .getByRole('slider', { name: '구간 끝', exact: true })
          .inputValue(),
      ),
    )
    .toBeLessThan(100);
  await canvas.focus();
  await page.keyboard.press('Escape');
  const previousStart = await chart
    .getByRole('slider', { name: '구간 시작', exact: true })
    .inputValue();
  await page.mouse.move(box.x + box.width * 0.6, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, box.y + 200, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(() =>
      chart
        .getByRole('slider', { name: '구간 시작', exact: true })
        .inputValue(),
    )
    .not.toBe(previousStart);
  await chart.getByRole('button', { name: '전체 구간', exact: true }).click();
  await chart
    .getByRole('button', { name: '드래그로 선택', exact: true })
    .click();
  await canvas.scrollIntoViewIfNeeded();
  box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 71, box.y + 51);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 71, box.y + box.height - 101, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(
    chart.getByRole('button', {
      name: '선택 데이터 CSV 내려받기',
      exact: true,
    }),
  ).toBeEnabled();
  await chart.getByRole('button', { name: '선택 해제', exact: true }).click();
  await expect(chart.getByText('0개 선택', { exact: true })).toBeVisible();
  await chart.getByRole('slider', { name: '구간 끝', exact: true }).focus();
  await page.keyboard.press('Home');
  await expect(
    chart.getByRole('slider', { name: '구간 끝', exact: true }),
  ).toHaveValue('1');
});

test('professional chart handles dark mobile, time zones, 10000 points and catalog search', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('mega-docs-theme', 'dark'),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#components/professional?to=ChartPro');
  const chart = page.getByRole('figure', {
    name: '전문 차트 탐색',
    exact: true,
  });
  await expect(chart).toBeVisible();
  await page.getByLabel('전문 차트 종류', { exact: true }).selectOption('time');
  await page.getByLabel('시간대', { exact: true }).selectOption('UTC');
  await chart.locator('summary').click();
  await expect(chart.locator('table')).toContainText(
    '2026-09-01T00:00:00.000Z',
  );
  await chart.locator('summary').click();
  await chart.screenshot({
    path: `test-results/chart-pro-mobile-${test.info().project.name}.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel('전문 차트 종류', { exact: true })
    .selectOption('large');
  await expect(chart.locator('.mega-chart-pro__canvas svg')).toBeVisible();
  await chart.locator('summary').click();
  await expect(chart.locator('tbody tr')).toHaveCount(100);
  await chart.getByRole('button', { name: '다음 데이터', exact: true }).click();
  await expect(
    chart.getByText('2 / 100 페이지', { exact: true }),
  ).toBeVisible();
  await expect(chart.getByRole('alert')).toHaveCount(0);
});
