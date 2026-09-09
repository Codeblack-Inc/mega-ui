// Run with npm run dev, then open /readiness.html. No browser test dependency.
import { createRef, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  Button,
  Combobox,
  DataGrid,
  DateRangePicker,
  MultiSelect,
  NavRailItem,
  SideNavItem,
  TabPanel,
  Tabs,
  ToastProvider,
  useToast,
} from '@mega-ui/react';
import { ListWorkflow, SaveWorkflow } from './workflow-demos';
import '../src/styles/index.scss';

const fixture = document.getElementById('fixture')!;
const root = createRoot(fixture);
const results = document.getElementById('results')!;
const wait = (ms = 0) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const find = <T extends Element>(selector: string): T => {
  const element = fixture.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
};
const mount = async (content: ReactNode) => {
  flushSync(() => root.render(content));
  await wait();
};
const type = async (input: HTMLInputElement, value: string) => {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )!.set!.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await wait();
};
const key = async (element: Element, value: string, isComposing = false) => {
  const event = new KeyboardEvent('keydown', {
    key: value,
    bubbles: true,
    cancelable: true,
    isComposing,
  });
  element.dispatchEvent(event);
  await wait();
  return event;
};
const click = async (selector: string) => {
  find<HTMLElement>(selector).click();
  await wait();
};
const button = (text: string) => {
  const found = [...fixture.querySelectorAll('button')].find(
    (element) => element.textContent?.trim() === text,
  );
  if (!found) throw new Error(`Missing button ${text}`);
  return found;
};
let failures = 0;
async function test(name: string, run: () => Promise<void>) {
  await mount(null);
  const row = document.createElement('li');
  results.append(row);
  try {
    await run();
    row.textContent = `PASS ${name}`;
  } catch (error) {
    failures++;
    row.textContent = `FAIL ${name}: ${String(error)}`;
  }
}

