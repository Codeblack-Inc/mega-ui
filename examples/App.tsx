import { useEffect, useState, type ComponentType } from 'react';
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Container,
  Heading,
  SideNav,
  SideNavSection,
  SideNavItem,
  Stack,
  Text,
  ToastProvider,
  ThemeProvider,
} from '@mega-ui/react';
import { categories } from './catalog';
import { DashboardExample, SettingsExample, PaymentExample } from './recipes';
import { AdminExample } from './admin';
import { MarketExample } from './market';
import { ExampleIcon } from './icons';
import adminSource from './admin.tsx?raw';
import marketSource from './market.tsx?raw';
import iconsSource from './icons.tsx?raw';
import recipesSource from './recipes.tsx?raw';
import '../src/styles/index.scss';
import './site.scss';

const componentCount = 150;

interface Route {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  crumb: string;
  count?: number;
  wide: boolean;
  Component: ComponentType;
  source: string;
}

const examples: Route[] = [
  {
    id: 'dashboard',
    label: '자산 홈',
    eyebrow: 'EXAMPLE / 01',
    title: '내 자산을 한눈에, 금융 홈.',
    description: '카드와 리스트, 진행률로 구성한 개인 금융 화면이에요.',
    crumb: '화면 예제',
    wide: false,
    Component: DashboardExample,
    source: `${recipesSource}\n\n// icons.tsx\n${iconsSource}`,
  },
  {
    id: 'settings',
    label: '설정 화면',
    eyebrow: 'EXAMPLE / 02',
    title: '나에게 딱 맞는, 서비스 설정.',
    description: '입력과 스위치를 조합해 내 정보와 알림을 관리해요.',
    crumb: '화면 예제',
    wide: false,
    Component: SettingsExample,
    source: `${recipesSource}\n\n// icons.tsx\n${iconsSource}`,
  },
  {
    id: 'payments',
    label: '결제 화면',
    eyebrow: 'EXAMPLE / 03',
    title: '선택부터 완료까지, 간편한 결제.',
    description: '결제 수단 선택, 동의, 하단 버튼, 완료 피드백을 담았어요.',
    crumb: '화면 예제',
    wide: false,
    Component: PaymentExample,
    source: `${recipesSource}\n\n// icons.tsx\n${iconsSource}`,
  },
  {
    id: 'admin',
    label: '어드민 대시보드',
    eyebrow: 'EXAMPLE / 04',
    title: '비즈니스의 오늘을 한눈에.',
    description: '매출부터 정산까지, 사장님을 위한 가맹점 관리 화면이에요.',
    crumb: '화면 예제',
    wide: true,
    Component: AdminExample,
    source: `${adminSource}\n\n// icons.tsx\n${iconsSource}`,
  },
  {
    id: 'market',
    label: '증권 홈',
    eyebrow: 'EXAMPLE / 05',
    title: '시장의 흐름을 더 가까이.',
    description: '실시간 순위와 관심 주식으로 살펴보는 오늘의 시장이에요.',
    crumb: '화면 예제',
    wide: true,
    Component: MarketExample,
    source: `${marketSource}\n\n// icons.tsx\n${iconsSource}`,
  },
];

const routes: Route[] = [
  ...categories.map((category) => ({
    id: `components/${category.key}`,
    label: category.label,
    eyebrow: `COMPONENTS / ${category.key.toUpperCase()}`,
    title: category.label,
    description: category.description,
    crumb: '컴포넌트',
    count: category.names.length,
    wide: false,
    Component: category.Component,
    source: `${category.source}\n\n// icons.tsx\n${iconsSource}`,
  })),
  ...examples,
];

const homeRoute = routes.find((route) => route.id === 'components/foundation')!;

/** Hash aliases keep older links (#components, #forms) pointing at a real page. */
function resolveRoute(hash: string) {
  const id = hash.replace(/^#/, '');
  if (!id || id === 'components') return homeRoute.id;
  if (id === 'forms') return 'components/inputs';
  return routes.some((route) => route.id === id) ? id : null;
}

const externalLinkIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M14 4h6v6M20 4 10 14M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </svg>
);

