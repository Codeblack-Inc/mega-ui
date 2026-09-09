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

/** Hash aliases keep older links (#components, #forms) pointing at a real page. */
function resolveRoute(hash: string) {
  const id = hash.replace(/^#/, '');
  if (!id || id === HOME) return HOME;
  if (id === GALLERY) return GALLERY;
  if (id === 'components') return 'components/foundation';
  if (id === 'forms') return 'components/inputs';
  return routes.some((route) => route.id === id) ? id : null;
}

export default function App() {
  const [active, setActive] = useState(
    () => resolveRoute(location.hash) ?? HOME,
  );
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      const next = resolveRoute(location.hash);
      if (next) setActive(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [active]);

  const page = routes.find((route) => route.id === active);
  const isExample =
    active === GALLERY || examples.some((item) => item.id === active);
  const isComponent = active.startsWith('components/');

  return (
    <ThemeProvider className="docs-app" theme={dark ? 'dark' : 'light'}>
      <ToastProvider>
        <a className="skip-link" href="#main">
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
              onClick={() => setDark((value) => !value)}
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
          <main
            id="main"
            tabIndex={-1}
            className={page?.wide ? 'docs-main docs-wide' : 'docs-main'}
          >
            {page ? (
              <PageView
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
            <Text size="sm" tone="muted">
              Mega UI · 토스의 공개 디자인 패턴을 참고한 자체 구현 ·{' '}
              {componentCount}개 컴포넌트 · {examples.length}개 화면 예제
            </Text>
            <Text size="sm" tone="muted" as="span">
              <a href="./llms.txt">AI 문서 인덱스</a>
            </Text>
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
  const Frame = page.wide ? 'div' : Container;
  const Example = page.Component;
  return (
    <Frame>
      <Stack gap={5}>
        <Breadcrumb label="현재 위치">
          <BreadcrumbItem href={`#${HOME}`}>홈</BreadcrumbItem>
          <BreadcrumbItem href={crumb.href}>{crumb.label}</BreadcrumbItem>
          <BreadcrumbItem current>{page.label}</BreadcrumbItem>
        </Breadcrumb>
        <PageHeader
          title={page.title}
          description={page.description}
          actions={
            page.count ? (
              <Badge tone="brand">전체 {page.count}개</Badge>
            ) : undefined
          }
        />
        <section
          className={page.id === 'payments' ? 'docs-signin' : undefined}
          aria-label={`${page.label} 미리보기`}
        >
          <Example key={page.id} />
        </section>
        <Accordion
          className="docs-source"
          items={[
            {
              id: 'source',
              title: '예제 소스 코드 보기 · React · TypeScript',
              content: <CodeBlock code={page.source} language="tsx" />,
            },
          ]}
        />
      </Stack>
    </Frame>
  );
}
