import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Container,
  PageHeader,
  Stack,
  Text,
} from '@mega-ui/react';
import { CatalogExample } from './catalog';
import { DashboardExample, SettingsExample, PaymentExample } from './recipes';
import catalogSource from './catalog.tsx?raw';
import recipesSource from './recipes.tsx?raw';
import '../src/styles/index.scss';
import './site.scss';

const pages = [
  {
    id: 'components',
    label: '컴포넌트',
    eyebrow: 'MEGA UI · TOSS-INSPIRED',
    title: '익숙해서 쉽고, 단순해서 편안하게.',
    description:
      '토스의 디자인 언어에서 출발한 컴포넌트. 우리 서비스에 맞게 조합해 보세요.',
    component: CatalogExample,
  },
  {
    id: 'dashboard',
    label: '자산 홈',
    eyebrow: 'EXAMPLE / 01',
    title: '내 자산을 한눈에, 금융 홈.',
    description: '카드와 리스트, 진행률로 구성한 개인 금융 화면이에요.',
    component: DashboardExample,
  },
  {
    id: 'settings',
    label: '설정 화면',
    eyebrow: 'EXAMPLE / 02',
    title: '나에게 딱 맞는, 서비스 설정.',
    description: '입력과 스위치를 조합해 내 정보와 알림을 관리해요.',
    component: SettingsExample,
  },
  {
    id: 'payments',
    label: '결제 화면',
    eyebrow: 'EXAMPLE / 03',
    title: '선택부터 완료까지, 간편한 결제.',
    description:
      '결제 수단 선택, 동의, 하단 버튼, 완료 피드백을 체험해 보세요.',
    component: PaymentExample,
  },
] as const;

export default function App() {
  const [active, setActive] = useState(
    () =>
      pages.find((page) => page.id === location.hash.slice(1))?.id ??
      'components',
  );
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const onHashChange = () => {
      const next = pages.find((item) => item.id === location.hash.slice(1));
      if (next) setActive(next.id);
      else if (!location.hash) setActive('components');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const page = pages.find((item) => item.id === active) ?? pages[0];
  const Example = page.component;

  return (
    <div className="docs-app" data-mega-theme={dark ? 'dark' : 'light'}>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <aside className="docs-sidebar">
        <a
          className="docs-logo"
          href="#components"
          onClick={() => setActive('components')}
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
        <nav aria-label="문서 탐색">
          <p className="docs-nav-label">라이브러리</p>
          {pages.slice(0, 1).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? 'page' : undefined}
              onClick={() => setActive(item.id)}
            >
              <span>▦</span>
              {item.label}
              <span className="docs-count">22</span>
            </a>
          ))}
          <p className="docs-nav-label">화면 예제</p>
          {pages.slice(1).map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? 'page' : undefined}
              onClick={() => setActive(item.id)}
            >
              <span className="docs-nav-number">0{index + 1}</span>
              {item.label}
            </a>
          ))}
          <p className="docs-nav-label">리소스</p>
          <a href="./getting-started.md" target="_blank" rel="noreferrer">
            시작하기 <span>↗</span>
          </a>
          <a href="./components.md" target="_blank" rel="noreferrer">
            컴포넌트 API <span>↗</span>
          </a>
          <a href="./ai-guide.md" target="_blank" rel="noreferrer">
            AI 가이드 <span>↗</span>
          </a>
          <a href="./roadmap.md" target="_blank" rel="noreferrer">
            로드맵 <span>↗</span>
          </a>
        </nav>
        <div className="docs-sidebar__footer">
          <span className="docs-status-dot" />
          <Text size="sm" tone="muted">
            React + SCSS · 22 components
          </Text>
        </div>
      </aside>
      <div className="docs-body">
        <header className="docs-topbar">
          <span>
            Design system <span className="docs-slash">/</span>{' '}
            <strong>{page.label}</strong>
          </span>
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={dark}
            onClick={() => setDark((value) => !value)}
          >
            {dark ? '라이트 모드' : '다크 모드'}
          </Button>
        </header>
        <main id="main" tabIndex={-1}>
          <Container>
            <Stack gap={6}>
              <section className="docs-hero">
                <Stack gap={4}>
                  <Text size="sm" tone="muted">
                    {page.eyebrow}
                  </Text>
                  <PageHeader
                    title={page.title}
                    description={page.description}
                  />
                  <Stack direction="row" gap={2} wrap>
                    <Badge>22개 컴포넌트</Badge>
                    <Badge>3개 서비스 예제</Badge>
                    <Badge tone="brand">Light & Dark</Badge>
                  </Stack>
                </Stack>
              </section>
              <section
                className={active === 'payments' ? 'docs-signin' : undefined}
                aria-label={`${page.label} 미리보기`}
              >
                <Example key={active} />
              </section>
              <details className="docs-source">
                <summary>예제 소스 코드 보기</summary>
                <pre>
                  <code>
                    {active === 'components' ? catalogSource : recipesSource}
                  </code>
                </pre>
              </details>
              <footer className="docs-footer">
                <Text size="sm" tone="muted">
                  Mega UI · 토스의 공개 디자인 패턴을 참고한 자체 구현
                </Text>
                <a href="./llms.txt">AI 문서 인덱스 ↗</a>
              </footer>
            </Stack>
          </Container>
        </main>
      </div>
    </div>
  );
}
