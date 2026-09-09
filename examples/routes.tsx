import type { ComponentType } from 'react';
import { categories } from './catalog';
import { DashboardExample, SettingsExample, PaymentExample } from './recipes';
import { AdminExample } from './admin';
import { MarketExample } from './market';
import adminSource from './admin.tsx?raw';
import marketSource from './market.tsx?raw';
import iconsSource from './icons.tsx?raw';
import recipesSource from './recipes.tsx?raw';
import {
  CardBenefitsExample,
  LoanCalculatorExample,
  SpendingReportExample,
  TransferExample,
} from './screens/finance';
import financeSource from './screens/finance.tsx?raw';
import {
  LoginExample,
  NotificationCenterExample,
  ProfileExample,
  SecurityExample,
  SignupExample,
} from './screens/account';
import accountSource from './screens/account.tsx?raw';
import {
  CalendarExample,
  DriveExample,
  OrgChartExample,
  ProjectBoardExample,
  UserManagementExample,
} from './screens/work';
import workSource from './screens/work.tsx?raw';
import {
  AssistantExample,
  LandingExample,
  MobileHomeExample,
  OrderDetailExample,
  ShopExample,
  StatesExample,
} from './screens/commerce';
import commerceSource from './screens/commerce.tsx?raw';
import {
  LogExplorerExample,
  OrderOperationsExample,
  SettlementReconciliationExample,
} from './screens/operations';
import operationsSource from './screens/operations.tsx?raw';

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

export interface ExampleGroup {
  key: string;
  label: string;
  description: string;
  items: Route[];
}

const withIcons = (source: string) =>
  `${source}\n\n// icons.tsx\n${iconsSource}`;

