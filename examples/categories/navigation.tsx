import { useState, type ReactNode } from 'react';
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  NavRail,
  NavRailItem,
  PageHeader,
  Pagination,
  SideNav,
  SideNavItem,
  SideNavSection,
  Stack,
  TabPanel,
  Tabs,
  Text,
  TopBar,
  TopBarLink,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';
import { CategoryCards } from './shell';

export const navigationNames = [
  'Tabs',
  'SideNav',
  'NavRail',
  'TopBar',
  'Breadcrumb',
  'Pagination',
  'PageHeader',
] as const;

export function NavigationCategory() {
  const [tab, setTab] = useState('all');
  const [pill, setPill] = useState('chart');
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState('home');
  const [rail, setRail] = useState('home');

  const demos: Record<(typeof navigationNames)[number], ReactNode> = {
    Tabs: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          밑줄 탭과 알약 탭으로 화면 안의 흐름을 나눠요.
        </Text>
        <Tabs
          label="내역 종류"
          variant="underline"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'all', label: '전체' },
            { value: 'payments', label: '결제' },
            { value: 'settlement', label: '정산' },
          ]}
        />
        <TabPanel active aria-label="선택한 내역">
          <Text size="sm">
            {tab === 'all'
              ? '모든 내역을 확인해요.'
              : tab === 'payments'
                ? '결제 내역을 확인해요.'
                : '정산 내역을 확인해요.'}
          </Text>
        </TabPanel>
        <Tabs
          label="주식 정보"
          variant="pill"
          value={pill}
          onValueChange={setPill}
          items={[
            { value: 'chart', label: '차트' },
            { value: 'order', label: '호가' },
          ]}
        />
        <TabPanel active aria-label="선택한 주식 정보">
          <Text size="sm" tone="muted">
            {pill === 'chart'
              ? '가격의 흐름을 확인하는 차트 화면이에요.'
              : '구매와 판매 가격을 확인하는 호가 화면이에요.'}
          </Text>
        </TabPanel>
      </Stack>
    ),
    SideNav: (
      <div className="demo-frame">
        <SideNav label="예제 사이드 내비게이션">
          <SideNavSection title="자산">
            <SideNavItem
              icon={<ExampleIcon name="home" />}
              active={menu === 'home'}
              onClick={() => setMenu('home')}
            >
              홈
            </SideNavItem>
            <SideNavItem
              icon={<ExampleIcon name="card" />}
              badge={<Badge tone="brand">3</Badge>}
              active={menu === 'card'}
              onClick={() => setMenu('card')}
            >
              카드
            </SideNavItem>
          </SideNavSection>
          <SideNavSection title="관리">
            <SideNavItem
              icon={<ExampleIcon name="settings" />}
              active={menu === 'settings'}
              onClick={() => setMenu('settings')}
            >
              설정
            </SideNavItem>
          </SideNavSection>
        </SideNav>
      </div>
    ),
    NavRail: (
      <div className="demo-frame demo-frame--center">
        <NavRail label="예제 내비게이션 레일">
          {(
            [
              { key: 'home', icon: 'home', label: '홈' },
              { key: 'chart', icon: 'chart', label: '리포트' },
              { key: 'bag', icon: 'bag', label: '상점' },
            ] as const
          ).map((item) => (
            <NavRailItem
              key={item.key}
              icon={<ExampleIcon name={item.icon} />}
              label={item.label}
              active={rail === item.key}
              onClick={() => setRail(item.key)}
            />
          ))}
        </NavRail>
      </div>
    ),
    TopBar: (
      <div className="demo-scroll">
        <TopBar
          brand={<strong>mega</strong>}
          navLabel="예제 상단 메뉴"
          actions={<Button size="sm">로그인</Button>}
        >
          <TopBarLink href="#TopBar" active>
            홈
          </TopBarLink>
          <TopBarLink href="#TopBar">투자</TopBarLink>
          <TopBarLink href="#TopBar">혜택</TopBarLink>
        </TopBar>
      </div>
    ),
    Breadcrumb: (
      <Breadcrumb>
        <BreadcrumbItem href="#components/foundation">컴포넌트</BreadcrumbItem>
        <BreadcrumbItem href="#components/navigation">
          내비게이션
        </BreadcrumbItem>
        <BreadcrumbItem current>Breadcrumb</BreadcrumbItem>
      </Breadcrumb>
    ),
    Pagination: (
      <Stack gap={3}>
        <Pagination page={page} pageCount={5} onPageChange={setPage} />
        <Text size="sm" tone="muted">
          {page}페이지를 보고 있어요
        </Text>
      </Stack>
    ),
    PageHeader: (
      <PageHeader
        title="결제 내역"
        headingLevel={3}
        description="오늘 들어온 주문을 확인해요"
        actions={
          <Button size="sm" variant="secondary">
            내보내기
          </Button>
        }
      />
    ),
  };
  return (
    <CategoryCards code="NAVIGATION" order={navigationNames} demos={demos} />
  );
}
