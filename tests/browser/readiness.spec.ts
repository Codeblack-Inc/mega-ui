import { expect, test } from '@playwright/test';

test('component and workflow browser regressions pass', async ({ page }) => {
  await page.goto('/readiness.html');
  await expect(page.locator('body')).toHaveAttribute(
    'data-result',
    /passed|failed/,
    { timeout: 20000 },
  );
  expect(await page.locator('#results li').allTextContents()).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/^FAIL/)]),
  );
  await expect(page.locator('body')).toHaveAttribute('data-result', 'passed');
});

test('route links and back cancellation retain the unsaved form', async ({
  page,
}) => {
  await page.goto('/#components/foundation');
  await page
    .getByRole('link', { name: '실무 상태·조합 16', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: '이름', exact: true })
    .fill('보존할 초안');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('link', { name: '기초 5', exact: true }).click();
  await expect(page).toHaveURL(/#components\/workflows$/);
  await expect(
    page.getByRole('textbox', { name: '이름', exact: true }),
  ).toHaveValue('보존할 초안');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.goBack();
  await expect(page).toHaveURL(/#components\/workflows$/);
  await expect(
    page.getByRole('textbox', { name: '이름', exact: true }),
  ).toHaveValue('보존할 초안');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('link', { name: '기초 5', exact: true }).click();
  await expect(page).toHaveURL(/#components\/foundation$/);
});

test('mobile workflows fit and actions have 44px targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#components/workflows');
  await expect(
    page.getByRole('heading', { name: '실무 상태·조합', exact: true }),
  ).toBeVisible();
  const layout = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    actions: [...document.querySelectorAll('.mega-button')]
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.height > 0)
      .map((rect) => rect.height),
    overflow: [...document.querySelectorAll('.catalog-card')]
      .filter((element) => element.scrollWidth > element.clientWidth)
      .map((element) => element.id),
    verticalLabels: [
      ...document.querySelectorAll(
        '.mega-bar-chart[data-orientation="vertical"] li',
      ),
    ].map((element) => ({
      track: element
        .querySelector('.mega-bar-chart__track')!
        .getBoundingClientRect().bottom,
      label: element
        .querySelector('.mega-bar-chart__label')!
        .getBoundingClientRect().top,
      value: element
        .querySelector('.mega-bar-chart__value')!
        .getBoundingClientRect().top,
    })),
  }));
  expect(layout.width).toBe(layout.viewport);
  expect(layout.overflow).toEqual([]);
  expect(layout.actions.every((height) => height >= 44)).toBe(true);
  expect(
    layout.verticalLabels.every(
      ({ track, label, value }) => track <= label && label < value,
    ),
  ).toBe(true);
});
