import { useState, type ReactNode } from 'react';
import {
  Tag,
  Status,
  KPI,
  DescriptionList,
  List,
  ListItem,
  Timeline,
  Tree,
  Accordion,
  Carousel,
  Code,
  CodeBlock,
  QRCode,
  Image,
  ImageViewer,
  Gallery,
  FileUpload,
  Dropzone,
  FilePreview,
  Chat,
  MessageBubble,
  PromptInput,
  StreamingText,
  AgentActivity,
  Button,
  Text,
  Surface,
  AspectRatio,
  Stack,
  Tabs,
  TabPanel,
} from '@mega-ui/react';
import { CategoryCards } from './shell';
import sampleImage from '../../docs/favicon.svg?raw';
export const contentMediaNames = [
  'Tag',
  'Status',
  'KPI',
  'DescriptionList',
  'List',
  'ListItem',
  'Timeline',
  'Tree',
  'Accordion',
  'Carousel',
  'Code',
  'CodeBlock',
  'QRCode',
  'Image',
  'ImageViewer',
  'Gallery',
  'FileUpload',
  'Dropzone',
  'FilePreview',
  'PDFViewer',
  'Chat',
  'MessageBubble',
  'PromptInput',
  'StreamingText',
  'AgentActivity',
] as const;
/** Inline SVG scenes as data URIs, so the docs need no image assets. */
const scene = (sky: string, ground: string, shape: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><rect width="160" height="100" fill="${sky}"/>${shape}<rect y="70" width="160" height="30" fill="${ground}"/></svg>`,
  )}`;
const images = [
  {
    src: scene(
      '#dcecfe',
      '#1f9d6f',
      '<circle cx="120" cy="30" r="14" fill="#ffbc46"/><path d="M0 70 40 30 80 70Z" fill="#2272eb"/><path d="M60 70 110 25 160 70Z" fill="#1b59c5"/>',
    ),
    alt: '산과 해가 있는 풍경',
    caption: '풍경 · 16:10',
  },
  {
    src: scene(
      '#1c4989',
      '#333840',
      '<circle cx="35" cy="28" r="10" fill="#fff3ce"/><rect x="60" y="30" width="18" height="40" fill="#4e535c"/><rect x="85" y="18" width="24" height="52" fill="#727780"/><rect x="118" y="40" width="20" height="30" fill="#4e535c"/>',
    ),
    alt: '밤의 도시 스카이라인',
    caption: '도시 · 밤',
  },
  {
    src: scene(
      '#ebf4ff',
      '#3182f6',
      '<circle cx="80" cy="60" r="26" fill="#ffbc46"/><path d="M0 62h160v8H0z" fill="#93c0fc"/>',
    ),
    alt: '바다 위로 지는 해',
    caption: '바다 · 노을',
  },
  {
    src: scene(
      '#fff3ce',
      '#e26d00',
      '<circle cx="50" cy="45" r="22" fill="#ef3341"/><circle cx="110" cy="50" r="16" fill="#a450fc"/>',
    ),
    alt: '추상 색면',
    caption: '추상 · 4:3',
  },
];
const fileTabs = ['FileUpload', 'Dropzone', 'FilePreview', 'PDFViewer'].map(
  (value) => ({ value, label: value }),
);
/** The four file components share one tabbed card. */
const cardOrder = [
  ...contentMediaNames.slice(0, 16),
  'Files',
  ...contentMediaNames.slice(20),
];
export function ContentMediaCategory() {
  const [viewer, setViewer] = useState(false);
  const [selected, setSelected] = useState('');
  const [file, setFile] = useState<File>();
  const [pdf, setPdf] = useState<File>();
  const [uploaded, setUploaded] = useState('');
  const [fileTab, setFileTab] = useState('FileUpload');
  const [messages, setMessages] = useState(['컴포넌트에 대해 물어보세요.']);
  const [prompt, setPrompt] = useState('');
  const [failSubmit, setFailSubmit] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const demos: Record<string, ReactNode> = {
    Tag: <Tag tone="brand">디자인 시스템</Tag>,
    Status: <Status tone="success">서비스 정상</Status>,
    KPI: (
      <KPI
        label="이번 달 활성 사용자"
        value="12,480"
        delta={{ value: '12.5%', direction: 'up' }}
      />
    ),
    DescriptionList: (
      <DescriptionList
        items={[
          { term: '프로젝트', description: 'Mega UI' },
          { term: '상태', description: '개발 중' },
        ]}
      />
    ),
    List: (
      <List>
        <ListItem>첫 번째 항목</ListItem>
        <ListItem>두 번째 항목</ListItem>
      </List>
    ),
    ListItem: (
      <List>
        <ListItem>표준 li 의미를 유지해요.</ListItem>
      </List>
    ),
    Timeline: (
      <Timeline
        items={[
          {
            id: 'a',
            title: '컴포넌트 목록 확인',
            time: '09:00',
            dateTime: '2026-09-09T09:00',
            description: '기존 구현을 대조했어요.',
          },
          { id: 'b', title: '구현과 검증', time: '10:00' },
        ]}
      />
    ),
    Tree: (
      <>
        <Tree
          label="프로젝트 파일"
          value={selected}
          onValueChange={setSelected}
          nodes={[
            {
              id: 'src',
              label: 'src',
              children: [
                { id: 'components', label: 'components' },
                { id: 'styles', label: 'styles' },
              ],
            },
          ]}
        />
        <Text size="sm">선택: {selected || '없음'}</Text>
      </>
    ),
    Accordion: (
      <Accordion
        items={[
          {
            id: 'a',
            title: '다크 모드를 지원하나요?',
            content: '시맨틱 토큰으로 라이트와 다크 테마를 지원해요.',
          },
          {
            id: 'b',
            title: '키보드로 조작할 수 있나요?',
            content: 'Tab과 Enter로 펼칠 수 있어요.',
          },
        ]}
      />
    ),
    Carousel: (
      <Carousel label="기능 안내">
        <Surface variant="filled">1. 기존 컴포넌트를 재사용해요.</Surface>
        <Surface variant="filled">2. 시맨틱 토큰으로 표현해요.</Surface>
        <Surface variant="filled">3. 브라우저에서 확인해요.</Surface>
      </Carousel>
    ),
    Code: (
      <Text>
        패키지는 <Code>@mega-ui/react</Code>로 불러와요.
      </Text>
    ),
    CodeBlock: (
      <CodeBlock
        language="tsx"
        code={'<Button variant="primary">저장하기</Button>'}
      />
    ),
    QRCode: (
      <QRCode value="https://example.com/mega-ui" label="Mega UI 예제 링크" />
    ),
    Image: (
      <div className="demo-scenes">
        {images.slice(0, 3).map((image, i) => (
          <figure key={image.alt}>
            <AspectRatio ratio={i === 2 ? 1 : 16 / 10}>
              <Image src={image.src} alt={image.alt} />
            </AspectRatio>
            <figcaption>
              <Text size="xs" tone="muted" as="span">
                {i === 2 ? '정사각 · 1:1' : image.caption}
              </Text>
            </figcaption>
          </figure>
        ))}
      </div>
    ),
    ImageViewer: (
      <>
        <Button variant="secondary" onClick={() => setViewer(true)}>
          이미지 크게 보기
        </Button>
        <ImageViewer
          open={viewer}
          onClose={() => setViewer(false)}
          title="이미지 미리보기"
          src={images[0]?.src ?? ''}
          alt={images[0]?.alt ?? ''}
        />
      </>
    ),
    Gallery: (
      <>
        <Gallery
          label="예제 갤러리"
          images={images}
          style={{ maxWidth: 360 }}
        />
        <Text size="xs" tone="muted">
          썸네일을 누르면 크게 볼 수 있어요.
        </Text>
      </>
    ),
    Files: (
      <>
        <Tabs
          id="catalog-files"
          label="파일 컴포넌트"
          items={fileTabs}
          value={fileTab}
          onValueChange={setFileTab}
        />
        <TabPanel
          tabsId="catalog-files"
          value="FileUpload"
          active={fileTab === 'FileUpload'}
        >
          <Stack gap={3}>
            <FileUpload
              label="파일을 선택하거나 여기로 끌어 놓으세요"
              multiple
              onFilesChange={(files) =>
                setUploaded(files.map((f) => f.name).join(', '))
              }
            />
            <Text size="sm">선택한 파일: {uploaded || '없음'}</Text>
          </Stack>
        </TabPanel>
        <TabPanel
          tabsId="catalog-files"
          value="Dropzone"
          active={fileTab === 'Dropzone'}
        >
          <Dropzone
            label="이미지 파일 선택 · 최대 5MB"
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            onFilesChange={(files) => setFile(files[0])}
          />
        </TabPanel>
        <TabPanel
          tabsId="catalog-files"
          value="FilePreview"
          active={fileTab === 'FilePreview'}
        >
          <Stack gap={3} align="start">
            <Button
              variant="secondary"
              onClick={() =>
                setFile(
                  new File([sampleImage], 'sample.svg', {
                    type: 'image/svg+xml',
                  }),
                )
              }
            >
              샘플 이미지 미리보기
            </Button>
            {file ? (
              <FilePreview file={file} />
            ) : (
              <Text size="sm">
                Dropzone 탭에서 고른 파일이 여기에 표시돼요.
              </Text>
            )}
          </Stack>
        </TabPanel>
        <TabPanel
          tabsId="catalog-files"
          value="PDFViewer"
          active={fileTab === 'PDFViewer'}
        >
          <Stack gap={3}>
            <Text size="sm">
              PDF를 선택하면 PDFViewer가 브라우저의 문서 뷰어로 표시해요.
            </Text>
            <Dropzone
              label="미리 볼 PDF 선택"
              accept="application/pdf,.pdf"
              onFilesChange={(files) => setPdf(files[0])}
            />
            {pdf && <FilePreview file={pdf} />}
          </Stack>
        </TabPanel>
      </>
    ),
    Chat: (
      <>
        <Chat label="컴포넌트 상담">
          {messages.map((message, i) => (
            <MessageBubble
              key={i}
              author={i ? '나' : '도우미'}
              side={i ? 'end' : 'start'}
            >
              {message}
            </MessageBubble>
          ))}
        </Chat>
        <PromptInput
          label="채팅 메시지"
          onSubmit={(message) => setMessages((items) => [...items, message])}
        />
      </>
    ),
    MessageBubble: (
      <MessageBubble author="도우미" time="09:30">
        요청한 컴포넌트 목록을 확인하고 있어요.
      </MessageBubble>
    ),
    PromptInput: (
      <>
        <Button
          variant="secondary"
          aria-pressed={failSubmit}
          onClick={() => setFailSubmit((value) => !value)}
        >
          전송 실패 상황 체험
        </Button>
        <PromptInput
          label="작업 요청"
          placeholder="어떤 작업이 필요한가요?"
          onSubmit={async (text) => {
            if (failSubmit) throw new Error('Demo failure');
            setPrompt(text);
          }}
        />
        <Text size="sm">제출한 내용: {prompt || '없음'}</Text>
      </>
    ),
    StreamingText: (
      <>
        <StreamingText
          text={
            streaming
              ? '컴포넌트를 확인하고 있어요…'
              : '컴포넌트 확인을 마쳤어요.'
          }
          streaming={streaming}
        />
        <Button variant="secondary" onClick={() => setStreaming((v) => !v)}>
          {streaming ? '완료로 전환' : '스트리밍 상태 보기'}
        </Button>
      </>
    ),
    AgentActivity: (
      <AgentActivity
        steps={[
          { id: 'a', label: '기존 구현 확인', status: 'complete' },
          { id: 'b', label: '누락 컴포넌트 구현', status: 'running' },
          { id: 'c', label: '브라우저 검증', status: 'pending' },
        ]}
      />
    ),
  };
  return (
    <CategoryCards
      code="CONTENT+"
      order={cardOrder}
      groups={{ Files: fileTabs.map((tab) => tab.value) }}
      demos={demos}
    />
  );
}
