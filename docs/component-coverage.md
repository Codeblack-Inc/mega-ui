# 150개 컴포넌트 대조표

요청한 150개 이름을 초기 공개 API와 대조했습니다. 기존 83개 공개 export에는 보조 컴포넌트와 별칭도 포함돼 있어 요청 목록의 개수와는 다릅니다.

기존 동일 이름 36개, 기존 구현 재사용 19개, 신규 구현·조합 95개입니다. 실제 개수는 [기계 판독 목록](./component-inventory.json)과 테스트를 기준으로 관리합니다.

기존 API는 유지합니다. 재사용 항목은 새로운 이름을 export하며 같은 props 타입과 구현을 사용합니다. 신규 항목 중 HStack, VStack, Status 등은 기존 primitive를 조합합니다.

## API와 구현 범위

- [기존 컴포넌트](./components.md)
- [기초·콘텐츠·파일·AI](./extended-components.md)
- [입력·액션·선택](./extended-inputs.md)
- [내비게이션·오버레이·피드백](./extended-navigation.md)
- [엔터프라이즈](./enterprise.md)

엔터프라이즈는 정렬/검색, 고정 높이 가상 스크롤, 셀 편집, 집계, 날짜 배치 등 문서의 핵심 기능을 제공합니다. Spreadsheet 수식 엔진, Gantt 의존성 계산, 서버 업로드·AI 백엔드는 포함하지 않습니다. 반복 일정·시간대·예약 충돌은 별도 `SchedulerPro`가 제공합니다. 해당 데이터와 콜백은 소비 애플리케이션이 공급합니다.

