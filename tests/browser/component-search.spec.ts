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
