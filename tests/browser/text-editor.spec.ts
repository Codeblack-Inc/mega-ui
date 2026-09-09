import { test, expect, type Page } from '@playwright/test';
const body = (page: Page) =>
  page.getByRole('textbox', { name: '팀 운영 문서 본문' });
const save = (page: Page) =>
  page.getByRole('button', { name: '문서 저장', exact: true });
async function paste(page: Page, html: string) {
  await body(page).evaluate((element, html) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', html);
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'clipboardData', { value: clipboardData });
    element.dispatchEvent(event);
  }, html);
}
test.beforeEach(async ({ page }) => {
  await page.goto('/#text-editor?full=1');
  await expect(body(page)).toBeVisible();
  await page
    .locator('summary')
    .filter({ hasText: /^예제 옵션$/ })
    .click();
});

test('format, undo/redo, failed save, retry, reopen and cancel', async ({
  page,
}) => {
  await body(page).fill('새 운영 문서');
  await body(page).press('ControlOrMeta+a');
  await page.getByRole('button', { name: '굵게', exact: true }).click();
  await expect(body(page).locator('strong')).toHaveText('새 운영 문서');
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(body(page).locator('strong')).toHaveCount(0);
  await page.getByRole('button', { name: '다시 실행', exact: true }).click();
  await expect(body(page).locator('strong')).toHaveText('새 운영 문서');
  await page.getByLabel('저장 실패 시뮬레이션').check();
  await save(page).click();
  await expect(page.getByRole('alert')).toContainText(
    '문서를 저장하지 못했어요',
  );
  await expect(body(page)).toHaveText('새 운영 문서');
  await page.getByLabel('저장 실패 시뮬레이션').uncheck();
  await save(page).click();
  await expect(
    page.getByText('문서를 저장했어요.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(body(page).locator('strong')).toHaveText('새 운영 문서');
  await page
    .locator('summary')
    .filter({ hasText: /^예제 옵션$/ })
    .click();
  await body(page).fill('취소할 내용');
  await page.getByRole('button', { name: '변경 취소', exact: true }).click();
  await page.getByRole('button', { name: '계속 편집', exact: true }).click();
  await expect(body(page)).toHaveText('취소할 내용');
  await page.getByRole('button', { name: '변경 취소', exact: true }).click();
  await page
    .getByRole('button', { name: '변경 사항 지우기', exact: true })
    .click();
  await expect(body(page)).toHaveText('새 운영 문서');
});

test('links validate URLs; pasted markup drops scripts, images and event handlers', async ({
  page,
}) => {
  await page
    .locator('summary')
    .filter({ hasText: /^링크$/ })
    .click();
  await body(page).fill('참고 문서');
  await body(page).press('ControlOrMeta+a');
  await page
    .getByLabel('링크 주소', { exact: true })
    .fill('javascript:alert(1)');
  await page.getByRole('button', { name: '링크 적용', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('http, https');
  await page
    .getByLabel('링크 주소', { exact: true })
    .fill('https://example.com');
  await page.getByRole('button', { name: '링크 적용', exact: true }).click();
  await expect(body(page).locator('a')).toHaveAttribute(
    'href',
    'https://example.com',
  );
  await page.getByRole('button', { name: '링크 해제', exact: true }).click();
  await expect(body(page).locator('a')).toHaveCount(0);
  await body(page).press('ControlOrMeta+a');
  await paste(
    page,
    '<p onclick="window.__unsafe=1">붙여넣기 <strong>서식</strong><a href="javascript:alert(1)">주소</a><img src=x onerror="window.__unsafe=1"><script>window.__unsafe=1</script></p>',
  );
  await expect(body(page).locator('strong')).toHaveText('서식');
  await expect(
    body(page).locator('script, img, [onclick], [onerror], a'),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => (window as unknown as { __unsafe?: number }).__unsafe,
    ),
  ).toBeUndefined();
});

test('readonly preserves the draft; composition blocks toolbar; narrow dark layout fits', async ({
  page,
}) => {
  await body(page).fill('한글 초안');
  await body(page).dispatchEvent('compositionstart', { data: '한' });
  await expect(save(page)).toBeDisabled();
  await body(page).dispatchEvent('compositionend', { data: '한' });
  await expect(save(page)).toBeEnabled();
  await page.getByLabel('읽기 전용', { exact: true }).check();
  await expect(body(page)).toHaveAttribute('contenteditable', 'false');
  await expect(save(page)).toHaveCount(0);
  await page.getByLabel('읽기 전용', { exact: true }).uncheck();
  await expect(body(page)).toHaveText('한글 초안');
  await expect(save(page)).toBeEnabled();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() =>
    document
      .querySelectorAll('[data-mega-theme]')
      .forEach((element) => element.setAttribute('data-mega-theme', 'dark')),
  );
  expect(
    await page
      .locator('.mega-text-editor')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await body(page).focus();
  await expect(body(page)).toBeFocused();
  await page.evaluate(() => {
    document.documentElement.style.colorScheme = 'dark';
  });
  await page.screenshot({
    path: test.info().outputPath('text-editor-dark-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

test('corrupt saved input stays untouched and storage failure retains edits', async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem('mega-ui:text-editor:example:v1', '{broken'),
  );
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('불러오지 못했어요');
  expect(
    await page.evaluate(() =>
      localStorage.getItem('mega-ui:text-editor:example:v1'),
    ),
  ).toBe('{broken');
  await page.evaluate(() =>
    localStorage.removeItem('mega-ui:text-editor:example:v1'),
  );
  await page.reload();
  await body(page).fill('보존할 내용');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota', 'QuotaExceededError');
    };
  });
  await save(page).click();
  await expect(page.getByRole('alert')).toContainText(
    '문서를 저장하지 못했어요',
  );
  await expect(body(page)).toHaveText('보존할 내용');
});

test('1000 paragraphs load and accept end-of-document input within 3 seconds each', async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      'mega-ui:text-editor:example:v1',
      JSON.stringify({
        version: 1,
        document: {
          type: 'doc',
          content: Array.from({ length: 1000 }, (_, index) => ({
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `${index + 1}번째 문단: 한글 문서 표시와 입력 응답을 점검해요.`,
              },
            ],
          })),
        },
      }),
    ),
  );
  const started = Date.now();
  await page.reload();
  await expect(body(page).locator('p')).toHaveCount(1000);
  const loadMs = Date.now() - started;
  expect(loadMs).toBeLessThan(3000);
  const editStarted = Date.now();
  await body(page).locator('p').last().click();
  await body(page).press('ControlOrMeta+End');
  await page.keyboard.insertText('끝부분 편집');
  await expect(body(page)).toContainText('끝부분 편집');
  const editMs = Date.now() - editStarted;
  expect(editMs).toBeLessThan(3000);
  console.log(`${test.info().project.name}: load=${loadMs}ms edit=${editMs}ms`);
});

