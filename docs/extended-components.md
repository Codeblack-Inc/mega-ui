# 기초·콘텐츠·파일·AI 확장 API

기존 토큰·Card·Text·Button·Dialog를 재사용합니다. 네이티브 요소 props, className과 style을 해당 루트에 전달합니다. 내부에 별도 DOM ref가 필요한 Portal/FilePreview 등은 아래 동작을 따릅니다. `ThemeProvider`는 글로벌 상태를 변경하지 않고 자신의 하위 DOM에 테마를 적용합니다.

## 기초·레이아웃

| API                          | 핵심 props와 동작                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Typography, Divider, Surface | 각각 Text, Separator, Card와 동일한 구현·타입                                                                          |
| Icon                         | SVG children; `size` 16/20/24/32, `label` 또는 aria-label/aria-labelledby. 이름 없는 아이콘은 장식용                   |
| Color                        | `tone` brand/success/warning/danger/text/surface, 필수 `label`; 토큰 색상 견본                                         |
| Box                          | min-width:0인 div                                                                                                      |
| VisuallyHidden               | 화면에는 감추고 보조 기술에는 제공하는 span                                                                            |
| FocusRing                    | 자식에 포커스가 들어오면 경계 강조                                                                                     |
| ThemeProvider                | `theme` light/dark, children. 중첩 가능                                                                                |
| Portal                       | `container` 기본 document.body. 마운트 후 렌더, SSR은 null. 가장 가까운 ThemeProvider의 테마 유지                      |
| HStack, VStack, Flex         | 기존 Stack props. HStack=row, VStack=column, Flex 기본=row                                                             |
| GridItem                     | div의 `column`/`row`를 CSS gridColumn/gridRow로 전달                                                                   |
| Center, Spacer               | 가운데 정렬 div / 남은 flex 공간 채우기                                                                                |
| AspectRatio                  | `ratio` 기본 16/9, 잘못된 비율은 1                                                                                     |
| ScrollArea                   | 필수 `label`, `maxHeight` 기본 320. 키보드로 포커스·스크롤 가능                                                        |
| SplitPane                    | `first`, `second`, 필수 `label`, defaultSize 50%, min 15/max 85. 네이티브 슬라이더로 비율 조절; 모바일에서는 세로 배치 |
| ResizablePanel               | 필수 `label`, direction horizontal/vertical/both. 브라우저 resize 핸들 또는 패널 포커스 후 방향키로 16px 조절          |
| AppShell                     | `header`, `sidebar`, `footer`, children, `independentScroll`. 중첩 main을 만들지 않으며 소비 앱이 main 제공            |
| PageLayout                   | `header`, `footer`, children을 section 안에 세로 배치                                                                  |

## 콘텐츠

| API             | 핵심 props와 동작                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tag, KPI        | Badge, Stat의 별칭                                                                                                                                                |
| Status          | Badge props + role=status. 색상과 함께 의미 있는 텍스트 제공                                                                                                      |
| DescriptionList | `items: {term, description}[]` 또는 dt/dd children                                                                                                                |
| List, ListItem  | ul/li 표준 속성                                                                                                                                                   |
| Timeline        | `items: {id, title, description?, time?, dateTime?}[]`                                                                                                            |
| Tree            | `label`, `nodes: {id,label,children?,disabled?}[]`, `value`, `onValueChange`. 네이티브 details와 목록을 사용하는 탐색 UI; ARIA tree의 방향키 패턴은 사용하지 않음 |
| Accordion       | `items: {id,title,content}[]`, `multiple`, `defaultValue`. 네이티브 details/summary; 단일/다중 펼침                                                               |
| Carousel        | 필수 `label`, children 각각 한 슬라이드. 이전/다음 버튼; 자동 재생 없음                                                                                           |
| Code, CodeBlock | Code는 inline children, CodeBlock은 `code` 문자열과 선택적 `language`. HTML 실행 없이 텍스트 표시; 구문 강조 없음                                                 |
| QRCode          | 필수 `value`, `label`, size 160, correction L/M/Q/H 기본 M. UTF-8 데이터, 4모듈 quiet zone, 테마와 무관한 QR 전용 흑백 토큰. 용량 초과는 alert                    |

QR은 [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator/tree/master/js)의 인코더를 사용하며 외부 이미지 서비스로 데이터를 전송하지 않습니다.

## 미디어·파일

| API         | 핵심 props와 동작                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Image       | img 표준 props + 필수 alt, 선택적 fallback. 로딩 실패·누락 시 대체 표시, 기본 lazy                                                    |
| ImageViewer | Dialog props + src/alt. 모달에서 100–300% 확대/축소, 내부 스크롤                                                                      |
| Gallery     | `label`, `images: {src,alt,thumbnail?}[]`; 썸네일 버튼으로 ImageViewer 열기                                                           |
| Dropzone    | `label`, `onFilesChange(File[])`, accept/multiple/disabled/maxSize(바이트)/onReject. 드롭과 파일 선택에 같은 형식·크기·개수 검증 적용 |
| FileUpload  | Dropzone props + 선택적 controlled `files`. 선택 파일명을 표시; 전송은 애플리케이션 콜백 책임                                         |
| FilePreview | `file: File`; blob URL을 만들고 교체/언마운트 시 해제. 이미지/PDF 표시, 나머지는 다운로드 링크                                        |
| PDFViewer   | `src`, `label`; object type=application/pdf와 기본 열기 링크. 검색·인쇄·페이지 이동은 브라우저 PDF 뷰어 기능에 따름                   |

accept와 maxSize는 사용자 안내용 클라이언트 검증입니다. 서버는 업로드된 실제 내용·권한·용량을 별도로 검증해야 합니다.

## AI 대화 UI

| API           | 핵심 props와 동작                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat          | `label`, MessageBubble children; role=log, 새 메시지 추가 알림                                                                                                                         |
| MessageBubble | `author`, `side` start/end, `time`, children. HTML/Markdown을 실행하지 않는 ReactNode 표현                                                                                             |
| PromptInput   | `label`, value/defaultValue/onValueChange, `onSubmit(text)` 동기/Promise. Enter 전송, Shift+Enter 줄바꿈, IME 조합 중 전송 방지. 대기 중 중복 전송 차단, 실패 시 초안 보존과 오류 표시 |
| StreamingText | `text`, `streaming`. 실제 스트림 누적은 애플리케이션이 제공. 진행 중 반복 낭독을 억제하며 완료 시 polite 알림                                                                          |
| AgentActivity | `steps: {id,label,status,detail?}[]`, status=pending/running/complete/error. 단계별 텍스트 상태 표시                                                                                   |

PromptInput의 `busy`와 `onStop`은 외부 생성 작업의 상태와 중단 콜백입니다. AI 요청, 스트림 수신, 모델 선택, 도구 실행 기능은 제공하지 않습니다.
