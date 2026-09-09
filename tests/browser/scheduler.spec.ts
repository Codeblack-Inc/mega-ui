import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/#scheduler?full=1');
  const view = page.getByRole('region', { name: '9월 팀 일정', exact: true });
  await expect(view).toBeVisible();
  return view;
}
const event = (
  view: ReturnType<typeof open> extends Promise<infer T> ? T : never,
  name: RegExp,
) => view.getByRole('button', { name }).first();

test('scheduler creates, warns on conflicts, edits one occurrence, undoes, saves and reopens', async ({
  page,
}) => {
  const view = await open(page);
  await expect(view.locator('[data-conflict]')).toHaveCount(2);
  await view.getByRole('button', { name: '새 일정', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '새 일정', exact: true });
  await dialog.getByLabel('일정 제목', { exact: true }).fill('스프린트 회고');
  await dialog
    .getByLabel('시작 (Asia/Seoul)', { exact: true })
    .fill('2026-09-09T14:30');
  await dialog
    .getByLabel('종료 (Asia/Seoul)', { exact: true })
    .fill('2026-09-09T15:00');
  await dialog
    .getByLabel('일정 리소스', { exact: true })
    .selectOption('room-b');
  await dialog.getByRole('button', { name: '일정 추가', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('겹쳐요');
  await dialog
    .getByRole('button', { name: '그대로 저장', exact: true })
    .click();
  await expect(event(view, /스프린트 회고/)).toBeVisible();
  await expect(view.locator('[data-conflict]')).toHaveCount(3);
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(view.getByRole('button', { name: /스프린트 회고/ })).toHaveCount(
    0,
  );
  await view.getByRole('button', { name: '다시 실행', exact: true }).click();
  await event(view, /데일리 스탠드업, 9월 9일/).click();
  const editor = page.getByRole('dialog', { name: '일정 편집', exact: true });
  await expect(editor.getByLabel('이 일정만', { exact: true })).toBeChecked();
  await editor.getByLabel('일정 제목', { exact: true }).fill('스탠드업 회고');
  await editor
    .getByRole('button', { name: '일정 변경 적용', exact: true })
    .click();
  await expect(event(view, /스탠드업 회고, 9월 9일/)).toBeVisible();
  await expect(
    view.getByRole('button', { name: /데일리 스탠드업/ }),
  ).toHaveCount(4);
  await view.getByLabel('일정 검색', { exact: true }).fill('스탠드업');
  await expect(view.locator('[data-event-key]')).toHaveCount(5);
  await view.getByRole('button', { name: '필터 지우기', exact: true }).click();
  await page.getByLabel('저장 실패 재현', { exact: true }).check();
  await view.getByRole('button', { name: '일정 저장', exact: true }).click();
  await expect(view.getByRole('alert')).toContainText('저장하지 못했어요');
  await expect(event(view, /스탠드업 회고/)).toBeVisible();
  await page.getByLabel('저장 실패 재현', { exact: true }).uncheck();
  await view.getByRole('button', { name: '일정 저장', exact: true }).click();
  await expect(view.getByText('저장한 상태', { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: '브라우저 저장본 불러오기', exact: true })
    .click();
  await page
    .getByRole('button', { name: '저장본으로 교체', exact: true })
    .click();
  await expect(event(view, /스탠드업 회고/)).toBeVisible();
});

test('scheduler moves and resizes with pointer and keyboard and deletes one occurrence', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  const view = await open(page);
  const review = event(view, /디자인 리뷰/);
  await review.focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(event(view, /디자인 리뷰, 9월 9일 14:15–15:45/)).toBeVisible();
  await page.keyboard.press('Alt+Shift+ArrowDown');
  await expect(event(view, /디자인 리뷰, 9월 9일 14:15–16:00/)).toBeVisible();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(event(view, /디자인 리뷰, 9월 10일 14:15–16:00/)).toBeVisible();
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await view.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(event(view, /디자인 리뷰, 9월 9일 14:00–15:30/)).toBeVisible();
  const source = (await event(view, /제품 소개 촬영/).boundingBox())!;
  const target = (await view
    .locator('[data-date="2026-09-11"].mega-scheduler-pro__column')
    .boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + 10);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, source.y + 10 - 2 * 48, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(
    event(view, /제품 소개 촬영, 9월 11일 11:00–15:00/),
  ).toBeVisible();
  const moved = (await event(view, /제품 소개 촬영/).boundingBox())!;
  await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height - 3);
  await page.mouse.down();
  await page.mouse.move(
    moved.x + moved.width / 2,
    moved.y + moved.height + 48,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect(
    event(view, /제품 소개 촬영, 9월 11일 11:00–16:00/),
  ).toBeVisible();
  await event(view, /데일리 스탠드업, 9월 8일/).click();
  await page
    .getByRole('dialog', { name: '일정 편집', exact: true })
    .getByRole('button', { name: '일정 삭제', exact: true })
    .click();
  const remove = page.getByRole('dialog', { name: '일정을 삭제할까요?' });
  await expect(remove.getByLabel('이 일정만', { exact: true })).toBeChecked();
  await remove.getByRole('button', { name: '일정 삭제', exact: true }).click();
  await expect(
    view.getByRole('button', { name: /데일리 스탠드업/ }),
  ).toHaveCount(4);
});

test('scheduler switches views and time zones and round-trips an iCalendar file', async ({
  page,
}) => {
  const view = await open(page);
  await view.getByLabel('달력 보기', { exact: true }).selectOption('month');
  await expect(view.locator('.mega-scheduler-pro__month-cell')).toHaveCount(42);
  await expect(event(view, /창립 기념일/)).toBeVisible();
  await view
    .getByRole('button', { name: '9월 10일 하루 보기', exact: true })
    .click();
  await expect(view.getByLabel('달력 보기', { exact: true })).toHaveValue(
    'day',
  );
  await expect(view.locator('.mega-scheduler-pro__column')).toHaveCount(1);
  await view.getByLabel('달력 보기', { exact: true }).selectOption('resource');
  await expect(view.locator('.mega-scheduler-pro__column')).toHaveCount(3);
  await expect(
    view.getByRole('heading', { name: '스튜디오', exact: true }),
  ).toBeVisible();
  await view.getByLabel('달력 보기', { exact: true }).selectOption('week');
  await expect(event(view, /디자인 리뷰, 9월 9일 14:00–15:30/)).toBeVisible();
  await view.getByLabel('표시 시간대', { exact: true }).selectOption('UTC');
  await expect(event(view, /디자인 리뷰, 9월 9일 05:00–06:30/)).toBeVisible();
  await view
    .getByLabel('표시 시간대', { exact: true })
    .selectOption('Asia/Seoul');
  const download = page.waitForEvent('download');
  await view
    .getByRole('button', { name: '일정 파일 내려받기', exact: true })
    .click();
  const file = await (await download).path();
  const ics = await readFile(file, 'utf8');
  expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=20');
  expect(ics).toContain('DTSTART;VALUE=DATE:20260914');
  await view
    .getByLabel('일정 파일 불러오기', { exact: true })
    .setInputFiles(file);
  await page.getByRole('button', { name: '파일로 교체', exact: true }).click();
  await expect(event(view, /디자인 리뷰, 9월 9일 14:00–15:30/)).toBeVisible();
  await expect(event(view, /데일리 스탠드업, 9월 9일/)).toBeVisible();
});

test('scheduler catalog, dark mobile layout, empty state and 300-event performance', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('mega-docs-theme', 'dark'),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const view = await open(page);
  await view.getByLabel('달력 보기', { exact: true }).selectOption('day');
  await view.getByLabel('기준 날짜', { exact: true }).fill('2026-09-09');
  await expect(event(view, /디자인 리뷰/)).toBeVisible();
  await view.screenshot({
    path: `test-results/scheduler-mobile-${test.info().project.name}.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel('일정 예제 데이터', { exact: true })
    .selectOption('empty');
  await expect(
    view.getByText('이 기간에 표시할 일정이 없어요.', { exact: true }),
  ).toBeVisible();
  await view.getByLabel('달력 보기', { exact: true }).selectOption('resource');
  await expect(
    view.getByText(
      '표시할 리소스가 없어요. 리소스를 추가한 뒤 다시 확인해 주세요.',
    ),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByLabel('일정 예제 데이터', { exact: true })
    .selectOption('large');
  const start = Date.now();
  await view.getByLabel('달력 보기', { exact: true }).selectOption('month');
  await expect(view.locator('[data-event-key]')).toHaveCount(300);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(1500);
  console.log(`${test.info().project.name}: 300 events ${elapsed}ms`);
  const first = view.locator('[data-event-key="bulk-0|2026-09-07"]');
  await first.focus();
  const movedAt = Date.now();
  await first.press('Alt+ArrowRight');
  await expect(
    view.locator('[data-event-key="bulk-0|2026-09-08"]'),
  ).toHaveCount(1);
  const moveTime = Date.now() - movedAt;
  expect(moveTime).toBeLessThan(800);
  console.log(`${test.info().project.name}: 300-event move ${moveTime}ms`);
  await view.screenshot({
    path: `test-results/scheduler-desktop-${test.info().project.name}.png`,
  });
  await page.goto('/#components/professional?to=SchedulerPro');
  await expect(
    page.getByRole('region', { name: '팀 주간 일정', exact: true }),
  ).toBeVisible();
});
