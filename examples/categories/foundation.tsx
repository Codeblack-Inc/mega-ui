import type { ReactNode } from 'react';
import { Card, Container, Grid, Heading, Stack, Text } from '@mega-ui/react';
import { CategoryCards } from './shell';

export const foundationNames = [
  'Container',
  'Stack',
  'Grid',
  'Heading',
  'Text',
] as const;

export function FoundationCategory() {
  const demos: Record<(typeof foundationNames)[number], ReactNode> = {
    Container: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          화면 폭을 정해진 최대값 안에서 가운데 정렬해요.
        </Text>
        <Container size="sm" className="demo-frame">
          <Text size="sm">size=&quot;sm&quot; · 최대 640px</Text>
        </Container>
        <Container size="md" className="demo-frame">
          <Text size="sm">size=&quot;md&quot; · 최대 960px</Text>
        </Container>
        <Container size="full" className="demo-frame">
          <Text size="sm">size=&quot;full&quot; · 제한 없음</Text>
        </Container>
      </Stack>
    ),
    Stack: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          세로와 가로, 간격만 정하면 정렬이 끝나요.
        </Text>
        <Stack gap={2} className="demo-frame">
          <div className="demo-block">1</div>
          <div className="demo-block">2</div>
        </Stack>
        <Stack direction="row" gap={2} wrap className="demo-frame">
          <div className="demo-block">row</div>
          <div className="demo-block">gap 2</div>
          <div className="demo-block">wrap</div>
        </Stack>
        <Stack direction="row" justify="between" className="demo-frame">
          <div className="demo-block">start</div>
          <div className="demo-block">end</div>
        </Stack>
      </Stack>
    ),
    Grid: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          최소 너비를 정하면 화면에 맞춰 열 수가 바뀌어요.
        </Text>
        <Grid minItemWidth={140} gap={3} className="demo-frame">
          {['자산', '소비', '투자', '혜택'].map((label) => (
            <div className="demo-block" key={label}>
              {label}
            </div>
          ))}
        </Grid>
      </Stack>
    ),
    Heading: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          제목은 5단계로, 문서 구조는 level로 정해요.
        </Text>
        <Heading size="2xl">2xl · 30px</Heading>
        <Heading size="xl">xl · 26px</Heading>
        <Heading size="lg">lg · 22px</Heading>
        <Heading size="md">md · 20px</Heading>
        <Heading size="sm">sm · 17px</Heading>
      </Stack>
    ),
    Text: (
      <Stack gap={3}>
        <Text size="lg">lg · 중요한 안내를 편안하게 읽어요</Text>
        <Text>md · 기본 본문 크기예요</Text>
        <Text size="sm" tone="secondary">
          sm · 보조 설명에 어울려요
        </Text>
        <Text size="xs" tone="muted">
          xs · 가장 작은 안내 문구예요
        </Text>
        <Card variant="filled">
          <Stack gap={2}>
            <Text tone="brand" weight="semibold">
              brand · 강조하고 싶은 문장
            </Text>
            <Text tone="danger" size="sm">
              danger · 다시 확인해 주세요
            </Text>
            <Text tone="success" size="sm">
              success · 저장을 마쳤어요
            </Text>
            <Text numeric weight="medium">
              1,234,567원 · numeric
            </Text>
          </Stack>
        </Card>
      </Stack>
    ),
  };
  return (
    <CategoryCards code="FOUNDATION" order={foundationNames} demos={demos} />
  );
}