/** Screen examples grouped by product domain; the order is the gallery order. */
export const exampleGroups: ExampleGroup[] = [
  {
    key: 'finance',
    label: '금융',
    description: '자산, 송금, 결제, 투자처럼 돈을 다루는 화면이에요.',
    items: [
      {
        id: 'dashboard',
        label: '자산 홈',
        title: '내 자산을 한눈에, 금융 홈',
        description: '카드와 리스트, 진행률로 구성한 개인 금융 화면이에요.',
        wide: false,
        Component: DashboardExample,
        source: withIcons(recipesSource),
      },
      {
        id: 'payments',
        label: '결제 화면',
        title: '선택부터 완료까지, 간편한 결제',
        description: '결제 수단 선택, 동의, 하단 버튼, 완료 피드백을 담았어요.',
        wide: false,
        Component: PaymentExample,
        source: withIcons(recipesSource),
      },
      {
        id: 'transfer',
        label: '송금하기',
        title: '받는 사람부터 확인까지, 3단계 송금',
        description:
          '연락처 선택, 금액 입력, 확인과 완료까지 이어지는 송금 흐름이에요.',
        wide: false,
        Component: TransferExample,
        source: withIcons(financeSource),
      },
      {
        id: 'loan',
        label: '대출 계산기',
        title: '조건을 바꾸면 바로 보이는 월 상환금',
        description:
          '슬라이더와 상환 방식으로 이자와 상환 일정을 실시간 계산해요.',
        wide: false,
        Component: LoanCalculatorExample,
        source: withIcons(financeSource),
      },
      {
        id: 'spending',
        label: '소비 리포트',
        title: '어디에 얼마나 썼는지, 한눈에',
        description:
          '카테고리 막대, 요일별 차트, 자주 간 곳으로 소비 패턴을 살펴봐요.',
        wide: false,
        Component: SpendingReportExample,
        source: withIcons(financeSource),
      },
      {
        id: 'card',
        label: '카드 관리',
        title: '내 카드의 혜택과 설정을 한곳에',
        description:
          '카드 이미지, 혜택·이용내역·설정 탭, 분실 신고 다이얼로그를 담았어요.',
        wide: false,
        Component: CardBenefitsExample,
        source: withIcons(financeSource),
      },
      {
        id: 'market',
        label: '증권 홈',
        title: '시장의 흐름을 더 가까이',
        description: '실시간 순위와 관심 주식으로 살펴보는 오늘의 시장이에요.',
        wide: true,
        Component: MarketExample,
        source: withIcons(marketSource),
      },
    ],
  },
  {
    key: 'account',
    label: '계정',
    description: '로그인부터 알림, 보안까지 사용자 계정을 관리하는 화면이에요.',
    items: [
      {
        id: 'login',
        label: '로그인',
        title: '다시 만나서 반가워요, 로그인',
        description:
          '이메일·비밀번호 입력, 오류 안내, 로딩 상태와 간편 로그인을 담았어요.',
        wide: false,
        Component: LoginExample,
        source: withIcons(accountSource),
      },
      {
        id: 'signup',
        label: '회원가입',
        title: '약관부터 인증까지, 4단계 가입',
        description:
          '전체 동의, 입력 마스크, 인증번호 카운트다운으로 이어지는 가입 플로우예요.',
        wide: false,
        Component: SignupExample,
        source: withIcons(accountSource),
      },
      {
        id: 'profile',
        label: '마이페이지',
        title: '내 정보와 혜택을 한곳에서',
        description:
          '프로필, 포인트·쿠폰 통계, 최근 주문과 계정 메뉴를 모았어요.',
        wide: false,
        Component: ProfileExample,
        source: withIcons(accountSource),
      },
      {
        id: 'settings',
        label: '설정 화면',
        title: '나에게 딱 맞는, 서비스 설정',
        description: '입력과 스위치를 조합해 내 정보와 알림을 관리해요.',
        wide: false,
        Component: SettingsExample,
        source: withIcons(recipesSource),
      },
      {
        id: 'notifications',
        label: '알림센터',
        title: '놓친 소식 없이, 알림센터',
        description:
          '분류 탭과 읽음 처리, 빈 상태와 수신 설정까지 갖춘 알림 목록이에요.',
        wide: false,
        Component: NotificationCenterExample,
        source: withIcons(accountSource),
      },
      {
        id: 'security',
        label: '보안·기기',
        title: '내 계정을 더 안전하게',
        description:
          '2단계 인증 QR, 로그인 기기 관리, 비밀번호 안전도와 보안 활동 기록이에요.',
        wide: false,
        Component: SecurityExample,
        source: withIcons(accountSource),
      },
    ],
  },
  {
    key: 'work',
    label: '업무',
    description: '어드민, 데이터 관리, 일정처럼 팀이 매일 쓰는 화면이에요.',
    items: [
      {
        id: 'admin',
        label: '어드민 대시보드',
        title: '비즈니스의 오늘을 한눈에',
        description: '매출부터 정산까지, 사장님을 위한 가맹점 관리 화면이에요.',
        wide: true,
        Component: AdminExample,
        source: withIcons(adminSource),
      },
      {
        id: 'users',
        label: '사용자 관리',
        title: '팀원을 한곳에서, 사용자 관리',
        description:
          '검색·필터·선택과 초대, 상세 드로어까지 담은 관리자용 사용자 목록이에요.',
        wide: true,
        Component: UserManagementExample,
        source: withIcons(workSource),
      },
      {
        id: 'order-operations',
        label: '주문 운영 관제',
        title: '18,426건을 놓치지 않는 주문 운영',
        description:
          '저장된 보기, 복합 검색, 대량 선택, SLA와 주문 상세를 갖춘 실무형 운영 화면이에요.',
        wide: true,
        Component: OrderOperationsExample,
        source: withIcons(operationsSource),
      },
      {
        id: 'settlement-reconciliation',
        label: '정산 대사',
        title: '입금 차액의 원인까지 찾는 정산 대사',
        description:
          '여러 판매처의 주문 원장과 입금 내역을 비교하고 예외를 일괄 처리해요.',
        wide: true,
        Component: SettlementReconciliationExample,
        source: withIcons(operationsSource),
      },
      {
        id: 'log-explorer',
        label: '로그 탐색기',
        title: '초당 12,800건을 다루는 로그 탐색기',
        description:
          '실시간 상태, 레벨·서비스 필터, 이벤트 차트와 가상화 로그 목록을 담았어요.',
        wide: true,
        Component: LogExplorerExample,
        source: withIcons(operationsSource),
      },
      {
        id: 'board',
        label: '프로젝트 보드',
        title: '보드·목록·타임라인, 하나의 프로젝트',
        description:
          '칸반으로 옮기고, 표로 정렬하고, 간트로 일정을 살펴보는 협업 화면이에요.',
        wide: true,
        Component: ProjectBoardExample,
        source: withIcons(workSource),
      },
      {
        id: 'calendar',
        label: '일정 관리',
        title: '이번 달 일정을 한눈에',
        description:
          '달력과 주간 스케줄러를 오가며 일정을 보고 추가하는 화면이에요.',
        wide: true,
        Component: CalendarExample,
        source: withIcons(workSource),
      },
      {
        id: 'org',
        label: '조직도·인사',
        title: '우리 팀은 이렇게 생겼어요',
        description:
          '조직도와 부서 트리로 구성원 명단을 살펴보는 인사 화면이에요.',
        wide: true,
        Component: OrgChartExample,
        source: withIcons(workSource),
      },
      {
        id: 'drive',
        label: '파일 드라이브',
        title: '파일은 드라이브에 차곡차곡',
        description:
          '업로드, 목록·격자 보기, 정렬과 상세 드로어를 갖춘 파일 관리 화면이에요.',
        wide: true,
        Component: DriveExample,
        source: withIcons(workSource),
      },
    ],
  },
  {
    key: 'commerce',
    label: '커머스',
    description: '상품 탐색부터 주문 조회, 서비스 소개 페이지까지 담았어요.',
    items: [
      {
        id: 'shop',
        label: '상품 목록',
        title: '취향에 맞는 상품을 더 빠르게',
        description: '필터와 정렬, 찜과 장바구니를 담은 쇼핑 목록 화면이에요.',
        wide: true,
        Component: ShopExample,
        source: withIcons(commerceSource),
      },
      {
        id: 'order',
        label: '주문 상세',
        title: '내 주문이 어디쯤 왔는지 한눈에',
        description:
          '진행 단계, 배송 현황, 결제 정보와 배송지 변경을 담았어요.',
        wide: false,
        Component: OrderDetailExample,
        source: withIcons(commerceSource),
      },
      {
        id: 'landing',
        label: '랜딩 페이지',
        title: '첫인상부터 요금까지, 한 페이지에',
        description:
          '히어로, 기능 소개, 후기, 요금제, FAQ로 구성한 마케팅 화면이에요.',
        wide: true,
        Component: LandingExample,
        source: withIcons(commerceSource),
      },
    ],
  },
  {
    key: 'ai',
    label: 'AI·모바일·상태',
    description: 'AI 대화, 모바일 앱 홈, 오류와 빈 화면 같은 특수 화면이에요.',
    items: [
      {
        id: 'assistant',
        label: 'AI 어시스턴트',
        title: '물어보면 바로 답하는 금융 비서',
        description:
          '대화 목록, 스트리밍 답변, 작업 상태를 보여주는 AI 채팅 화면이에요.',
        wide: true,
        Component: AssistantExample,
        source: withIcons(commerceSource),
      },
      {
        id: 'mobile',
        label: '모바일 홈',
        title: '손안에서 시작하는 하루',
        description:
          '폰 프레임 안에서 하단 탭으로 홈·혜택·송금·증권을 오가는 앱 홈이에요.',
        wide: false,
        Component: MobileHomeExample,
        source: withIcons(commerceSource),
      },
      {
        id: 'states',
        label: '상태 화면',
        title: '비어 있어도, 막혀도 친절하게',
        description:
          '404, 서버 오류, 빈 검색, 점검, 로딩, 둘러보기 등 상태 화면 모음이에요.',
        wide: false,
        Component: StatesExample,
        source: withIcons(commerceSource),
      },
    ],
  },
];

export const examples: Route[] = exampleGroups.flatMap((group) => group.items);

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
