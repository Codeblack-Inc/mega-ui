import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const body = (page: Page) =>
  page.getByRole('textbox', { name: '팀 운영 문서 본문' });
const button = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true });
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);
async function panel(page: Page, title: string) {
  const summary = page.locator(`summary[aria-label="${title}"]`);
  if (!(await summary.locator('..').getAttribute('open'))) {
    const open = await summary
      .locator('..')
      .evaluate((el) => (el as HTMLDetailsElement).open);
    if (!open) await summary.click();
  }
}
async function importMarkdown(page: Page, text: string) {
  await panel(page, '문서 가져오기·내보내기');
  await page.getByLabel('Markdown 원문', { exact: true }).fill(text);
  await button(page, 'Markdown 적용 검토').click();
  await button(page, '문서 바꾸기').click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/#text-editor?full=1');
  await expect(body(page)).toBeVisible();
  await page
    .locator('summary')
    .filter({ hasText: /^예제 옵션$/ })
    .click();
});

test('Markdown import, replacement undo, export and JSON reopen keep content', async ({
  page,
}) => {
  await importMarkdown(
    page,
    '# 업무 문서\n\n**중요한 내용**과 ++밑줄++\n\n| 항목 | 수량 |\n| --- | --- |\n| 서류 | 3 |',
  );
  await expect(body(page).locator('h1')).toHaveText('업무 문서');
  await expect(body(page).locator('table')).toContainText('서류');
  await button(page, '실행 취소').click();
  await expect(body(page)).toContainText('팀 운영 안내');
  await button(page, '다시 실행').click();
  await expect(body(page).locator('strong')).toHaveText('중요한 내용');
  await button(page, '문서 저장').click();
  await expect(
    page.getByText('문서를 저장했어요.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(body(page).locator('u')).toHaveText('밑줄');
  await panel(page, '문서 가져오기·내보내기');
  await button(page, 'Markdown 내보내기 검토').click();
  await expect(page.getByRole('dialog')).toContainText('++글자++');
  const download = page.waitForEvent('download');
  await button(page, 'Markdown 내려받기').click();
  const text = await readFile((await (await download).path())!, 'utf8');
  expect(text).toContain('# 업무 문서');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '닫기', exact: true })
    .last()
    .click();
  const jsonDownload = page.waitForEvent('download');
  await button(page, '문서 JSON 내려받기').click();
  const json = await readFile((await (await jsonDownload).path())!, 'utf8');
  await page.getByLabel('문서 JSON 파일', { exact: true }).setInputFiles({
    name: 'document.json',
    mimeType: 'application/json',
    buffer: Buffer.from(json),
  });
  await button(page, '문서 바꾸기').click();
  await expect(body(page).locator('table')).toContainText('서류');
  await page
    .getByLabel('Markdown 원문', { exact: true })
    .fill('![위험](javascript:alert)');
  await button(page, 'Markdown 적용 검토').click();
  await expect(page.getByRole('alert')).toContainText(
    'Markdown을 읽지 못했어요',
  );
  await expect(body(page)).toContainText('업무 문서');
});