const options = [
  { value: 'a', label: '사용 불가', disabled: true },
  { value: 'b', label: '김민준' },
  { value: 'c', label: '이서연' },
];
await test('Navigation items forward native refs, focus and attributes', async () => {
  const sideButton = createRef<HTMLButtonElement>();
  const sideLink = createRef<HTMLAnchorElement>();
  const railButton = createRef<HTMLButtonElement>();
  const railLink = createRef<HTMLAnchorElement>();
  let clicks = 0;
  await mount(
    <form>
      <SideNavItem ref={sideButton} active onClick={() => clicks++}>
        홈
      </SideNavItem>
      <SideNavItem ref={sideLink} href="" target="_blank" rel="noreferrer">
        문서
      </SideNavItem>
      <NavRailItem
        ref={(node) => {
          railButton.current = node;
          return () => {
            railButton.current = null;
          };
        }}
        icon="설정"
        label="설정"
        disabled
        name="section"
        value="settings"
        onClick={() => clicks++}
      />
      <NavRailItem
        ref={(node) => {
          railLink.current = node;
        }}
        href="#reports"
        icon="리포트"
        label="리포트"
        download="report.html"
      />
    </form>,
  );
  assert(sideButton.current instanceof HTMLButtonElement, 'side button ref');
  assert(sideLink.current instanceof HTMLAnchorElement, 'empty href link ref');
  assert(railButton.current instanceof HTMLButtonElement, 'rail callback ref');
  assert(
    railLink.current instanceof HTMLAnchorElement,
    'rail link callback ref',
  );
  assert(sideButton.current?.type === 'button', 'default must not submit form');
  assert(
    sideButton.current?.getAttribute('aria-current') === 'page',
    'active semantics',
  );
  assert(
    sideLink.current?.target === '_blank' &&
      sideLink.current.rel === 'noreferrer',
    'native link attributes',
  );
  assert(railLink.current?.download === 'report.html', 'download attribute');
  assert(
    railButton.current?.disabled &&
      railButton.current.name === 'section' &&
      railButton.current.value === 'settings',
    'native button attributes',
  );
  for (const ref of [sideButton, sideLink, railLink]) {
    ref.current?.focus();
    assert(
      document.activeElement === ref.current,
      'ref focus did not reach DOM',
    );
  }
  sideButton.current?.click();
  railButton.current?.click();
  assert(clicks === 1, 'disabled button dispatched click');
  await mount(null);
  for (const ref of [sideButton, sideLink, railButton, railLink]) {
    assert(ref.current === null, 'unmount did not clear ref');
  }
});
await test('Combobox disabled / required / selection / IME / reset', async () => {
  await mount(
    <form>
      <Combobox name="owner" defaultValue="b" options={options} disabled />
    </form>,
  );
  assert(!new FormData(find('form')).has('owner'), 'disabled value submitted');
  await mount(null);
  await mount(
    <form>
      <Combobox name="owner" options={options} required />
    </form>,
  );
  const input = find<HTMLInputElement>('[role=combobox]');
  await type(input, '존재하지 않음');
  assert(!input.checkValidity(), 'query must not satisfy required selection');
  await type(input, '');
  await key(input, 'ArrowDown');
  await key(input, 'Enter', true);
  assert(
    new FormData(find('form')).get('owner') === '',
    'IME committed option',
  );
  await key(input, 'Enter');
  assert(
    new FormData(find('form')).get('owner') === 'b',
    'did not skip disabled option',
  );
  assert(input.checkValidity(), 'selected value is invalid');
  await key(input, 'ArrowDown');
  assert(
    fixture.querySelectorAll('[role=option]').length === 3,
    'reopened list lost other options',
  );
  find<HTMLFormElement>('form').reset();
  await wait();
  assert(
    new FormData(find('form')).get('owner') === '',
    'reset retained selection',
  );
});
await test('Combobox loading blocks stale keyboard selection and composes handlers', async () => {
  let blocked = false;
  const render = (loading: boolean) => (
    <Combobox
      options={options}
      loading={loading}
      onValueChange={(value) => {
        if (value) blocked = true;
      }}
    />
  );
  await mount(render(false));
  const input = find<HTMLInputElement>('[role=combobox]');
  await key(input, 'ArrowDown');
  await mount(render(true));
  await key(input, 'Enter');
  assert(!blocked, 'loading selected a stale option');
  assert(
    !input.getAttribute('aria-activedescendant'),
    'loading points at absent option',
  );
  await mount(null);
  await mount(
    <Combobox
      options={options}
      onKeyDown={(event) => event.preventDefault()}
    />,
  );
  await key(find('[role=combobox]'), 'ArrowDown');
  assert(
    !find('[role=combobox]').getAttribute('aria-activedescendant'),
    'consumer preventDefault ignored',
  );
});
await test('Date range changes, presets, bounds and native reset', async () => {
  await mount(
    <form>
      <DateRangePicker
        label="기간"
        startName="start"
        endName="end"
        startProps={{ defaultValue: '2026-09-12', max: '2026-09-30' }}
        endProps={{ defaultValue: '2026-09-09' }}
        presets={[{ label: '이번 달', start: '2026-09-01', end: '2026-09-30' }]}
      />
    </form>,
  );
  const start = find<HTMLInputElement>('[name=start]');
  const end = find<HTMLInputElement>('[name=end]');
  assert(
    !start.checkValidity() && !end.checkValidity(),
    'inverted defaults valid',
  );
  await type(end, '2026-09-15');
  assert(
    start.max === '2026-09-15' && start.checkValidity(),
    'uncontrolled bounds stale',
  );
  button('이번 달').click();
  await wait();
  assert(
    start.value === '2026-09-01' && end.min === '2026-09-01',
    'preset bounds stale',
  );
  find<HTMLFormElement>('form').reset();
  await wait();
  assert(
    start.value === '2026-09-12' && end.min === '2026-09-12',
    'reset bounds stale',
  );
});
await test('Tabs panel relationships and keyboard entry', async () => {
  await mount(
    <>
      <Tabs
        id="test-tabs"
        label="탭"
        items={[
          { value: 'a', label: 'A', disabled: true },
          { value: 'b', label: 'B' },
        ]}
      />
      <TabPanel tabsId="test-tabs" value="a" active={false} />
      <TabPanel tabsId="test-tabs" value="b" active />
    </>,
  );
  const tab = find<HTMLButtonElement>('[role=tab][tabindex="0"]');
  assert(tab.textContent === 'B', 'disabled initial tab trapped focus');
  assert(
    document
      .getElementById(tab.getAttribute('aria-controls')!)
      ?.getAttribute('aria-labelledby') === tab.id,
    'relationship missing',
  );
});
await test('DataGrid preserves embedded input arrow keys', async () => {
  await mount(
    <DataGrid
      rows={[{ id: 'a' }]}
      columns={[
        {
          key: 'id',
          header: '이름',
          render: () => <input defaultValue="edit" aria-label="편집" />,
        },
        { key: 'extra', header: '값' },
      ]}
      getRowId={(row) => row.id}
    />,
  );
  const input = find<HTMLInputElement>('input[aria-label="편집"]');
  input.focus();
  const event = await key(input, 'ArrowRight');
  assert(
    !event.defaultPrevented && document.activeElement === input,
    'grid consumed input cursor key',
  );
});
await test('MultiSelect reports search misses and retry', async () => {
  await mount(
    <MultiSelect
      label="팀"
      name="teams"
      options={[{ value: 'a', label: '디자인' }]}
    />,
  );
  await type(find('input[type=search]'), 'missing');
  assert(
    find('[role=status]').textContent?.includes('검색 결과'),
    'missing empty status',
  );
  let retried = false;
  await mount(
    <MultiSelect
      label="팀"
      name="teams"
      options={[]}
      error="실패"
      onRetry={() => {
        retried = true;
      }}
    />,
  );
  button('다시 시도').click();
  assert(retried, 'retry unavailable');
});
let toastHandle: ReturnType<ReturnType<typeof useToast>>;
function ToastDemo({ duration = 0 }: { duration?: number }) {
  const toast = useToast();
  return (
    <Button
      onClick={() => {
        toastHandle = toast({
          title: '진행 중',
          duration,
          action: { label: '실행', onClick() {} },
        });
      }}
    >
      알림 생성
    </Button>
  );
}
await test('Toast persistent close, update and dismiss', async () => {
  await mount(
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>,
  );
  button('알림 생성').click();
  await wait();
  toastHandle.update({ title: '완료' });
  await wait();
  assert(find('.mega-toast__title').textContent === '완료', 'update failed');
  await click('[aria-label="완료 알림 닫기"]');
  await wait(450);
  assert(
    !fixture.querySelector('.mega-toast'),
    'persistent toast cannot close',
  );
  button('알림 생성').click();
  await wait();
  toastHandle.dismiss();
  await wait(450);
  assert(!fixture.querySelector('.mega-toast'), 'handle dismiss failed');
});
await test('Toast timeout pauses while keyboard focus is inside', async () => {
  await mount(
    <ToastProvider>
      <ToastDemo duration={100} />
    </ToastProvider>,
  );
  button('알림 생성').click();
  await wait();
  const action = button('실행');
  action.focus();
  await wait(180);
  assert(
    !find('.mega-toast').hasAttribute('data-leaving'),
    'focused toast expired',
  );
  action.blur();
  await wait(550);
  assert(!fixture.querySelector('.mega-toast'), 'toast did not resume');
});
await test('Save failure preserves draft; retry completes', async () => {
  await mount(<SaveWorkflow />);
  await click('input[type=checkbox]');
  await type(find('#workflow-name'), '수정한 이름');
  find<HTMLFormElement>('form').requestSubmit();
  await wait(550);
  assert(
    find<HTMLInputElement>('#workflow-name').value === '수정한 이름',
    'failure lost draft',
  );
  assert(
    fixture.textContent?.includes('저장하지 못했어요'),
    'failure not reported',
  );
  find<HTMLFormElement>('form').requestSubmit();
  await wait(550);
  assert(
    fixture.textContent?.includes('저장했어요.'),
    'retry did not complete',
  );
});
await test('Bulk partial failure retries only failed rows', async () => {
  await mount(<ListWorkflow />);
  await click('input[aria-label="모든 행 선택"]');
  await click('button[aria-label="다음 페이지"]');
  await click('input[aria-label="2 행 선택"]');
  button('선택 항목 보관').click();
  await wait(550);
  assert(
    fixture.textContent?.includes('1개를 보관하지 못했어요'),
    'missing partial failure',
  );
  assert(
    !fixture.querySelector('input[aria-label="1 행 선택"]'),
    'successful row retained',
  );
  button('실패한 항목만 재시도').click();
  await wait(550);
  assert(
    !fixture.querySelector('input[aria-label="2 행 선택"]'),
    'failed row not retried',
  );
});
await mount(null);
document.title = failures
  ? `${failures} browser checks failed`
  : 'All browser checks passed';
document.body.dataset.result = failures ? 'failed' : 'passed';
const summary = document.createElement('p');
summary.textContent = `${results.children.length - failures}/${results.children.length} passed`;
results.after(summary);
