import { useEffect, useState } from 'react';
import {
  Accordion,
  AppShell,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  CodeBlock,
  Container,
  MegaIcon,
  PageHeader,
  SideNav,
  SideNavSection,
  SideNavItem,
  Stack,
  Text,
  ThemeProvider,
  ToastProvider,
  TopBar,
  TopBarLink,
} from '@mega-ui/react';
import { categories } from './catalog';
import { ComponentSearch } from './component-search';
import { GalleryPage } from './gallery';
import { HomePage } from './home';
import {
  componentCount,
  docs,
  exampleGroups,
  examples,
  routes,
} from './routes';
import '../src/styles/index.scss';
import './site.scss';

const HOME = 'home';
const GALLERY = 'examples';
const THEME_KEY = 'mega-docs-theme';
/** Examples designed at phone width; shown in a "모바일 폭" preview frame. */
const NARROW = ['payments', 'transfer', 'login', 'signup'];

/** `#id?full=1&to=Name` — `full` drops the docs chrome, `to` scrolls to a card. */
function parseHash(hash: string) {
  const [id = '', query = ''] = hash.replace(/^#/, '').split('?');
  return { id, params: new URLSearchParams(query) };
}

/** Hash aliases keep older links (#components, #forms) pointing at a real page. */
function resolveRoute(id: string) {
  if (!id || id === HOME) return HOME;
  if (id === GALLERY) return GALLERY;
  if (id === 'components') return 'components/foundation';
  if (id === 'forms') return 'components/inputs';
  return routes.some((route) => route.id === id) ? id : null;
}

function initialDark() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
  } catch {
    /* private mode */
  }
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  const [hash, setHash] = useState(() => parseHash(location.hash));
  const [dark, setDark] = useState(initialDark);
  const active = resolveRoute(hash.id) ?? HOME;
  const full = hash.params.get('full') === '1';

  useEffect(() => {
    let currentHash = location.hash;
    let currentIndex = Number(history.state?.megaDocsIndex) || 0;
    history.replaceState({ ...history.state, megaDocsIndex: currentIndex }, '');
    const onHashChange = () => {
      if (location.hash === currentHash) return;
      const targetIndex = history.state?.megaDocsIndex as number | undefined;
      // The example owns its router; the UI package does not intercept navigation.
      if (
        !window.dispatchEvent(
          new Event('mega-before-route', { cancelable: true }),
        )
      ) {
        history.go(
          typeof targetIndex === 'number' ? currentIndex - targetIndex : -1,
        );
        return;
      }
      currentIndex =
        typeof targetIndex === 'number' ? targetIndex : currentIndex + 1;
      currentHash = location.hash;
      history.replaceState(
        { ...history.state, megaDocsIndex: currentIndex },
        '',
      );
      setHash(parseHash(currentHash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const to = hash.params.get('to');
    const target = to
      ? (document.getElementById(to) ??
        document.querySelector(`[data-members~="${CSS.escape(to)}"]`))
      : null;
    if (target) target.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [active, hash]);

  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [dark]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {
      /* private mode */
    }
  };

  const page = routes.find((route) => route.id === active);
  const isExample =
    active === GALLERY || examples.some((item) => item.id === active);
  const isComponent = active.startsWith('components/');

  if (page && full) {
    return (
      <ThemeProvider className="docs-app" theme={dark ? 'dark' : 'light'}>
        <ToastProvider>
          <main id="main" tabIndex={-1} className="docs-full">
            <page.Component key={page.id} />
            <a className="docs-full__back" href={`#${page.id}`}>
              <MegaIcon name="chevronLeft" width={14} height={14} />
              문서로 돌아가기
            </a>
          </main>
        </ToastProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider className="docs-app" theme={dark ? 'dark' : 'light'}>
      <ToastProvider>
        <a
          className="skip-link"
          href="#main"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById('main')?.focus();
            document.getElementById('main')?.scrollIntoView();
          }}
        >
          본문으로 건너뛰기
        </a>
        <TopBar
          className="docs-topbar"
          navLabel="사이트 메뉴"
          brand={
            <a className="docs-logo" href={`#${HOME}`}>
              <span className="docs-logo__mark">m</span>mega
              <span className="docs-logo__suffix">ui</span>
            </a>
          }
          actions={
            <Button
              variant="secondary"
              size="sm"
              aria-pressed={dark}
              onClick={toggleDark}
            >
              {dark ? '라이트 모드' : '다크 모드'}
            </Button>
          }
        >
          <TopBarLink href={`#${HOME}`} active={active === HOME}>
            소개
          </TopBarLink>
          <TopBarLink href="#components/foundation" active={isComponent}>
            컴포넌트
          </TopBarLink>
          <TopBarLink href={`#${GALLERY}`} active={isExample}>
            화면 예제
          </TopBarLink>
          <TopBarLink href="./getting-started.md">시작하기</TopBarLink>
        </TopBar>
        <AppShell
          className="docs-shell"
          sidebar={
            <Stack gap={4} className="docs-sidebar">
              <ComponentSearch />
              {isExample ? (
                <SideNav label="화면 예제 탐색">
                  <SideNavSection>
                    <SideNavItem
                      href={`#${GALLERY}`}
                      active={active === GALLERY}
                      badge={<Badge tone="brand">{examples.length}</Badge>}
                    >
                      모든 화면
                    </SideNavItem>
                  </SideNavSection>
                  {exampleGroups.map((group) => (
                    <SideNavSection key={group.key} title={group.label}>
                      {group.items.map((item) => (
                        <SideNavItem
                          key={item.id}
                          href={`#${item.id}`}
                          active={active === item.id}
                        >
                          {item.label}
                        </SideNavItem>
                      ))}
                    </SideNavSection>
                  ))}
                </SideNav>
              ) : (
                <SideNav label="문서 탐색">
                  <SideNavSection title="컴포넌트">
                    {categories.map((category) => (
                      <SideNavItem
                        key={category.key}
                        href={`#components/${category.key}`}
                        active={active === `components/${category.key}`}
                        badge={
                          <Badge tone="brand">{category.names.length}</Badge>
                        }
                      >
                        {category.label}
                      </SideNavItem>
                    ))}
                  </SideNavSection>
                  <SideNavSection title="문서" className="docs-sidebar__docs">
                    {docs.map((doc) => (
                      <SideNavItem key={doc.href} href={doc.href}>
                        {doc.label}
                      </SideNavItem>
                    ))}
                  </SideNavSection>
                </SideNav>
              )}
            </Stack>
          }
        >
          <main id="main" tabIndex={-1} className="docs-main">
            {page ? (
              <PageView
                key={page.id}
                page={page}
                crumb={
                  isExample
                    ? { label: '화면 예제', href: `#${GALLERY}` }
                    : { label: '컴포넌트', href: '#components/foundation' }
                }
              />
            ) : (
              <Container>
                {active === GALLERY ? <GalleryPage /> : <HomePage />}
              </Container>
            )}
          </main>
          <footer className="docs-footer">
            <Container>
              <Text size="sm" tone="muted">
                Mega UI · 토스의 공개 디자인 패턴을 참고한 자체 구현 ·{' '}
                {componentCount}개 컴포넌트 · {examples.length}개 화면 예제
              </Text>
              <Text size="sm" tone="muted" as="span">
                <a href="./llms.txt">AI 문서 인덱스</a>
              </Text>
            </Container>
          </footer>
        </AppShell>
      </ToastProvider>
    </ThemeProvider>
  );
}

function PageView({
  page,
  crumb,
}: {
  page: (typeof routes)[number];
  crumb: { label: string; href: string };
}) {
  const [view, setView] = useState('preview');
  const Example = page.Component;
  const isCategory = page.id.startsWith('components/');
  const narrow = NARROW.includes(page.id);
  const frame = (
    <div
      className={`docs-preview${page.wide ? ' docs-preview--wide' : ''}`}
      data-width={narrow ? 'mobile' : 'desktop'}
    >
      <div className="docs-preview__bar">
        <Text size="xs" tone="muted" as="span" weight="semibold">
          미리보기 · {narrow ? '모바일 폭' : '데스크톱'}
        </Text>
        <Stack direction="row" gap={2} align="center">
          <Badge>React · TypeScript</Badge>
          {page.wide ? (
            <a className="docs-preview__full" href={`#${page.id}?full=1`}>
              전체 화면으로 보기
            </a>
          ) : null}
          <Stack direction="row" gap={1} role="group" aria-label="보기 방식">
            {(['preview', 'code'] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={view === value ? 'weak' : 'secondary'}
                aria-pressed={view === value}
                onClick={() => setView(value)}
              >
                {value === 'preview' ? '미리보기' : '코드'}
              </Button>
            ))}
          </Stack>
        </Stack>
      </div>
      <section
        hidden={view !== 'preview'}
        className="docs-preview__stage"
        aria-label={`${page.label} 미리보기`}
      >
        <Example key={page.id} />
      </section>
      {view === 'code' ? (
        <CodeBlock className="docs-source" code={page.source} language="tsx" />
      ) : null}
    </div>
  );

  return (
    <>
      <Container
        className={
          isCategory
            ? undefined
            : `docs-example-header${page.wide ? ' docs-example-header--wide' : ''}`
        }
      >
        <Stack gap={isCategory ? 5 : 4}>
          <Breadcrumb label="현재 위치">
            <BreadcrumbItem href={`#${HOME}`}>홈</BreadcrumbItem>
            <BreadcrumbItem href={crumb.href}>{crumb.label}</BreadcrumbItem>
            <BreadcrumbItem current>{page.label}</BreadcrumbItem>
          </Breadcrumb>
          <PageHeader
            title={page.title}
            description={page.description}
            actions={
              isCategory ? (
                <Badge tone="brand">전체 {page.count}개</Badge>
              ) : undefined
            }
          />
          {isCategory ? <Example key={page.id} /> : null}
        </Stack>
      </Container>
      {isCategory ? (
        <Container>
          <Accordion
            className="docs-source"
            items={[
              {
                id: 'source',
                title: '이 페이지의 소스 코드 보기 · React · TypeScript',
                content: <CodeBlock code={page.source} language="tsx" />,
              },
            ]}
          />
        </Container>
      ) : page.wide ? (
        frame
      ) : (
        <Container>{frame}</Container>
      )}
    </>
  );
}