test('table rows, columns, keyboard cell selection, merge, split, width and undo', async ({
  page,
}) => {
  await body(page).click();
  await panel(page, '표 편집');
  await page.getByLabel('행 수', { exact: true }).fill('2');
  await page.getByLabel('열 수', { exact: true }).fill('2');
  await button(page, '표 추가').click();
  await expect(body(page).locator('tr')).toHaveCount(2);
  await body(page).locator('th').first().click();
  await page.keyboard.insertText('항목');
  await button(page, '아래에 행 추가').click();
  await expect(body(page).locator('tr')).toHaveCount(3);
  await button(page, '오른쪽에 열 추가').click();
  await expect(body(page).locator('tr').first().locator('th,td')).toHaveCount(
    3,
  );
  await button(page, '표 전체 선택').click();
  await button(page, '셀 병합').click();
  await expect(body(page).locator('[colspan="3"][rowspan="3"]')).toHaveCount(1);
  await button(page, '셀 분할').click();
  await expect(body(page).locator('th,td')).toHaveCount(9);
  await body(page).locator('th,td').first().click();
  await page.getByLabel('선택 셀 너비', { exact: true }).fill('180');
  await button(page, '셀 너비 적용').click();
  await expect(body(page).locator('th,td').first()).toHaveAttribute(
    'colwidth',
    '180',
  );
  await button(page, '문서 저장').click();
  await expect(
    page.getByText('문서를 저장했어요.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(body(page).locator('th,td')).toHaveCount(9);
  await panel(page, '표 편집');
  await body(page).locator('th,td').first().click();
  await button(page, '표 삭제').click();
  await expect(body(page).locator('table')).toHaveCount(0);
  await button(page, '실행 취소').click();
  await expect(body(page).locator('table')).toBeVisible();
});

test('image file validation, description, resizing, save, reopen and deletion undo', async ({
  page,
}) => {
  await panel(page, '이미지 편집');
  await page.getByLabel('이미지 파일', { exact: true }).setInputFiles({
    name: 'bad.png',
    mimeType: 'image/png',
    buffer: Buffer.from('bad'),
  });
  await expect(page.getByRole('alert')).toContainText(
    '이미지 파일을 읽지 못했어요',
  );
  await page
    .getByLabel('이미지 파일', { exact: true })
    .setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByLabel('이미지 주소', { exact: true })).toHaveValue(
    /^data:image\/png;base64,/,
  );
  await page.getByLabel('이미지 설명', { exact: true }).fill('운영 흐름');
  await page.getByLabel('이미지 너비', { exact: true }).fill('200');
  await button(page, '이미지 추가').click();
  await expect(body(page).getByAltText('운영 흐름')).toHaveAttribute(
    'width',
    '200',
  );
  await body(page).getByAltText('운영 흐름').click();
  await button(page, '선택 이미지 정보 불러오기').click();
  await page
    .getByLabel('이미지 설명', { exact: true })
    .fill('수정한 운영 흐름');
  await page.getByLabel('이미지 너비', { exact: true }).fill('160');
  await button(page, '선택 이미지 수정').click();
  await expect(body(page).getByAltText('수정한 운영 흐름')).toHaveAttribute(
    'width',
    '160',
  );
  await button(page, '문서 저장').click();
  await expect(
    page.getByText('문서를 저장했어요.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(body(page).getByAltText('수정한 운영 흐름')).toHaveAttribute(
    'width',
    '160',
  );
  await panel(page, '이미지 편집');
  await body(page).getByAltText('수정한 운영 흐름').click();
  await button(page, '선택 이미지 삭제').click();
  await expect(body(page).locator('img')).toHaveCount(0);
  await button(page, '실행 취소').click();
  await expect(body(page).locator('img')).toHaveCount(1);
  await panel(page, '문서 가져오기·내보내기');
  await button(page, 'Markdown 내보내기 검토').click();
  await expect(page.getByRole('dialog')).toContainText(
    '이미지 크기는 Markdown에 포함되지 않아요',
  );
});

test('block keyboard and drag reorder, duplicate, delete and undo retain documents', async ({
  page,
}) => {
  await importMarkdown(page, '첫 문단\n\n둘째 문단\n\n셋째 문단');
  await panel(page, '블록 순서 편집');
  await page
    .getByRole('group', { name: '1번 블록 작업', exact: true })
    .getByRole('button', { name: '아래로', exact: true })
    .click();
  await expect(body(page).locator('p').first()).toHaveText('둘째 문단');
  await page
    .getByRole('group', { name: '1번 블록 작업', exact: true })
    .getByRole('button', { name: '복제', exact: true })
    .click();
  await expect(body(page).locator('p')).toHaveCount(4);
  await page
    .getByRole('group', { name: '1번 블록 작업', exact: true })
    .getByRole('button', { name: '삭제', exact: true })
    .click();
  await expect(body(page).locator('p')).toHaveCount(3);
  await button(page, '실행 취소').click();
  await expect(body(page).locator('p')).toHaveCount(4);
  await page
    .locator('.mega-text-editor__blocks > li')
    .first()
    .dragTo(page.locator('.mega-text-editor__blocks > li').last());
  await expect(body(page).locator('p').last()).toHaveText('둘째 문단');
  await button(page, '실행 취소').click();
  await expect(body(page).locator('p').last()).toHaveText('셋째 문단');
});

test('pasted HTML retains safe tables and images, rejects unsafe geometry, and exports loss warnings', async ({
  page,
}) => {
  const html = `<table><tr><th>제목</th><th>값</th></tr><tr><td>A</td><td>B</td></tr></table><img src="data:image/png;base64,${png.toString('base64')}" alt="안전한 그림"><img src="javascript:alert(1)"><script>window.__unsafe = true</script>`;
  await body(page).click();
  await body(page).press('ControlOrMeta+a');
  const paste = async (html: string) =>
    body(page).evaluate((element, html) => {
      const data = new DataTransfer();
      data.setData('text/html', html);
      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'clipboardData', { value: data });
      element.dispatchEvent(event);
    }, html);
  await paste(html);
  await expect(body(page).locator('table')).toContainText('제목');
  await expect(body(page).locator('img')).toHaveCount(1);
  await expect(body(page).locator('script, [onclick]')).toHaveCount(0);
  await panel(page, '표 편집');
  await body(page).locator('th').first().click();
  await button(page, '표 전체 선택').click();
  await button(page, '셀 병합').click();
  await panel(page, '문서 가져오기·내보내기');
  await button(page, 'Markdown 내보내기 검토').click();
  await expect(page.getByRole('dialog')).toContainText('셀 병합');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '닫기', exact: true })
    .last()
    .click();
  await body(page).click();
  await body(page).press('ControlOrMeta+End');
  await paste('<table><tr><td colspan="999999">위험한 크기</td></tr></table>');
  await expect(page.getByRole('alert')).toContainText(
    '변경을 적용하지 않았어요',
  );
  await expect(body(page)).not.toContainText('위험한 크기');
});