| 번호 | 요청 컴포넌트        | 영역                      | 처리                         |
| ---- | -------------------- | ------------------------- | ---------------------------- |
| 1    | Typography           | Foundations               | 기존 재사용 · Text           |
| 2    | Icon                 | Foundations               | 추가                         |
| 3    | Color                | Foundations               | 추가                         |
| 4    | Divider              | Foundations               | 기존 재사용 · Separator      |
| 5    | Surface              | Foundations               | 기존 재사용 · Card           |
| 6    | Box                  | Foundations               | 추가                         |
| 7    | VisuallyHidden       | Foundations               | 추가                         |
| 8    | FocusRing            | Foundations               | 추가                         |
| 9    | Portal               | Foundations               | 추가                         |
| 10   | ThemeProvider        | Foundations               | 추가                         |
| 11   | Button               | Actions                   | 기존 유지                    |
| 12   | IconButton           | Actions                   | 기존 유지                    |
| 13   | ButtonGroup          | Actions                   | 추가                         |
| 14   | SplitButton          | Actions                   | 추가                         |
| 15   | ToggleButton         | Actions                   | 기존 유지                    |
| 16   | ToggleButtonGroup    | Actions                   | 기존 유지                    |
| 17   | FloatingActionButton | Actions                   | 추가                         |
| 18   | SpeedDial            | Actions                   | 추가                         |
| 19   | CopyButton           | Actions                   | 추가                         |
| 20   | LinkButton           | Actions                   | 추가                         |
| 21   | Input                | Form / Inputs             | 기존 유지                    |
| 22   | Textarea             | Form / Inputs             | 기존 유지                    |
| 23   | PasswordInput        | Form / Inputs             | 기존 재사용 · InputPassword  |
| 24   | NumberInput          | Form / Inputs             | 기존 재사용 · InputNumber    |
| 25   | CurrencyInput        | Form / Inputs             | 추가                         |
| 26   | PercentInput         | Form / Inputs             | 추가                         |
| 27   | MaskInput            | Form / Inputs             | 기존 재사용 · InputMask      |
| 28   | OTPInput             | Form / Inputs             | 기존 재사용 · InputOtp       |
| 29   | SearchInput          | Form / Inputs             | 추가                         |
| 30   | ColorInput           | Form / Inputs             | 기존 재사용 · InputColor     |
| 31   | FileInput            | Form / Inputs             | 추가                         |
| 32   | DateInput            | Form / Inputs             | 기존 재사용 · DatePicker     |
| 33   | DatePicker           | Form / Inputs             | 기존 유지                    |
| 34   | DateRangePicker      | Form / Inputs             | 추가                         |
| 35   | TimePicker           | Form / Inputs             | 추가                         |
| 36   | DateTimePicker       | Form / Inputs             | 추가                         |
| 37   | Slider               | Form / Inputs             | 기존 유지                    |
| 38   | RangeSlider          | Form / Inputs             | 추가                         |
| 39   | Rating               | Form / Inputs             | 기존 유지                    |
| 40   | Knob                 | Form / Inputs             | 기존 유지                    |
| 41   | FormField            | Form / Inputs             | 기존 재사용 · Field          |
| 42   | FormLabel            | Form / Inputs             | 기존 재사용 · Label          |
| 43   | FormDescription      | Form / Inputs             | 추가                         |
| 44   | FormError            | Form / Inputs             | 추가                         |
| 45   | InputGroup           | Form / Inputs             | 기존 유지                    |
| 46   | Checkbox             | Selection                 | 기존 유지                    |
| 47   | CheckboxGroup        | Selection                 | 기존 유지                    |
| 48   | Radio                | Selection                 | 기존 유지                    |
| 49   | RadioGroup           | Selection                 | 추가                         |
| 50   | Switch               | Selection                 | 기존 유지                    |
| 51   | Select               | Selection                 | 기존 유지                    |
| 52   | MultiSelect          | Selection                 | 추가                         |
| 53   | Autocomplete         | Selection                 | 기존 재사용 · AutoComplete   |
| 54   | Combobox             | Selection                 | 기존 재사용 · AutoComplete   |
| 55   | TreeSelect           | Selection                 | 추가                         |
| 56   | Anchor               | Navigation                | 추가                         |
| 57   | Breadcrumb           | Navigation                | 기존 유지                    |
| 58   | Tabs                 | Navigation                | 기존 유지                    |
| 59   | SegmentedControl     | Navigation                | 기존 유지                    |
| 60   | Pagination           | Navigation                | 기존 유지                    |
| 61   | Stepper              | Navigation                | 추가                         |
| 62   | Menu                 | Navigation                | 기존 유지                    |
| 63   | DropdownMenu         | Navigation                | 기존 재사용 · Menu           |
| 64   | ContextMenu          | Navigation                | 추가                         |
| 65   | NavigationMenu       | Navigation                | 추가                         |
| 66   | MegaMenu             | Navigation                | 추가                         |
| 67   | Sidebar              | Navigation                | 기존 재사용 · SideNav        |
| 68   | BottomNavigation     | Navigation                | 추가                         |
| 69   | CommandPalette       | Navigation                | 추가                         |
| 70   | BackToTop            | Navigation                | 추가                         |
| 71   | Container            | Layout                    | 기존 유지                    |
| 72   | Stack                | Layout                    | 기존 유지                    |
| 73   | HStack               | Layout                    | 추가                         |
| 74   | VStack               | Layout                    | 추가                         |
| 75   | Flex                 | Layout                    | 추가                         |
| 76   | Grid                 | Layout                    | 기존 유지                    |
| 77   | GridItem             | Layout                    | 추가                         |
| 78   | Center               | Layout                    | 추가                         |
| 79   | Spacer               | Layout                    | 추가                         |
| 80   | AspectRatio          | Layout                    | 추가                         |
| 81   | ScrollArea           | Layout                    | 추가                         |
| 82   | SplitPane            | Layout                    | 추가                         |
| 83   | ResizablePanel       | Layout                    | 추가                         |
| 84   | AppShell             | Layout                    | 추가                         |
| 85   | PageLayout           | Layout                    | 추가                         |
| 86   | Avatar               | Data Display              | 기존 유지                    |
| 87   | AvatarGroup          | Data Display              | 기존 유지                    |
| 88   | Badge                | Data Display              | 기존 유지                    |
| 89   | Tag                  | Data Display              | 기존 재사용 · Badge          |
| 90   | Chip                 | Data Display              | 기존 유지                    |
| 91   | Status               | Data Display              | 추가                         |
| 92   | Card                 | Data Display              | 기존 유지                    |
| 93   | Stat                 | Data Display              | 기존 유지                    |
| 94   | KPI                  | Data Display              | 기존 재사용 · Stat           |
| 95   | DescriptionList      | Data Display              | 추가                         |
| 96   | List                 | Data Display              | 추가                         |
| 97   | ListItem             | Data Display              | 추가                         |
| 98   | Timeline             | Data Display              | 추가                         |
| 99   | Tree                 | Data Display              | 추가                         |
| 100  | Accordion            | Data Display              | 추가                         |
| 101  | Carousel             | Data Display              | 추가                         |
| 102  | Code                 | Data Display              | 추가                         |
| 103  | CodeBlock            | Data Display              | 추가                         |
| 104  | QRCode               | Data Display              | 추가                         |
| 105  | EmptyState           | Data Display              | 기존 유지                    |
| 106  | Table                | Complex Data / Enterprise | 기존 유지                    |
| 107  | DataTable            | Complex Data / Enterprise | 추가                         |
| 108  | VirtualTable         | Complex Data / Enterprise | 추가                         |
| 109  | EditableTable        | Complex Data / Enterprise | 추가                         |
| 110  | TreeTable            | Complex Data / Enterprise | 추가                         |
| 111  | PivotTable           | Complex Data / Enterprise | 추가                         |
| 112  | PropertyGrid         | Complex Data / Enterprise | 추가                         |
| 113  | DataGrid             | Complex Data / Enterprise | 추가                         |
| 114  | Kanban               | Complex Data / Enterprise | TaskBoard 호환 래퍼          |
| 115  | Calendar             | Complex Data / Enterprise | 추가                         |
| 116  | Scheduler            | Complex Data / Enterprise | 추가 · SchedulerPro 확장판   |
| 117  | Gantt                | Complex Data / Enterprise | 추가                         |
| 118  | Spreadsheet          | Complex Data / Enterprise | 추가 · SpreadsheetPro 확장판 |
| 119  | OrganizationChart    | Complex Data / Enterprise | 추가 · DiagramEditor 확장판  |
| 120  | DataExplorer         | Complex Data / Enterprise | 추가                         |
| 121  | Alert                | Feedback / State          | 기존 유지                    |
| 122  | Message              | Feedback / State          | 추가                         |
| 123  | Toast                | Feedback / State          | 추가                         |
| 124  | Notification         | Feedback / State          | 추가                         |
| 125  | Progress             | Feedback / State          | 기존 재사용 · ProgressBar    |
| 126  | CircularProgress     | Feedback / State          | 추가                         |
| 127  | Skeleton             | Feedback / State          | 기존 유지                    |
| 128  | Spinner              | Feedback / State          | 추가                         |
| 129  | Result               | Feedback / State          | 기존 유지                    |
| 130  | ErrorState           | Feedback / State          | 추가                         |
| 131  | Tooltip              | Overlay                   | 기존 유지                    |
| 132  | Popover              | Overlay                   | 추가                         |
| 133  | HoverCard            | Overlay                   | 추가                         |
| 134  | Modal                | Overlay                   | 기존 재사용 · Dialog         |
| 135  | AlertDialog          | Overlay                   | 추가                         |
| 136  | Drawer               | Overlay                   | 추가                         |
| 137  | Sheet                | Overlay                   | 추가                         |
| 138  | Tour                 | Overlay                   | 추가                         |
| 139  | Image                | Media / Files             | 추가                         |
| 140  | ImageViewer          | Media / Files             | 추가                         |
| 141  | Gallery              | Media / Files             | 추가                         |
| 142  | FileUpload           | Media / Files             | 추가                         |
| 143  | Dropzone             | Media / Files             | 추가                         |
| 144  | FilePreview          | Media / Files             | 추가                         |
| 145  | PDFViewer            | Media / Files             | 추가                         |
| 146  | Chat                 | AI / Modern UX            | 추가                         |
| 147  | MessageBubble        | AI / Modern UX            | 추가                         |
| 148  | PromptInput          | AI / Modern UX            | 추가                         |
| 149  | StreamingText        | AI / Modern UX            | 추가                         |
| 150  | AgentActivity        | AI / Modern UX            | 추가                         |
