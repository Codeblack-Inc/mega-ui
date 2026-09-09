import { useState } from 'react';
import {
  Badge,
  Card,
  Chip,
  Grid,
  Heading,
  LinkButton,
  PageHeader,
  Stack,
  Text,
} from '@mega-ui/react';
import { exampleGroups, examples } from './routes';

/** Landing page for every screen example, grouped by product domain. */
export function GalleryPage() {
  const [group, setGroup] = useState('all');
  const visible = exampleGroups.filter(
    (item) => group === 'all' || item.key === group,
  );
  return (
    <Stack gap={6}>
      <PageHeader
        title="컴포넌트만으로 만든 실제 화면"
        description="금융, 계정, 업무, 커머스, AI까지. 소스 코드를 그대로 복사해 시작하세요."
        actions={<Badge tone="brand">전체 {examples.length}개</Badge>}
      />
      <Stack direction="row" gap={2} wrap role="group" aria-label="분야 필터">
        <Chip selected={group === 'all'} onClick={() => setGroup('all')}>
          전체
        </Chip>
        {exampleGroups.map((item) => (
          <Chip
            key={item.key}
            selected={group === item.key}
            onClick={() => setGroup(item.key)}
          >
            {item.label} {item.items.length}
          </Chip>
        ))}
      </Stack>
      {visible.map((item) => (
        <Stack gap={4} key={item.key}>
          <Stack gap={1}>
            <Heading level={2} size="lg">
              {item.label}
            </Heading>
            <Text tone="muted">{item.description}</Text>
          </Stack>
          <Grid minItemWidth={260} gap={4}>
            {item.items.map((example) => (
              <Card key={example.id} variant="outlined" padding="lg">
                <Stack gap={3} className="home-card">
                  <Stack direction="row" justify="between" align="center">
                    <Text size="xs" tone="brand" weight="semibold">
                      {example.label}
                    </Text>
                    {example.wide ? (
                      <Badge tone="neutral">전체 너비</Badge>
                    ) : null}
                  </Stack>
                  <Heading level={3} size="sm">
                    {example.title}
                  </Heading>
                  <Text size="sm" tone="secondary">
                    {example.description}
                  </Text>
                  <LinkButton href={`#${example.id}`} variant="weak" size="sm">
                    화면 열기
                  </LinkButton>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
