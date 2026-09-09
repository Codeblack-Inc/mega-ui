import { expect, test } from '@playwright/test';

test('catalog search finds names and Korean categories, links to demos and resets', async ({
  page,
}) => {
  await page.goto('/#components/foundation');
  const search = page.getByRole('search', { name: '컴포넌트 검색' });
  const input = search.getByRole('searchbox');
  await input.fill('  bUtToN  ');
  const result = search.getByRole('link', {
    name: 'Button 버튼·컨트롤',
    exact: true,
  });
  await expect(result).toBeVisible();
  await result.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#components\/controls\?to=Button$/);
  await expect(page.locator('#Button')).toBeInViewport();
  await input.fill('버튼');
  await expect(result).toBeVisible();
  await input.fill('없는컴포넌트xyz');
  await expect(search.getByRole('status')).toContainText('검색 결과가 없어요');
  await search.getByRole('button', { name: '검색어 지우기' }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
  await input.fill('Input');
  await input.press('Escape');
  await expect(input).toHaveValue('');
  await page.setViewportSize({ width: 390, height: 844 });
  await input.fill('입력');
  await expect(search.getByRole('link').first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: '다크 모드', exact: true }).click();
  await expect(search).toBeVisible();
});
