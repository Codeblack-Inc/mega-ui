import type { ReactNode } from 'react';
import * as Mega from '@mega-ui/react';
import {
  Badge,
  Card,
  CodeBlock,
  CopyButton,
  Grid,
  Heading,
  LinkButton,
  ListRow,
  Stack,
  Stat,
  Text,
} from '@mega-ui/react';
import { categories } from './catalog';
import { componentCount, docs, examples } from './routes';

const exportCount = Object.keys(Mega).length;

const installCode = `npm install /absolute/path/to/mega-ui-react-0.1.0.tgz`;

const usageCode = `import { Button, Card, Container, Heading, Stack, Text } from '@mega-ui/react';
import '@mega-ui/react/styles.css'; // 앱 진입점에서 한 번만

export function Welcome() {
  return (
    <Container size="md">
      <Card>
        <Stack gap={4}>
          <Heading level={1}>우리 팀의 워크스페이스</Heading>
          <Text tone="muted">같은 언어로 더 빠르게 만듭니다.</Text>
          <Button>시작하기</Button>
        </Stack>
      </Card>
    </Container>
  );
}`;

const principles = [
  {
    title: '실측한 토큰',
    body: '색, 치수, 타입 스케일을 토스 웹 제품에서 실측한 값에 맞췄어요. 익숙한 리듬이라 설명 없이도 자연스러워요.',
  },
  {
    title: '조합 우선',
    body: '레이아웃 → 기본 컴포넌트 → 반복 패턴 → 화면 순서로 쌓아요. 거대한 설정 객체 대신 JSX로 조합해요.',
  },
  {
    title: '브라우저 기본 동작',
    body: '폼은 네이티브 요소, 모달은 <dialog>, 콤보박스는 datalist. 접근성과 키보드 동작을 브라우저가 책임져요.',
  },
  {
    title: '가벼운 의존성',
    body: 'React 19 peer 하나와 QR 인코더 하나뿐이에요. Tailwind, CSS-in-JS, 상태 관리 라이브러리를 요구하지 않아요.',
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={4} className="home-section">
      <Stack gap={1}>
        <Heading level={2} size="lg">
          {title}
        </Heading>
        {description ? <Text tone="muted">{description}</Text> : null}
      </Stack>
      {children}
    </Stack>
  );
}

