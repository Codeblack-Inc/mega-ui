import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function open(
  page: import('@playwright/test').Page,
  name = '분기 보고서.pdf',
) {
  await page.goto('/#pdf-viewer?full=1');
  const view = page.getByRole('region', { name, exact: true });
  await expect(view).toBeVisible();
  await expect(view.locator('.mega-pdf__page-box')).toHaveCount(2, {
    timeout: 15000,
  });
  return view;
}

test('pdf renders pages, navigates, zooms, rotates and selects text', async ({
  page,
}) => {
  const view = await open(page);
  await expect(view.locator('.mega-pdf__thumbnails button')).toHaveCount(2);
  await expect(view.getByLabel('쪽 번호', { exact: true })).toHaveValue('1');
  await view.getByRole('button', { name: '다음 쪽', exact: true }).click();
  await expect(view.getByLabel('쪽 번호', { exact: true })).toHaveValue('2');
  await view.getByRole('button', { name: '1쪽으로 이동', exact: true }).click();
  await expect(view.getByLabel('쪽 번호', { exact: true })).toHaveValue('1');
  await expect(view.locator('.mega-pdf__text span').first()).toContainText(
    'Mega UI',
  );
  const before = (await view
    .locator('.mega-pdf__page-box')
    .first()
    .boundingBox())!;
  await view.getByRole('button', { name: '확대', exact: true }).click();
  await expect
    .poll(
      async () =>
        (await view.locator('.mega-pdf__page-box').first().boundingBox())!
          .width,
    )
    .toBeGreaterThan(before.width);
  await view.getByLabel('확대 비율', { exact: true }).selectOption('fit-page');
  await expect
    .poll(
      async () =>
        (await view.locator('.mega-pdf__page-box').first().boundingBox())!
          .height,
    )
    .toBeLessThanOrEqual(before.height + 4);
  const upright = (await view
    .locator('.mega-pdf__page-box')
    .first()
    .boundingBox())!;
  await view.getByRole('button', { name: '회전', exact: true }).click();
  await expect
    .poll(async () => {
      const box = (await view
        .locator('.mega-pdf__page-box')
        .first()
        .boundingBox())!;
      return box.width > box.height;
    })
    .toBe(true);
  expect(upright.width).toBeLessThan(upright.height);
});

test('pdf searches across pages and marks the matching page', async ({
  page,
}) => {
  const view = await open(page);
  await view.getByLabel('문서 검색', { exact: true }).fill('Signature');
  await expect(view.locator('.mega-pdf__search [role="status"]')).toHaveText(
    '1/1',
  );
  await expect(view.locator('[data-page="2"][data-match]')).toHaveCount(1);
  await view.getByLabel('문서 검색', { exact: true }).fill('summary');
  await expect(view.locator('.mega-pdf__search [role="status"]')).toHaveText(
    '1/1',
  );
  await expect(view.locator('[data-page="1"][data-match]')).toHaveCount(1);
  await view.getByLabel('문서 검색', { exact: true }).fill('없는낱말');
  await expect(view.locator('.mega-pdf__search [role="status"]')).toHaveText(
    '결과 없음',
  );
});

