import type { ReactNode } from 'react';
import {
  Amount,
  Avatar,
  AvatarGroup,
  Badge,
  BottomCTA,
  Button,
  ListRow,
  Separator,
  Stack,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@mega-ui/react';
import { CategoryCards } from './shell';
import { ExampleIcon } from '../icons';

export const dataNames = [
  'Table',
  'Stat',
  'Amount',
  'Avatar',
  'AvatarGroup',
  'ListRow',
  'BottomCTA',
] as const;

const orders = [
  { name: '메가 주문 1', amount: 36000 },
  { name: '메가 주문 2', amount: 48000 },
  { name: '메가 주문 3', amount: 60000 },
  { name: '메가 주문 4', amount: 72000 },
];

const demos: Record<(typeof dataNames)[number], ReactNode> = {
  Table: (
    <Stack gap={3}>
      <Text size="sm" tone="muted">
        좁은 화면에서는 표 안에서 가로로 스크롤돼요.
      </Text>
      <Table density="compact" aria-label="결제 내역 예제">
        <TableHead>
          <TableRow>
            <TableHeaderCell>주문명</TableHeaderCell>
            <TableHeaderCell align="end">금액</TableHeaderCell>
            <TableHeaderCell>상태</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.name}>
              <TableCell>{order.name}</TableCell>
              <TableCell numeric>
                <Amount value={order.amount} size="sm" />
              </TableCell>
              <TableCell>
                <Badge tone="success">완료</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  ),
  Stat: (
    <Stack gap={3}>
      <Stat
        label="이번 달 매출액"
        value="12,840,000"
        unit="원"
        delta={{ value: '12.8%', direction: 'up' }}
        hint="지난달 같은 기간 대비"
      />
      <Separator />
      <Stat
        label="결제 취소"
        value="128,000"
        unit="원"
        delta={{ value: '3.2%', direction: 'down' }}
      />
    </Stack>
  ),
  Amount: (
    <Stack gap={3}>
      <Text size="sm" tone="muted">
        금액은 자릿수를 맞추고, 상승은 빨강·하락은 파랑으로 표시해요.
      </Text>
      <Stack direction="row" gap={4} wrap align="center">
        <Amount value={58200} size="lg" />
        <Amount value={-2.45} signed currency="%" tone="auto" />
        <Amount value={125.8} currency="$" />
      </Stack>
      <Text size="sm" tone="secondary" weight="medium" numeric>
        정산 예정일 2026.09.09
      </Text>
    </Stack>
  ),
  Avatar: (
    <Stack direction="row" gap={3} align="center" wrap>
      <Avatar name="김메가" size="lg" />
      <Avatar name="이토스" shape="rounded" />
      <Avatar name="박하늘" size="sm" />
      <Avatar name="정바다" size="xs" />
    </Stack>
  ),
  AvatarGroup: (
    <AvatarGroup max={3}>
      {['김메가', '이토스', '박하늘', '정바다', '오여름'].map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  ),
  ListRow: (
    <Stack gap={3}>
      <ListRow
        leading={
          <span className="example-icon" data-tone="blue">
            ₩
          </span>
        }
        title="메가뱅크 통장"
        description="잔액 2,340,000원"
        trailing={
          <a
            className="example-link"
            href="#dashboard"
            aria-label="메가뱅크 통장 보기"
          >
            보기 <ExampleIcon name="chevronRight" />
          </a>
        }
      />
      <ListRow
        leading={
          <span className="example-icon" data-tone="yellow">
            S
          </span>
        }
        title="차곡차곡 모으기"
        description="목표까지 80% 모았어요"
        trailing={<Badge tone="brand">저축 중</Badge>}
      />
      <Separator />
      <ListRow
        leading={
          <span className="example-icon" data-tone="purple">
            M
          </span>
        }
        title="이번 달 결제 내역"
        description="카드와 계좌를 한 번에"
        trailing={
          <a
            className="example-link"
            href="#payments"
            aria-label="이번 달 결제 내역 보기"
          >
            보기 <ExampleIcon name="chevronRight" />
          </a>
        }
      />
    </Stack>
  ),
  BottomCTA: (
    <BottomCTA description="이어서 목표를 완성해 보세요">
      <Button size="xl" variant="weak">
        이어서 하기
      </Button>
    </BottomCTA>
  ),
};

export function DataCategory() {
  return <CategoryCards code="DATA" order={dataNames} demos={demos} />;
}
