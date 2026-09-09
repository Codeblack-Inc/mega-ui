import { useState, type ReactNode } from 'react';
import {
  Typography,
  Icon,
  Divider,
  Surface,
  Box,
  VisuallyHidden,
  FocusRing,
  Portal,
  ThemeProvider,
  HStack,
  VStack,
  Flex,
  GridItem,
  Center,
  Spacer,
  AspectRatio,
  ScrollArea,
  SplitPane,
  ResizablePanel,
  AppShell,
  PageLayout,
  Button,
  SegmentedControl,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Grid,
} from '@mega-ui/react';
import { ExampleIcon, iconNames } from '../icons';
import { CategoryCards } from './shell';
export const extendedFoundationNames = [
  'Typography',
  'Icon',
  'Color',
  'Divider',
  'Surface',
  'Box',
  'VisuallyHidden',
  'FocusRing',
  'Portal',
  'ThemeProvider',
  'HStack',
  'VStack',
  'Flex',
  'GridItem',
  'Center',
  'Spacer',
  'AspectRatio',
  'ScrollArea',
  'SplitPane',
  'ResizablePanel',
  'AppShell',
  'PageLayout',
] as const;

/** Layout primitives share one interactive card; every other name keeps its own. */
const layoutMembers = ['HStack', 'VStack', 'Flex', 'Center', 'Spacer', 'Box'];
const cardOrder = [
  'Typography',
  'Icon',
  'Color',
  'Layout',
  'GridItem',
  'AspectRatio',
  'Divider',
  'Surface',
  'VisuallyHidden',
  'FocusRing',
  'Portal',
  'ThemeProvider',
  'ScrollArea',
  'SplitPane',
  'ResizablePanel',
  'AppShell',
  'PageLayout',
];

/** Semantic color tokens from src/styles/_tokens.scss (light values). */
const colorTokens = [
  { token: '--mega-brand', hex: '#3182f6', use: '주 동작, 링크, 선택 상태' },
  { token: '--mega-brand-soft', hex: '#1a7af9 · 9%', use: 'brand 배경 틴트' },
  { token: '--mega-danger', hex: '#de2b39', use: '오류, 삭제, 상승(주식)' },
  { token: '--mega-success', hex: '#009467', use: '완료, 정상' },
  { token: '--mega-warning', hex: '#c95c00', use: '주의, 대기' },
  { token: '--mega-text-strong', hex: '#1c1f25', use: '제목' },
  { token: '--mega-text', hex: '#1a1f29 · 89%', use: '본문' },
  { token: '--mega-muted', hex: '#161f2e · 61%', use: '보조 설명, 캡션' },
  { token: '--mega-bg', hex: '#f2f4f7', use: '페이지 배경' },
  { token: '--mega-surface', hex: '#ffffff', use: '카드, 시트 표면' },
  { token: '--mega-border', hex: '#031f3f · 9%', use: '구분선, 카드 테두리' },
];

function LayoutDemo() {
  const [direction, setDirection] = useState('row');
  const [gap, setGap] = useState('3');
  const [align, setAlign] = useState('center');
  const [spacer, setSpacer] = useState(true);
  const [center, setCenter] = useState(false);
  const StackTag = direction === 'row' ? HStack : VStack;
  const blocks = (
    <>
      <Box className="demo-block">하나</Box>
      <Box className="demo-block" style={{ padding: '18px 12px' }}>
        둘 (더 큼)
      </Box>
      {spacer ? <Spacer /> : null}
      <Box className="demo-block">셋</Box>
    </>
  );
  return (
    <>
      <Flex wrap gap={3} align="center">
        <SegmentedControl
          label="방향"
          name="layout-direction"
          value={direction}
          onValueChange={setDirection}
          options={[
            { label: 'HStack', value: 'row' },
            { label: 'VStack', value: 'column' },
          ]}
        />
        <SegmentedControl
          label="gap"
          name="layout-gap"
          value={gap}
          onValueChange={setGap}
          options={[
            { label: 'gap 1', value: '1' },
            { label: 'gap 3', value: '3' },
            { label: 'gap 6', value: '6' },
          ]}
        />
        <SegmentedControl
          label="정렬"
          name="layout-align"
          value={align}
          onValueChange={setAlign}
          options={[
            { label: '시작', value: 'start' },
            { label: '가운데', value: 'center' },
            { label: '늘림', value: 'stretch' },
          ]}
        />
      </Flex>
      <Flex wrap gap={4}>
        <Switch
          label="Spacer 넣기"
          checked={spacer}
          onChange={(e) => setSpacer(e.target.checked)}
        />
        <Switch
          label="Center로 감싸기"
          checked={center}
          onChange={(e) => setCenter(e.target.checked)}
        />
      </Flex>
      <Box className="demo-frame" style={{ minHeight: 140 }}>
        {center ? (
          <Center style={{ minHeight: 116 }}>
            <StackTag gap={Number(gap) as 1 | 3 | 6} align={align as 'start'}>
              {blocks}
            </StackTag>
          </Center>
        ) : (
          <StackTag gap={Number(gap) as 1 | 3 | 6} align={align as 'start'}>
            {blocks}
          </StackTag>
        )}
      </Box>
      <Text size="xs" tone="muted">
        {`<${StackTag === HStack ? 'HStack' : 'VStack'} gap={${gap}} align="${align}">`}
        {spacer ? ' + <Spacer />' : ''}
        {center ? ' inside <Center>' : ''} · Flex는 wrap·justify까지 여는
        기본형, Box는 className만 받는 div예요.
      </Text>
    </>
  );
}

