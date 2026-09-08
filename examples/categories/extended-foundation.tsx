import { useState, type ReactNode } from 'react';
import {
  Typography,
  Icon,
  Color,
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
  Text,
  Grid,
} from '@mega-ui/react';
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
export function ExtendedFoundationCategory() {
  const [portal, setPortal] = useState(false);
  const demos: Record<string, ReactNode> = {
    Typography: (
      <Typography>기존 Text 타입과 크기를 그대로 사용해요.</Typography>
    ),
    Icon: (
      <HStack>
        {([16, 20, 24, 32] as const).map((size) => (
          <Icon size={size} key={size} label={`${size}px 확인`}>
            <path d="m5 12 4 4L19 6" />
          </Icon>
        ))}
      </HStack>
    ),
    Color: (
      <HStack>
        {(['brand', 'success', 'warning', 'danger'] as const).map((tone) => (
          <Color key={tone} tone={tone} label={tone} />
        ))}
      </HStack>
    ),
    Divider: (
      <>
        <Text>위쪽 내용</Text>
        <Divider />
        <Text>아래쪽 내용</Text>
      </>
    ),
    Surface: <Surface variant="filled">기존 Card의 표면을 사용해요.</Surface>,
    Box: <Box className="demo-frame">기본 div 컨테이너</Box>,
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
    HStack: (
      <HStack>
        <span className="demo-block">가로</span>
        <span className="demo-block">정렬</span>
      </HStack>
    ),
    VStack: (
      <VStack>
        <span className="demo-block">세로</span>
        <span className="demo-block">정렬</span>
      </VStack>
    ),
    Flex: (
      <Flex wrap justify="between">
        <span className="demo-block">시작</span>
        <span className="demo-block">끝</span>
      </Flex>
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
    Center: (
      <Center className="demo-frame" style={{ minHeight: 100 }}>
        가운데 정렬
      </Center>
    ),
    Spacer: (
      <HStack>
        <Text>왼쪽</Text>
        <Spacer />
        <Text>오른쪽</Text>
      </HStack>
    ),
    AspectRatio: (
      <AspectRatio ratio={16 / 9} className="demo-frame">
        <Center style={{ height: '100%' }}>16 : 9</Center>
      </AspectRatio>
    ),
    ScrollArea: (
      <ScrollArea label="스크롤 예제" maxHeight={140}>
        {Array.from({ length: 12 }, (_, i) => (
          <Text key={i}>스크롤 항목 {i + 1}</Text>
        ))}
      </ScrollArea>
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
      order={extendedFoundationNames}
      demos={demos}
    />
  );
}
