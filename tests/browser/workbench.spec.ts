import { expect, test } from '@playwright/test';

test('문의 콘솔은 키보드로 이동하고 작성 중인 답장을 지키다', async ({
  page,
}) => {
  await page.goto('/#support-console?full=1');
  const selected = page.locator('.cs-row[aria-current]');
  await expect(selected).toContainText('결제가 두 번 청구됐어요');

  const list = page.locator('.cs-list .mega-virtual-table');
  await list.focus();
  await page.keyboard.press('j');
  await expect(selected).toContainText('정산 금액이 주문서와 달라요');
  await page.keyboard.press('k');
  await expect(selected).toContainText('결제가 두 번 청구됐어요');

  await page.getByLabel('답장 작성').fill('환불 절차를 안내드릴게요.');
  await list.focus();
  await page.keyboard.press('j');
  const guard = page.getByRole('alertdialog', {
    name: '작성 중인 답장이 있어요',
  });
  await expect(guard).toBeVisible();
  await guard.getByRole('button', { name: '계속 작성' }).click();
  await expect(selected).toContainText('결제가 두 번 청구됐어요');

  await list.focus();
  await page.keyboard.press('j');
  await page.getByRole('button', { name: '답장 지우고 이동' }).click();
  await expect(selected).toContainText('정산 금액이 주문서와 달라요');
  await expect(page.getByLabel('답장 작성')).toHaveValue('');
});

test('분석 워크벤치는 중첩 그룹의 AND·OR를 실제 집계에 반영하다', async ({
  page,
}) => {
  await page.goto('/#analytics-workbench?full=1');
  const matched = page.locator('.bi-kpis .mega-stat').first();
  await expect(matched).toContainText('1,600');

  // 안쪽 그룹을 AND로 바꾸면 지역이 서울이면서 경기인 행은 없다.
  await page.getByRole('radio', { name: '모두 만족(AND)' }).nth(1).check();
  await expect(page.getByText('조건을 통과한 행이 없어요.')).toBeVisible();

  await page.getByRole('radio', { name: '하나만 만족(OR)' }).nth(1).check();
  await expect(matched).toContainText('1,600');

  await page.getByRole('button', { name: 'VIP 고액 주문' }).click();
  await expect(page.getByText('저장된 조건과 같음')).toBeVisible();
});

test('입고 시트는 셀 오류를 짚어 주고 해당 셀로 이동하다', async ({ page }) => {
  await page.goto('/#inventory-intake?full=1');
  await expect(page.getByText('검증 통과')).toBeVisible();

  await page.getByLabel('SKU1', { exact: true }).fill('sku-1');
  await expect(page.getByText('검증 오류 1건')).toBeVisible();
  await page.getByRole('button', { name: '1행 SKU' }).click();
  await expect(page.getByLabel('SKU1', { exact: true })).toBeFocused();

  await page.getByLabel('SKU1', { exact: true }).fill('SKU-10230');
  await expect(page.getByText('검증 통과')).toBeVisible();
  await expect(page.getByRole('button', { name: '입고 저장' })).toBeEnabled();

  await page.getByRole('button', { name: '붙여넣기로 채우기' }).click();
  await page
    .getByLabel('붙여넣을 데이터')
    .fill(
      'SKU-20001\t보온병\t60\t18000\t2028-05-31\t서울\nSKU-20002\t텀블러\t35\t12000\t2028-09-30\t대전',
    );
  await expect(page.getByText('2행 · 6열을 읽었어요.')).toBeVisible();
  await page.getByRole('button', { name: '시트에 넣기' }).click();
  await expect(page.getByText('입력한 행 8개')).toBeVisible();
  await page.getByRole('button', { name: '되돌리기', exact: true }).click();
  await expect(page.getByText('입력한 행 6개')).toBeVisible();
});

test('계약 검토는 반려 사유를 검증하고 버전 차이를 보여주다', async ({
  page,
}) => {
  await page.goto('/#contract-review?full=1');
  await page.getByLabel('이전 버전과 비교').check();
  await expect(page.locator('.ct-diff__row')).toHaveCount(4);

  await page.getByRole('button', { name: '반려 요청' }).click();
  const dialog = page.getByRole('alertdialog', {
    name: '이 계약을 반려할까요?',
  });
  await dialog.getByLabel('반려 사유').fill('짧아요');
  await dialog.getByRole('button', { name: '반려하고 사유 보내기' }).click();
  await expect(dialog).toBeVisible();
  await expect(
    page.getByText('반려 사유를 10자 이상 적어 주세요.').first(),
  ).toBeVisible();

  await dialog
    .getByLabel('반려 사유')
    .fill('자동 갱신 조항의 통보 기한을 30일로 줄여 주세요.');
  await dialog.getByRole('button', { name: '반려하고 사유 보내기' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('button', { name: '1. 법무 검토' }),
  ).toHaveAttribute('aria-current', 'step');
});
