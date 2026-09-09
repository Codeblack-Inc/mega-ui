import type { ComponentType } from 'react';
import { categories } from './catalog';
import { DashboardExample, SettingsExample, PaymentExample } from './recipes';
import { AdminExample } from './admin';
import { MarketExample } from './market';
import adminSource from './admin.tsx?raw';
import marketSource from './market.tsx?raw';
import iconsSource from './icons.tsx?raw';
import recipesSource from './recipes.tsx?raw';

/** Size of the requested component list this library set out to cover. */
export const componentCount = 150;

export interface Route {
  id: string;
  label: string;
  title: string;
  description: string;
  count?: number;
  wide: boolean;
  Component: ComponentType;
  source: string;
}

const withIcons = (source: string) =>
  `${source}\n\n// icons.tsx\n${iconsSource}`;

export const examples: Route[] = [
  {
    id: 'dashboard',
    label: '자산 홈',
    title: '내 자산을 한눈에, 금융 홈.',
    description: '카드와 리스트, 진행률로 구성한 개인 금융 화면이에요.',
    wide: false,
    Component: DashboardExample,
    source: withIcons(recipesSource),
  },
  {
    id: 'settings',
    label: '설정 화면',
    title: '나에게 딱 맞는, 서비스 설정.',
    description: '입력과 스위치를 조합해 내 정보와 알림을 관리해요.',
    wide: false,
    Component: SettingsExample,
    source: withIcons(recipesSource),
  },
  {
    id: 'payments',
    label: '결제 화면',
    title: '선택부터 완료까지, 간편한 결제.',
    description: '결제 수단 선택, 동의, 하단 버튼, 완료 피드백을 담았어요.',
    wide: false,
    Component: PaymentExample,
    source: withIcons(recipesSource),
  },
  {
    id: 'admin',
    label: '어드민 대시보드',
    title: '비즈니스의 오늘을 한눈에.',
    description: '매출부터 정산까지, 사장님을 위한 가맹점 관리 화면이에요.',
    wide: true,
    Component: AdminExample,
    source: withIcons(adminSource),
  },
  {
    id: 'market',
    label: '증권 홈',
    title: '시장의 흐름을 더 가까이.',
    description: '실시간 순위와 관심 주식으로 살펴보는 오늘의 시장이에요.',
    wide: true,
    Component: MarketExample,
    source: withIcons(marketSource),
  },
];

export const componentRoutes: Route[] = categories.map((category) => ({
  id: `components/${category.key}`,
  label: category.label,
  title: category.label,
  description: category.description,
  count: category.names.length,
  wide: false,
  Component: category.Component,
  source: withIcons(category.source),
}));

export const routes = [...componentRoutes, ...examples];

/** Markdown documents served from docs/ next to the site. */
export const docs = [
  {
    href: './getting-started.md',
    label: '시작하기',
    description: '설치, 폰트, 테마 변수, SSR',
  },
  {
    href: './components.md',
    label: '컴포넌트 API',
    description: '모든 props와 기본값',
  },
  {
    href: './component-coverage.md',
    label: `${componentCount}개 대조표`,
    description: '요청 목록과 구현 이름 매핑',
  },
  {
    href: './design-contract.md',
    label: '디자인 계약',
    description: '새 컴포넌트가 지켜야 할 규칙',
  },
  {
    href: './ai-guide.md',
    label: 'AI 가이드',
    description: 'AI가 코드를 쓸 때 참고하는 규칙',
  },
  {
    href: './roadmap.md',
    label: '로드맵',
    description: '확장 계획과 완료 기준',
  },
];
