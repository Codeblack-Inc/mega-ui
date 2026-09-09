import { expect, test } from '@playwright/test';

test('global search supports top bar, shortcuts, navigation and mobile', async ({
  page,
}) => {
  await page.goto('/#components/foundation');
  const trigger = page.getByRole('button', { name: '글로벌 검색 열기' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '글로벌 검색' });
  const input = dialog.getByRole('searchbox');
  await expect(input).toBeFocused();
  await input.fill('  bUtToN 버튼  ');
  await input.press('Enter');
  await expect(page).toHaveURL(/#components\/controls\?to=Button$/);
  await expect(page.locator('#Button')).toBeInViewport();
  await page.keyboard.press('Control+k');
  await expect(input).toHaveValue('');
  await input.fill('없는컴포넌트xyz');
  await expect(dialog.getByRole('status')).toContainText('검색 결과가 없어요');
  await input.press('Escape');
  await expect(dialog).not.toBeVisible();
  await trigger.click();
  await input.fill('시작하기');
  await expect(
    dialog.getByRole('button', { name: /시작하기 문서/ }),
  ).toBeVisible();
  await input.press('Escape');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Meta+k');
  await input.fill('notifications');
  await input.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#notifications$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '다크 모드', exact: true }).click();
  await trigger.click();
  await expect(input).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await input.press('Escape');
  await page.goto('/#notifications?full=1');
  await page.keyboard.press('Control+k');
  await expect(dialog).toBeVisible();
});

test('professional components appear in the catalog and search opens live demos', async ({
  page,
}) => {
  await page.goto('/#components/foundation');
  await expect(
    page.getByRole('link', { name: '전문 업무 컴포넌트 6', exact: true }),
  ).toBeVisible();
  for (const name of [
    'DataGridPro',
    'TextEditor',
    'CartesianChart',
    'PieChart',
    'ChartPro',
    'TaskBoard',
  ]) {
    await page.getByRole('button', { name: '글로벌 검색 열기' }).click();
    const search = page
      .getByRole('dialog', { name: '글로벌 검색' })
      .getByRole('searchbox');
    await search.fill(name);
    await search.press('Enter');
    await expect(page).toHaveURL(
      new RegExp(`components/professional\\?to=${name}$`),
    );
    await expect(page.locator(`#${name}`)).toBeInViewport();
  }
  await expect(page.locator('#DataGridPro').getByRole('grid')).toBeVisible();
  const gridCard = page.locator('#DataGridPro');
  await gridCard
    .getByRole('gridcell', { name: '김메가', exact: true })
    .dblclick();
  await gridCard.getByRole('textbox', { name: '고객 편집' }).fill('박메가');
  await gridCard.getByRole('textbox', { name: '고객 편집' }).press('Enter');
  await gridCard.getByRole('button', { name: /변경 저장/ }).click();
  await expect(
    gridCard.getByRole('gridcell', { name: '박메가', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#TextEditor .tiptap')).toBeVisible();
  await page.locator('#TextEditor .tiptap').fill('카탈로그에서 편집한 문서');
  await expect(page.locator('#TextEditor .tiptap')).toHaveText(
    '카탈로그에서 편집한 문서',
  );
  await expect(
    page.locator('#CartesianChart .mega-cartesian-chart'),
  ).toBeVisible();
  await page
    .locator('#CartesianChart')
    .getByRole('combobox', { name: '차트 종류', exact: true })
    .selectOption('area');
  await page
    .locator('#CartesianChart')
    .getByRole('checkbox', { name: '누적 표시' })
    .check();
  await expect(
    page.locator('#CartesianChart .mega-cartesian-chart__area'),
  ).toHaveCount(2);
  await page
    .locator('#PieChart')
    .getByRole('combobox', { name: '비율 차트 종류' })
    .selectOption('pie');
  await expect(page.locator('#PieChart .mega-pie-chart__center')).toHaveCount(
    0,
  );
  await page.screenshot({
    path: `test-results/professional-desktop-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/professional-mobile-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page
    .locator('#CartesianChart')
    .getByRole('link', { name: '차트 전체 예제 열기' })
    .click();
  await expect(page).toHaveURL(/#charts\?full=1$/);
});
