import { useState, type ReactNode } from 'react';
import {
  AlertDialog,
  Anchor,
  BackToTop,
  BottomNavigation,
  Button,
  CircularProgress,
  CommandPalette,
  ContextMenu,
  Drawer,
  DropdownMenu,
  ErrorState,
  HoverCard,
  MegaMenu,
  MenuItem,
  Message,
  Modal,
  NavigationMenu,
  Notification,
  Popover,
  Progress,
  Sheet,
  Sidebar,
  Spinner,
  Stack,
  Stepper,
  Toast,
  Tour,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';
import { CategoryCards } from './shell';

export const extendedNavigationNames = [
  'Anchor',
  'Stepper',
  'DropdownMenu',
  'ContextMenu',
  'NavigationMenu',
  'MegaMenu',
  'Sidebar',
  'BottomNavigation',
  'CommandPalette',
  'BackToTop',
  'Popover',
  'HoverCard',
  'Modal',
  'AlertDialog',
  'Drawer',
  'Sheet',
  'Tour',
  'Message',
  'Toast',
  'Notification',
  'Progress',
  'CircularProgress',
  'Spinner',
  'ErrorState',
] as const;

export function ExtendedNavigationCategory() {
  const [step, setStep] = useState(1);
  const [bottom, setBottom] = useState('home');
  const [open, setOpen] = useState('');
  const [tour, setTour] = useState(0);
  const demos: Record<(typeof extendedNavigationNames)[number], ReactNode> = {
    Anchor: <Anchor href="#Anchor">도움말 문서 열기</Anchor>,
    Stepper: (
      <Stepper
        current={step}
        onStepChange={setStep}
        items={[{ label: '정보 입력' }, { label: '검토' }, { label: '완료' }]}
      />
    ),
    DropdownMenu: (
      <DropdownMenu trigger={<Button variant="outline">작업</Button>}>
        <MenuItem>복사하기</MenuItem>
        <MenuItem>이동하기</MenuItem>
      </DropdownMenu>
    ),
    ContextMenu: (
      <ContextMenu
        trigger={<Button variant="outline">오른쪽 버튼을 눌러 보세요</Button>}
      >
        <MenuItem>이름 바꾸기</MenuItem>
        <MenuItem tone="danger">삭제하기</MenuItem>
      </ContextMenu>
    ),
    NavigationMenu: (
      <NavigationMenu label="예제 메뉴">
        <Anchor href="#NavigationMenu">서비스</Anchor>
        <Anchor href="#NavigationMenu">요금</Anchor>
      </NavigationMenu>
    ),
    MegaMenu: (
      <MegaMenu label="제품 메뉴">
        <Stack gap={1}>
          <strong>결제</strong>
          <Anchor href="#MegaMenu">결제 관리</Anchor>
        </Stack>
        <Stack gap={1}>
          <strong>분석</strong>
          <Anchor href="#MegaMenu">리포트</Anchor>
        </Stack>
      </MegaMenu>
    ),
    Sidebar: (
      <div className="demo-frame">
        <Sidebar label="예제 사이드바">
          <Button variant="ghost">홈</Button>
          <Button variant="ghost">설정</Button>
        </Sidebar>
      </div>
    ),
    BottomNavigation: (
      <BottomNavigation
        label="모바일 메뉴"
        value={bottom}
        onValueChange={setBottom}
        items={[
          { value: 'home', label: '홈', icon: <ExampleIcon name="home" /> },
          { value: 'chart', label: '분석', icon: <ExampleIcon name="chart" /> },
          {
            value: 'settings',
            label: '설정',
            icon: <ExampleIcon name="settings" />,
          },
        ]}
      />
    ),
    CommandPalette: (
      <>
        <Button onClick={() => setOpen('command')}>명령 팔레트 열기</Button>
        <CommandPalette
          open={open === 'command'}
          onClose={() => setOpen('')}
          commands={[
            {
              id: 'new',
              label: '새 문서 만들기',
              shortcut: '⌘ N',
              onSelect: () => setOpen(''),
            },
            {
              id: 'search',
              label: '문서 검색',
              shortcut: '⌘ K',
              onSelect: () => setOpen(''),
            },
          ]}
        />
      </>
    ),
    BackToTop: <BackToTop />,
    Popover: (
      <Popover
        label="정산 안내"
        trigger={<Button variant="outline">정산 안내</Button>}
      >
        영업일 기준 2일 뒤에 정산돼요.
      </Popover>
    ),
    HoverCard: (
      <HoverCard trigger={<Anchor href="#HoverCard">판매자 정보</Anchor>}>
        <strong>메가 상점</strong>
        <br />
        평균 응답 시간 1시간
      </HoverCard>
    ),
    Modal: (
      <>
        <Button onClick={() => setOpen('modal')}>모달 열기</Button>
        <Modal
          open={open === 'modal'}
          onClose={() => setOpen('')}
          title="변경 사항을 저장할까요?"
          actions={<Button onClick={() => setOpen('')}>저장하기</Button>}
        >
          다음 화면으로 이동하기 전에 저장해요.
        </Modal>
      </>
    ),
    AlertDialog: (
      <>
        <Button variant="danger" onClick={() => setOpen('alert')}>
          삭제 확인
        </Button>
        <AlertDialog
          open={open === 'alert'}
          onClose={() => setOpen('')}
          title="문서를 삭제할까요?"
          actions={<Button onClick={() => setOpen('')}>확인했어요</Button>}
        >
          삭제한 문서는 복구할 수 없어요.
        </AlertDialog>
      </>
    ),
    Drawer: (
      <>
        <Button onClick={() => setOpen('drawer')}>서랍 열기</Button>
        <Drawer
          open={open === 'drawer'}
          onClose={() => setOpen('')}
          title="필터"
          actions={<Button onClick={() => setOpen('')}>적용하기</Button>}
        >
          결과를 좁힐 조건을 고르세요.
        </Drawer>
      </>
    ),
    Sheet: (
      <>
        <Button onClick={() => setOpen('sheet')}>시트 열기</Button>
        <Sheet
          open={open === 'sheet'}
          onClose={() => setOpen('')}
          title="공유하기"
        >
          공유할 채널을 선택하세요.
        </Sheet>
      </>
    ),
    Tour: (
      <>
        <Button
          onClick={() => {
            setTour(0);
            setOpen('tour');
          }}
        >
          둘러보기 시작
        </Button>
        <Tour
          open={open === 'tour'}
          onClose={() => setOpen('')}
          current={tour}
          onStepChange={setTour}
          steps={[
            {
              title: '첫 번째 단계',
              description: '중요한 정보를 먼저 확인해요.',
            },
            {
              title: '두 번째 단계',
              description: '필요한 작업을 이어서 해요.',
            },
          ]}
        />
      </>
    ),
    Message: (
      <Stack gap={2}>
        <Message
          title="새 업데이트가 있어요"
          description="화면을 새로고침하면 적용돼요."
        />
        <Message tone="success" title="저장했어요" />
      </Stack>
    ),
    Toast: (
      <Toast
        title="변경 사항을 저장했어요"
        description="정적 표시 예시예요."
        tone="success"
      />
    ),
    Notification: (
      <Notification
        title="결제 승인 대기 중"
        description="추가 인증이 필요할 수 있어요."
        action={
          <Button size="sm" variant="text">
            확인
          </Button>
        }
      />
    ),
    Progress: <Progress label="파일 업로드" value={65} />,
    CircularProgress: (
      <Stack direction="row" gap={3} align="center">
        <CircularProgress label="65% 진행" value={65} />
        <CircularProgress label="불러오는 중" />
      </Stack>
    ),
    Spinner: <Spinner />,
    ErrorState: (
      <ErrorState
        title="불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        actions={<Button variant="weak">다시 시도</Button>}
      />
    ),
  };
  return (
    <CategoryCards
      code="EXTENDED"
      order={extendedNavigationNames}
      demos={demos}
    />
  );
}