export function ExtendedFoundationCategory() {
  const [portal, setPortal] = useState(false);
  const demos: Record<string, ReactNode> = {
    Typography: (
      <>
        <Typography>기존 Text 타입과 크기를 그대로 사용해요.</Typography>
        <Text size="sm" tone="muted">
          Text의 별칭이에요. size·tone·weight props가 같아요.
        </Text>
      </>
    ),
    Icon: (
      <>
        <HStack gap={3} align="center">
          {([16, 20, 24, 32] as const).map((size) => (
            <Icon size={size} key={size} label={`${size}px 확인`}>
              <path d="m5 12 4 4L19 6" />
            </Icon>
          ))}
          <Text size="xs" tone="muted">
            size 16 · 20 · 24 · 32
          </Text>
        </HStack>
        <div className="demo-glyphs">
          {iconNames.map((name) => (
            <figure key={name}>
              <ExampleIcon name={name} />
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
      </>
    ),
    Color: (
      <Table density="compact">
        <TableHead>
          <TableRow>
            <TableHeaderCell>토큰</TableHeaderCell>
            <TableHeaderCell>값</TableHeaderCell>
            <TableHeaderCell>용도</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {colorTokens.map((row) => (
            <TableRow key={row.token}>
              <TableCell>
                <HStack gap={2} align="center">
                  <span
                    className="demo-swatch"
                    style={{ background: `var(${row.token})` }}
                  />
                  <code>{row.token}</code>
                </HStack>
              </TableCell>
              <TableCell>
                <Text size="xs" tone="muted" as="span" numeric>
                  {row.hex}
                </Text>
              </TableCell>
              <TableCell>{row.use}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
    Layout: <LayoutDemo />,
    Divider: (
      <>
        <Text>위쪽 내용</Text>
        <Divider />
        <Text>아래쪽 내용</Text>
      </>
    ),
    Surface: <Surface variant="filled">기존 Card의 표면을 사용해요.</Surface>,
    VisuallyHidden: (
      <>
        <Text>스크린 리더에만 보조 설명을 전달해요.</Text>
        <VisuallyHidden>스크린 리더 안내 문구</VisuallyHidden>
      </>
    ),
    FocusRing: (
      <FocusRing>
        <Button variant="secondary">Tab 키로 포커스를 확인해요</Button>
      </FocusRing>
    ),
    Portal: (
      <>
        <Button variant="secondary" onClick={() => setPortal((v) => !v)}>
          {portal ? '포털 닫기' : '포털 열기'}
        </Button>
        {portal && (
          <Portal>
            <div
              style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}
            >
              <Surface>
                <Text>body에 렌더된 포털이에요.</Text>
                <Button onClick={() => setPortal(false)}>닫기</Button>
              </Surface>
            </div>
          </Portal>
        )}
      </>
    ),
    ThemeProvider: (
      <ThemeProvider theme="dark">
        <Surface variant="filled">
          <Typography>이 영역만 다크 테마예요.</Typography>
          <Button variant="secondary">테마 버튼</Button>
        </Surface>
      </ThemeProvider>
    ),
    GridItem: (
      <Grid minItemWidth={120}>
        <GridItem column="1 / -1" className="demo-block">
          전체 열
        </GridItem>
        <GridItem className="demo-block">첫 번째</GridItem>
        <GridItem className="demo-block">두 번째</GridItem>
      </Grid>
    ),
    AspectRatio: (
      <AspectRatio ratio={16 / 9} className="demo-frame">
        <Center style={{ height: '100%' }}>16 : 9</Center>
      </AspectRatio>
    ),
    ScrollArea: (
      <div className="demo-overflow">
        <ScrollArea
          label="스크롤 예제"
          maxHeight={144}
          className="demo-scroll-area"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <Text key={i}>스크롤 항목 {i + 1}</Text>
          ))}
        </ScrollArea>
      </div>
    ),
    SplitPane: (
      <SplitPane
        label="왼쪽 영역 너비"
        first={<Surface variant="filled">탐색 영역</Surface>}
        second={<Surface variant="outlined">상세 영역</Surface>}
      />
    ),
    ResizablePanel: (
      <ResizablePanel label="크기 조정 영역" direction="both">
        <Text>오른쪽 아래 핸들로 크기를 조절해요.</Text>
      </ResizablePanel>
    ),
    AppShell: (
      <AppShell
        header={<Text weight="bold">워크스페이스</Text>}
        sidebar={<Surface variant="filled">메뉴 영역</Surface>}
        footer={<Text size="xs">하단 안내</Text>}
      >
        <Surface variant="outlined">콘텐츠 영역</Surface>
      </AppShell>
    ),
    PageLayout: (
      <PageLayout
        header={<Text weight="bold">페이지 제목</Text>}
        footer={<Text size="xs">페이지 하단</Text>}
      >
        <Surface variant="filled">페이지 내용</Surface>
      </PageLayout>
    ),
  };
  return (
    <CategoryCards
      code="FOUNDATIONS+"
      order={cardOrder}
      groups={{ Layout: layoutMembers }}
      demos={demos}
    />
  );
}