test('pdf fills a form, saves the bytes, retries a failure and reopens them', async ({
  page,
}) => {
  await open(page);
  await page.getByLabel('예제 문서', { exact: true }).selectOption('form');
  const form = page.getByRole('region', {
    name: '검토 요청서.pdf',
    exact: true,
  });
  await expect(form.locator('.mega-pdf__annotations input')).toHaveCount(1, {
    timeout: 15000,
  });
  await expect(form.locator('.mega-pdf__fields')).toContainText('서명 칸 1개');
  await form.locator('.mega-pdf__annotations input').fill('김메가');
  await page.getByLabel('저장 실패 재현', { exact: true }).check();
  await form.getByRole('button', { name: '문서 저장', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('저장하지 못했어요');
  await expect(form.locator('.mega-pdf__annotations input')).toHaveValue(
    '김메가',
  );
  await page.getByLabel('저장 실패 재현', { exact: true }).uncheck();
  await form.getByRole('button', { name: '문서 저장', exact: true }).click();
  await expect(
    page.getByText(/바이트를 이 브라우저에 기록했어요/),
  ).toBeVisible();
  await page
    .getByRole('button', { name: '브라우저 저장본 열기', exact: true })
    .click();
  const reopened = page.getByRole('region', {
    name: '검토 요청서.pdf',
    exact: true,
  });
  await expect(reopened.locator('.mega-pdf__annotations input')).toHaveValue(
    '김메가',
    {
      timeout: 15000,
    },
  );
});

test('pdf reports a broken file and downloads the document', async ({
  page,
}) => {
  const view = await open(page);
  const download = page.waitForEvent('download');
  await view.getByRole('button', { name: '내려받기', exact: true }).click();
  const bytes = await readFile(await (await download).path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  await page.getByLabel('예제 문서', { exact: true }).selectOption('broken');
  await expect(page.getByRole('alert')).toContainText('PDF로 열 수 없어요', {
    timeout: 15000,
  });
  await page.getByLabel('예제 문서', { exact: true }).selectOption('report');
  await expect(
    page
      .getByRole('region', { name: '분기 보고서.pdf', exact: true })
      .locator('.mega-pdf__page-box'),
  ).toHaveCount(2, { timeout: 15000 });
});

test('pdf adds text, a drawing and a stamp, then saves them into the file', async ({
  page,
}) => {
  const view = await open(page);
  const box = (await view
    .locator('.mega-pdf__page-box')
    .first()
    .boundingBox())!;
  await view.getByRole('button', { name: '글자 넣기', exact: true }).click();
  await expect(view.locator('.mega-pdf__editors').first()).toHaveClass(
    /freetextEditing/,
  );
  await page.mouse.click(box.x + 120, box.y + 120);
  await page.keyboard.type('검토 완료');
  await page.keyboard.press('Escape');
  await expect(view.locator('.freeTextEditor')).toHaveCount(1);
  await expect(view.locator('.freeTextEditor').first()).toContainText(
    '검토 완료',
  );
  await view.getByRole('button', { name: '서명·그리기', exact: true }).click();
  await page.mouse.move(box.x + 120, box.y + 300);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 340, { steps: 8 });
  await page.mouse.move(box.x + 260, box.y + 300, { steps: 8 });
  await page.mouse.up();
  await expect(view.locator('.mega-pdf__editors svg')).toHaveCount(1);
  await view
    .getByLabel('도장 이미지 고르기', { exact: true })
    .setInputFiles('tests/fixtures/stamp.png');
  await expect(view.locator('.stampEditor')).toHaveCount(1);
  await view.getByRole('button', { name: '선택', exact: true }).click();
  const download = page.waitForEvent('download');
  await view.getByRole('button', { name: '내려받기', exact: true }).click();
  const bytes = await readFile(await (await download).path());
  expect(bytes.includes('FreeText')).toBe(true);
  expect(bytes.includes('Ink')).toBe(true);
  expect(bytes.includes('XObject')).toBe(true);
  expect(bytes.length).toBeGreaterThan(3000);
});

test('pdf deletes an annotation and undoes the change', async ({ page }) => {
  const view = await open(page);
  const box = (await view
    .locator('.mega-pdf__page-box')
    .first()
    .boundingBox())!;
  await view.getByRole('button', { name: '글자 넣기', exact: true }).click();
  await page.mouse.click(box.x + 140, box.y + 160);
  await page.keyboard.type('임시 메모');
  await page.keyboard.press('Escape');
  await expect(view.locator('.freeTextEditor')).toHaveCount(1);
  await view.locator('.freeTextEditor').first().click();
  await view.getByRole('button', { name: '주석 삭제', exact: true }).click();
  await expect(view.locator('.freeTextEditor')).toHaveCount(0);
  await view
    .locator('.mega-pdf__tools')
    .getByRole('button', { name: '실행 취소', exact: true })
    .click();
  await expect(view.locator('.freeTextEditor')).toHaveCount(1);
});

test('pdf catalog card and dark mobile layout', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('mega-docs-theme', 'dark'),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const view = await open(page);
  await view.screenshot({
    path: `test-results/pdf-mobile-${test.info().project.name}.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#components/professional?to=PdfViewerPro');
  await expect(
    page.getByRole('region', { name: '분기 보고서', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('#PdfViewerPro .mega-pdf__page-box canvas').first(),
  ).toBeVisible({ timeout: 15000 });
});