export default function App() {
  const [active, setActive] = useState(
    () => resolveRoute(location.hash) ?? homeRoute.id,
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

  const page = routes.find((route) => route.id === active) ?? homeRoute;
  const Example = page.Component;
  const PageFrame = page.wide ? 'div' : Container;

  return (
    <ThemeProvider className="docs-app" theme={dark ? 'dark' : 'light'}>
      <ToastProvider>
        <a className="skip-link" href="#main">
          본문으로 건너뛰기
        </a>
        <aside className="docs-sidebar">
          <a
            className="docs-logo"
            href={`#${homeRoute.id}`}
            onClick={() => setActive(homeRoute.id)}
          >
            <span className="docs-logo__mark">m</span>mega
            <span className="docs-logo__suffix">ui</span>
          </a>
          <div className="docs-sidebar__intro">
            <Badge tone="brand">v0.1.0 · Toss-inspired</Badge>
            <Text size="sm" tone="muted">
              좋은 경험을 만드는 공통의 언어
            </Text>
          </div>
          <SideNav label="문서 탐색">
            <SideNavSection title="컴포넌트">
              {categories.map((category) => (
                <SideNavItem
                  key={category.key}
                  href={`#components/${category.key}`}
                  active={active === `components/${category.key}`}
                  icon={<ExampleIcon />}
                  badge={<Badge tone="brand">{category.names.length}</Badge>}
                  onClick={() => setActive(`components/${category.key}`)}
                >
                  {category.label}
                </SideNavItem>
              ))}
            </SideNavSection>
            <SideNavSection title="화면 예제">
              {examples.map((item, index) => (
                <SideNavItem
                  key={item.id}
                  href={`#${item.id}`}
                  active={active === item.id}
                  icon={<span className="docs-nav-number">0{index + 1}</span>}
                  onClick={() => setActive(item.id)}
                >
                  {item.label}
                </SideNavItem>
              ))}
            </SideNavSection>
            <SideNavSection title="리소스">
              <SideNavItem
                href="./component-coverage.md"
                icon={externalLinkIcon}
              >
                150개 대조표
              </SideNavItem>
              <SideNavItem href="./getting-started.md" icon={externalLinkIcon}>
                시작하기
              </SideNavItem>
              <SideNavItem href="./components.md" icon={externalLinkIcon}>
                컴포넌트 API
              </SideNavItem>
              <SideNavItem href="./ai-guide.md" icon={externalLinkIcon}>
                AI 가이드
              </SideNavItem>
              <SideNavItem href="./roadmap.md" icon={externalLinkIcon}>
                로드맵
              </SideNavItem>
            </SideNavSection>
          </SideNav>
          <div className="docs-sidebar__footer">
            <span className="docs-status-dot" />
            <Text size="sm" tone="muted">
              {componentCount}개 컴포넌트 · {examples.length}개 화면 예제
            </Text>
          </div>
        </aside>
        <div className="docs-body">
          <header className="docs-topbar">
            <Breadcrumb label="현재 위치" className="docs-crumb">
              <BreadcrumbItem>Design system</BreadcrumbItem>
              <BreadcrumbItem>{page.crumb}</BreadcrumbItem>
              <BreadcrumbItem current>{page.label}</BreadcrumbItem>
            </Breadcrumb>
            <Button
              variant="secondary"
              size="sm"
              aria-pressed={dark}
              onClick={() => setDark((value) => !value)}
            >
              {dark ? '라이트 모드' : '다크 모드'}
            </Button>
          </header>
          <main
            id="main"
            tabIndex={-1}
            className={page.wide ? 'docs-wide' : undefined}
          >
            <PageFrame>
              <Stack gap={5}>
                <div className="docs-hero">
                  <p className="docs-hero__eyebrow">{page.eyebrow}</p>
                  <Heading level={1} size="xl">
                    {page.title}
                  </Heading>
                  <p className="docs-hero__description">
                    {page.description}
                    {page.count ? (
                      <span className="docs-hero__count">
                        전체 {page.count}개
                      </span>
                    ) : null}
                  </p>
                </div>
                <section
                  className={active === 'payments' ? 'docs-signin' : undefined}
                  aria-label={`${page.label} 미리보기`}
                >
                  <Example key={active} />
                </section>
                <details className="docs-source">
                  <summary>
                    <span className="docs-source__title">
                      예제 소스 코드 보기
                    </span>
                    <span className="docs-source__meta">
                      React · TypeScript
                    </span>
                  </summary>
                  <pre>
                    <code>{page.source}</code>
                  </pre>
                </details>
                <footer className="docs-footer">
                  <Text size="sm" tone="muted">
                    Mega UI · 토스의 공개 디자인 패턴을 참고한 자체 구현
                  </Text>
                  <a href="./llms.txt">AI 문서 인덱스 {externalLinkIcon}</a>
                </footer>
              </Stack>
            </PageFrame>
          </main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