test('keyboard formatting, block commands and pending save lock', async ({
  page,
}) => {
  await body(page).fill('키보드 문서');
  await body(page).press('ControlOrMeta+a');
  await body(page).press('ControlOrMeta+b');
  await expect(body(page).locator('strong')).toHaveText('키보드 문서');
  for (const [name, selector] of [
    ['제목', 'h2'],
    ['글머리 목록', 'ul'],
    ['번호 목록', 'ol'],
    ['인용', 'blockquote'],
    ['코드 블록', 'pre'],
  ] as const) {
    await body(page).press('ControlOrMeta+a');
    await page.getByRole('button', { name, exact: true }).click();
    await expect(
      body(page).locator(selector).filter({ hasText: '키보드 문서' }),
    ).toBeVisible();
    await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  }
  await save(page).click();
  await expect(body(page)).toHaveAttribute('contenteditable', 'false');
  await expect(save(page)).toBeDisabled();
  await expect(
    page.getByText('문서를 저장했어요.', { exact: true }),
  ).toBeVisible();
  await expect(body(page)).toHaveAttribute('contenteditable', 'true');
});

test('writing canvas leads the layout and inspectors switch without losing text', async ({
  page,
}) => {
  await page
    .locator('summary')
    .filter({ hasText: /^예제 옵션$/ })
    .click();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect(page.locator('.mega-text-editor__panel[open]')).toHaveCount(0);
  expect((await body(page).boundingBox())!.y).toBeLessThan(330);
  await body(page).fill('계속 작성할 문서');
  await page.screenshot({
    path: test.info().outputPath('editor-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.locator('summary[aria-label="이미지 편집"]').click();
  await expect(page.getByLabel('이미지 주소', { exact: true })).toBeVisible();
  await page.locator('summary[aria-label="표 편집"]').click();
  await expect(page.getByLabel('이미지 주소', { exact: true })).toBeHidden();
  await expect(page.getByLabel('행 수', { exact: true })).toBeVisible();
  await page.getByLabel('행 수', { exact: true }).press('Escape');
  await expect(page.locator('.mega-text-editor__panel[open]')).toHaveCount(0);
  await expect(body(page)).toHaveText('계속 작성할 문서');
  await page.setViewportSize({ width: 375, height: 812 });
  expect((await body(page).boundingBox())!.y).toBeLessThan(460);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator('.mega-text-editor')
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('editor-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