export function HomePage() {
  return (
    <Stack gap={8} className="home">
      <Stack gap={5} align="start" className="home-hero">
        <Badge tone="brand">v0.1.0 · React 19 · TypeScript · SCSS</Badge>
        <Heading level={1} size="2xl">
          익숙해서 쉽고, 단순해서 편안한
          <br />
          회사 웹을 위한 React UI.
        </Heading>
        <Text size="lg" tone="secondary" className="home-hero__lead">
          Mega UI는 토스 웹 제품에서 실측한 디자인 토큰 위에 만든 사내 컴포넌트
          라이브러리예요. 레이아웃부터 데이터 그리드, AI 채팅까지{' '}
          {componentCount}개 컴포넌트를 조합해 같은 언어로 화면을 만들어요.
        </Text>
        <Stack direction="row" gap={2} wrap>
          <LinkButton href="#components/foundation" size="lg">
            컴포넌트 둘러보기
          </LinkButton>
          <LinkButton href="#dashboard" variant="secondary" size="lg">
            화면 예제 보기
          </LinkButton>
          <LinkButton href="./getting-started.md" variant="text" size="lg">
            시작하기 문서
          </LinkButton>
        </Stack>
      </Stack>

      <Grid minItemWidth={180} gap={3}>
        <Card variant="outlined">
          <Stat label="컴포넌트" value={componentCount} unit="개" />
        </Card>
        <Card variant="outlined">
          <Stat label="공개 export" value={exportCount} unit="개" />
        </Card>
        <Card variant="outlined">
          <Stat label="카테고리" value={categories.length} unit="개" />
        </Card>
        <Card variant="outlined">
          <Stat label="화면 예제" value={examples.length} unit="개" />
        </Card>
      </Grid>

      <Section
        title="3분 만에 시작하기"
        description="npm pack으로 만든 tgz를 설치하고, 스타일을 한 번 불러오면 끝이에요."
      >
        <Grid minItemWidth={320} gap={4}>
          <Card variant="outlined" padding="lg">
            <Stack gap={3}>
              <Stack direction="row" justify="between" align="center">
                <Heading level={3} size="sm">
                  1. 설치
                </Heading>
                <CopyButton value={installCode} variant="ghost" size="sm">
                  복사
                </CopyButton>
              </Stack>
              <CodeBlock code={installCode} language="sh" />
              <Text size="sm" tone="muted">
                아직 레지스트리에 게시하지 않았어요. 저장소에서 npm ci
                &amp;&amp; npm pack을 실행해 tgz를 만들어요.
              </Text>
            </Stack>
          </Card>
          <Card variant="outlined" padding="lg">
            <Stack gap={3}>
              <Stack direction="row" justify="between" align="center">
                <Heading level={3} size="sm">
                  2. 사용
                </Heading>
                <CopyButton value={usageCode} variant="ghost" size="sm">
                  복사
                </CopyButton>
              </Stack>
              <CodeBlock code={usageCode} language="tsx" />
            </Stack>
          </Card>
        </Grid>
      </Section>

      <Section title="만드는 방식">
        <Grid minItemWidth={240} gap={4}>
          {principles.map((item) => (
            <Card key={item.title} variant="outlined" padding="lg">
              <Stack gap={2}>
                <Heading level={3} size="sm">
                  {item.title}
                </Heading>
                <Text size="sm" tone="secondary">
                  {item.body}
                </Text>
              </Stack>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section
        title="컴포넌트 카테고리"
        description="기초부터 확장까지, 카테고리별로 실제 렌더링과 소스 코드를 확인해요."
      >
        <Grid minItemWidth={260} gap={4}>
          {categories.map((category) => (
            <Card key={category.key} variant="outlined" padding="lg">
              <Stack gap={3} className="home-card">
                <Stack direction="row" justify="between" align="center">
                  <Heading level={3} size="sm">
                    {category.label}
                  </Heading>
                  <Badge tone="brand">{category.names.length}</Badge>
                </Stack>
                <Text size="sm" tone="secondary">
                  {category.description}
                </Text>
                <LinkButton
                  href={`#components/${category.key}`}
                  variant="weak"
                  size="sm"
                >
                  보러 가기
                </LinkButton>
              </Stack>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section
        title="화면 예제"
        description="컴포넌트만 조합해 만든 실제 화면이에요. 소스 코드를 그대로 가져다 쓸 수 있어요."
      >
        <Grid minItemWidth={260} gap={4}>
          {examples.map((item, index) => (
            <Card key={item.id} variant="outlined" padding="lg">
              <Stack gap={3} className="home-card">
                <Text size="xs" tone="brand" weight="semibold">
                  EXAMPLE / {String(index + 1).padStart(2, '0')}
                </Text>
                <Heading level={3} size="sm">
                  {item.title}
                </Heading>
                <Text size="sm" tone="secondary">
                  {item.description}
                </Text>
                <LinkButton href={`#${item.id}`} variant="weak" size="sm">
                  {item.label} 열기
                </LinkButton>
              </Stack>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section
        title="문서"
        description="사람과 AI가 같은 Markdown을 읽어요. llms.txt가 전체 인덱스예요."
      >
        <Card variant="outlined" padding="lg">
          <Stack gap={0} className="home-docs">
            {docs.map((doc) => (
              <ListRow
                key={doc.href}
                title={doc.label}
                description={doc.description}
                trailing={
                  <LinkButton href={doc.href} variant="text" size="sm">
                    열기
                  </LinkButton>
                }
              />
            ))}
          </Stack>
        </Card>
      </Section>
    </Stack>
  );
}
