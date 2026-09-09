import { expect, test } from '@playwright/test';

test('notification dots and title weights reflect read state without a side bar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#notifications?full=1');
  const cards = page.locator('.mega-notification');
  await expect(cards).toHaveCount(5);
  const first = cards.first();
  await expect(first).toContainText('안 읽음:');
  expect(
    await first.evaluate((element) => ({
      shadow: getComputedStyle(element).boxShadow,
      weight: getComputedStyle(element.querySelector('strong')!).fontWeight,
      dot: getComputedStyle(element.querySelector('strong')!, '::before').width,
    })),
  ).toEqual({ shadow: 'none', weight: '600', dot: '6px' });
  expect(
    await cards.evaluateAll(
      (elements) =>
        new Set(
          elements.map((element) => getComputedStyle(element).backgroundColor),
        ).size,
    ),
  ).toBe(1);
  await first.getByRole('button', { name: '읽음으로 표시' }).click();
  await expect(first).toHaveAttribute('data-read', 'true');
  await expect(first).not.toContainText('안 읽음:');
  expect(
    await first
      .locator('strong')
      .evaluate((element) => getComputedStyle(element).fontWeight),
  ).toBe('500');
  await page.getByRole('button', { name: '모두 읽음', exact: true }).click();
  await expect(page.locator('.mega-notification:not([data-read])')).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
