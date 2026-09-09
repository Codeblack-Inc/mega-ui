import { useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Heading,
  ListRow,
  ProgressBar,
  Result,
  Separator,
  Skeleton,
  Stack,
  Text,
  useToast,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';
import { CategoryCards } from './shell';

export const surfaceNames = [
  'Card',
  'Badge',
  'Alert',
  'Banner',
  'Separator',
  'Toast',
  'Skeleton',
  'EmptyState',
  'ProgressBar',
  'Result',
] as const;

export function SurfacesCategory() {
  const toast = useToast();
  const [banner, setBanner] = useState(true);

  const demos: Record<(typeof surfaceNames)[number], ReactNode> = {
    Card: (
      <Stack gap={4}>
        <Card variant="filled">
          <Stack gap={3}>
            <Heading size="lg">중요한 내용부터, 차근차근</Heading>
            <Text>
              넉넉한 여백과 읽기 편한 글자 크기로 정보의 순서를 만들어요.
            </Text>
            <Text size="sm" tone="muted">
              variant=&quot;filled&quot;
            </Text>
          </Stack>
        </Card>
        <Card variant="outlined">
          <Stack gap={3}>
            <Heading size="sm">필요할 때만 경계를 더해요</Heading>
            <Text tone="muted">
              elevated, filled, outlined로 화면의 깊이를 조절해요.
            </Text>
            <Text size="sm" tone="muted">
              variant=&quot;outlined&quot;
            </Text>
          </Stack>
        </Card>
        <Card padding="sm">
          <Text size="sm" tone="muted">
            padding=&quot;sm&quot; · 기본 elevated
          </Text>
        </Card>
      </Stack>
    ),
    Badge: (
      <Stack gap={3}>
        <Stack direction="row" gap={2} wrap>
          <Badge>기본</Badge>
          <Badge tone="brand">새 소식</Badge>
          <Badge tone="success">완료</Badge>
          <Badge tone="warning">확인 필요</Badge>
          <Badge tone="danger">실패</Badge>
        </Stack>
        {(['weak', 'solid', 'dot'] as const).map((variant) => (
          <Stack direction="row" gap={2} wrap key={variant}>
            <Badge tone="brand" variant={variant}>
              {variant === 'dot' ? 'N' : '새 소식'}
            </Badge>
            <Badge tone="teal" variant={variant}>
              {variant === 'dot' ? 'N' : '정산 완료'}
            </Badge>
            <Badge tone="purple" variant={variant}>
              {variant === 'dot' ? 'N' : '프리미엄'}
            </Badge>
            <Badge tone="danger" variant={variant}>
              {variant === 'dot' ? 'N' : '확인 필요'}
            </Badge>
          </Stack>
        ))}
      </Stack>
    ),
    Alert: (
      <Stack gap={3}>
        <Alert>지금 연결하면 자산을 한눈에 볼 수 있어요</Alert>
        <Alert tone="success">변경 사항을 저장했어요</Alert>
        <Alert tone="warning">한 번 더 확인해 주세요</Alert>
        <Alert tone="danger">다시 시도해 주세요</Alert>
        <Alert>새로운 정산 내역이 도착했어요</Alert>
      </Stack>
    ),
    Banner: banner ? (
      <Banner
        tone="brand"
        icon={<ExampleIcon name="bell" />}
        title="새로운 혜택이 도착했어요"
        description="메가 비즈니스와 함께 시작하세요"
        action={
          <Button
            size="sm"
            onClick={() =>
              toast({ title: '혜택을 확인했어요', tone: 'success' })
            }
          >
            확인했어요
          </Button>
        }
        onDismiss={() => setBanner(false)}
      />
    ) : (
      <Button variant="weak" onClick={() => setBanner(true)}>
        배너 다시 보기
      </Button>
    ),
    Separator: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          line · thick · vertical
        </Text>
        <Separator />
        <Separator variant="thick" />
        <Stack direction="row" align="center" gap={3}>
          <Text size="sm">매출</Text>
          <Separator variant="vertical" />
          <Text size="sm">정산</Text>
        </Stack>
      </Stack>
    ),
    Toast: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          작업 결과를 화면 위에 잠깐 알려줘요.
        </Text>
        <Stack direction="row" gap={2} wrap>
          <Button
            variant="weak"
            onClick={() =>
              toast({
                title: '변경 사항을 저장했어요',
                description: '이제 안심하고 다음 작업을 시작하세요.',
                tone: 'success',
              })
            }
          >
            완료 토스트
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({ title: '잠시 후 다시 시도해 주세요', tone: 'danger' })
            }
          >
            오류 토스트
          </Button>
        </Stack>
      </Stack>
    ),
    Skeleton: (
      <Stack gap={3}>
        <div role="status" aria-label="프로필 불러오는 중">
          <Stack direction="row" gap={3} align="center">
            <Skeleton shape="circle" width={40} />
            <Skeleton lines={2} width="70%" />
          </Stack>
        </div>
        <Skeleton shape="rect" height={64} />
      </Stack>
    ),
    EmptyState: (
      <EmptyState
        icon={<ExampleIcon name="bag" />}
        title="아직 주문이 없어요"
        description="첫 상품을 등록하고 주문을 받아보세요."
        action={
          <Button
            variant="weak"
            onClick={() => toast({ title: '상품 등록 버튼을 눌렀어요' })}
          >
            상품 등록하기
          </Button>
        }
      />
    ),
    ProgressBar: (
      <Stack gap={3}>
        <ListRow
          title="여행 자금 모으기"
          description="100만원 중 80만원"
          trailing={<Badge tone="brand">80%</Badge>}
        />
        <ProgressBar label="여행 자금 저축률" value={80} />
        <ProgressBar label="목표 달성률" value={35} />
      </Stack>
    ),
    Result: (
      <Result
        title="모두 준비됐어요"
        description="이제 새로운 경험을 시작해 보세요"
        actions={
          <Button variant="weak" fullWidth>
            확인했어요
          </Button>
        }
      />
    ),
  };
  return <CategoryCards code="SURFACE" order={surfaceNames} demos={demos} />;
}