test('column drag resize persists and readonly blocks the resize gesture', async ({
  page,
}) => {
  await importMarkdown(page, '| 항목 | 값 |\n| --- | --- |\n| 문서 | 3 |');
  const cell = body(page).locator('th').first();
  await cell.scrollIntoViewIfNeeded();
  let box = (await cell.boundingBox())!;
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 60, box.y + box.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(cell).toHaveAttribute('colwidth', /\d+/);
  const width = await cell.getAttribute('colwidth');
  await page.getByLabel('읽기 전용', { exact: true }).check();
  box = (await cell.boundingBox())!;
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 90, box.y + box.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(cell).toHaveAttribute('colwidth', width!);
  await page.getByLabel('읽기 전용', { exact: true }).uncheck();
  await button(page, '문서 저장').click();
  await expect(
    page.getByText('문서를 저장했어요.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(body(page).locator('th').first()).toHaveAttribute(
    'colwidth',
    width!,
  );
});

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });
  test('touch formatting and image tools fit the narrow screen', async ({
    page,
  }) => {
    await body(page).fill('터치 편집');
    await body(page).press('ControlOrMeta+a');
    await button(page, '굵게').tap();
    await expect(body(page).locator('strong')).toHaveText('터치 편집');
    await page.locator('summary[aria-label="이미지 편집"]').tap();
    const rect = (await button(page, '이미지 추가').boundingBox())!;
    expect(rect.height).toBeGreaterThanOrEqual(44);
    expect(
      await page
        .locator('.mega-text-editor')
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath('editor-touch.png'),
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test('row height input, drag, undo, reset and saved reopen preserve table content', async ({
  page,
}) => {
  await importMarkdown(page, '| 항목 | 값 |\n| --- | --- |\n| 문서 | 3 |');
  await panel(page, '표 편집');
  const row = body(page).locator('tr').first();
  await row.locator('th').first().click();
  await page.getByLabel('선택 행 높이 (px)', { exact: true }).fill('96');
  await button(page, '행 높이 적용').click();
  await expect(row).toHaveCSS('height', '96px');
  await expect(body(page).locator('tr').last()).not.toHaveCSS('height', '96px');
  await button(page, '표 전체 선택').click();
  await page.getByLabel('선택 행 높이 (px)', { exact: true }).fill('120');
  await button(page, '행 높이 적용').click();
  await expect(body(page).locator('tr').last()).toHaveCSS('height', '120px');
  await button(page, '실행 취소').click();
  await expect(row).toHaveCSS('height', '96px');
  await page.getByLabel('선택 행 높이 (px)', { exact: true }).fill('');
  await button(page, '행 높이 적용').click();
  expect((await row.boundingBox())!.height).toBeLessThan(96);
  await page.locator('summary[aria-label="표 편집"]').click();
  const box = (await row.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + box.height - 2);
  await expect(body(page)).toHaveClass(/row-resize-cursor/);
  await page.mouse.down();
  await page.mouse.move(box.x + 30, box.y + box.height + 58, { steps: 8 });
  await page.mouse.up();
  const height = Math.round(box.height + 60);
  await expect(row).toHaveCSS('height', `${height}px`);
  await button(page, '실행 취소').click();
  expect((await row.boundingBox())!.height).toBeLessThan(height);
  await button(page, '다시 실행').click();
  await expect(row).toHaveCSS('height', `${height}px`);
  await page.getByLabel('읽기 전용', { exact: true }).check();
  const frozen = (await row.boundingBox())!;
  await page.mouse.move(frozen.x + 30, frozen.y + frozen.height - 2);
  await page.mouse.down();
  await page.mouse.move(frozen.x + 30, frozen.y + frozen.height + 45, {
    steps: 4,
  });
  await page.mouse.up();
  await expect(row).toHaveCSS('height', `${height}px`);
  await page.getByLabel('읽기 전용', { exact: true }).uncheck();
  await button(page, '문서 저장').click();
  await expect(
    page.getByText('문서를 저장했어요.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(body(page).locator('tr').first()).toHaveCSS(
    'height',
    `${height}px`,
  );
  await expect(body(page).locator('table')).toContainText('문서');
  await expect(page.locator('.mega-text-editor__canvas')).toHaveCSS(
    'box-shadow',
    'none',
  );
  await page.screenshot({
    path: test.info().outputPath('editor-table-detail.png'),
    fullPage: true,
  });
});
