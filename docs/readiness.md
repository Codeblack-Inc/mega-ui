# 실무 준비도 보강

2026-09-09. 기존 공개 컴포넌트를 보강했으며, 이전 갭 보고서의 신규 컴포넌트 목록을 중복 구현하지 않습니다.

## 입력과 선택

- `Combobox.required`는 검색 문자열이 아닌 선택된 값을 검증합니다. 검색어를 편집하면 기존 선택값을 비웁니다. `disabled`이면 숨겨진 제출값도 비활성화합니다. `readOnly`, 사용자 `onFocus/onBlur/onKeyDown`, 한글 조합 중 Enter를 보존합니다.
- 선택 뒤 다시 열면 기본 내부 검색어가 비워져 전체 옵션이 보입니다. loading/error 상태에서 이전 옵션을 키보드로 선택할 수 없습니다. 방향키는 비활성 옵션을 건너뛰며 현재 옵션을 스크롤합니다. 팝업 위치는 기존 floating 로직을 재사용합니다.
- 비제어형 Combobox는 native form reset으로 defaultValue를 복원합니다. 제어형은 앱의 onReset에서 value/query 상태를 초기화하세요. 원격 요청 취소와 응답 순서 처리는 소비 앱 책임입니다.
- `DateRangePicker`는 value/defaultValue 모두 시작·종료 상호 제약을 적용합니다. 명시적 min/max는 상호 제약과 교집합을 취하며 역전된 범위는 오류 설명을 제공합니다. 프리셋과 native reset에도 범위가 갱신됩니다.
- 검색형 `MultiSelect`는 `loading`, `error`, `emptyMessage`, `onRetry`, `onQueryChange`, `manual`을 지원합니다. manual=true이면 전달받은 서버 결과를 로컬에서 다시 필터링하지 않습니다. 기존 네이티브 multiple select 모드는 유지합니다.

## 탭과 패널

Tabs에 화면 내 고유 id를 주고, 각 TabPanel에 같은 tabsId와 항목 value를 전달하세요. 탭과 패널의 id, aria-controls, aria-labelledby가 연결됩니다. 비활성 패널도 마운트해 연결 대상을 유지하세요.

```tsx
<Tabs id="orders" label="주문 보기" value={view} onValueChange={setView}
  items={[{ value: 'list', label: '목록' }, { value: 'chart', label: '차트' }]} />
<TabPanel tabsId="orders" value="list" active={view === 'list'}>…</TabPanel>
<TabPanel tabsId="orders" value="chart" active={view === 'chart'}>…</TabPanel>
```

기존 명시적 ID 체계는 TabItem.id/panelId와 TabPanel의 표준 DOM props로 연결할 수 있습니다. 첫 항목이 disabled이거나 선택 항목이 제거되면 사용 가능한 항목을 키보드 진입점으로 사용합니다. 제어형 앱은 동적으로 항목을 제거할 때 선택 상태도 동기화하세요.

## 토스트

기존 `toast(options)` 호출은 그대로 사용할 수 있고, 이제 제어 핸들을 반환합니다.

```tsx
const handle = toast({ title: '보고서를 준비하고 있어요', duration: 0 });
handle.update({
  title: '보고서가 준비됐어요',
  tone: 'success',
  duration: 3000,
});
handle.dismiss();
```

각 알림에 닫기 버튼이 있습니다. hover/키보드 포커스가 머무는 동안 자동 종료의 남은 시간을 보존합니다. CSS 애니메이션이 실행되지 않아도 닫힌 알림을 제거합니다.

## 시각·키보드 보강

- 브랜드색 #3182f6은 유지하고 흰 글자용 버튼 배경은 `--mega-action-fill`과 `--mega-action-danger-fill`로 분리했습니다. 두 색의 일반 텍스트 대비를 자동 검사합니다. SplitButton도 같은 색을 사용합니다.
- 모바일 폭 600px 이하 또는 coarse pointer에서 버튼·아이콘·칩·선택 옵션의 터치 영역을 최소 44px로 확장합니다. 기존 XL 56px은 유지합니다.
- DataGrid 셀 내부 input/textarea/select/contenteditable의 방향키를 셀 이동이 가로채지 않습니다.
- BarChart는 음수/양수를 공통 0 기준으로 그리며, LineChart는 날짜별 수치 목록을 눈에 보이게 제공합니다. 단위는 formatValue로 지정하세요. 다중 축·줌·실시간 차트 엔진은 포함하지 않습니다.

## 실무 상태·조합 카탈로그

개발 서버 `/#components/workflows`에서 아래 흐름과 소스를 확인할 수 있습니다.

- 폼 검증 → 저장 중 중복 실행 차단 → 실패 시 초안 보존 → 재시도 성공 → 취소 시 저장값 복원.
- 명시적 편집 종료는 Dialog로 확인합니다. 문서 사이트의 다른 링크·뒤로 가기는 예제 라우터의 확인 절차를 거치며, 새로고침/탭 닫기는 beforeunload를 사용합니다. 실제 소비 앱에서는 해당 라우터의 blocker와 저장 정책으로 연결하세요. UI 패키지는 전역 라우팅을 가로채지 않습니다.
- 선택 ID를 페이지 사이에 유지하면서 정렬·필터·페이지 결과를 manual DataGrid에 전달합니다. 일부 실패 시 성공한 항목은 처리하고 실패한 항목만 선택 상태로 남겨 재시도합니다.
- MultiSelect 정상/빈 결과/로딩/오류/비활성, 지속형 Toast 갱신·닫기, 업로드 취소·재시도, 알림 읽음, InlineEdit, 음수·0·빈 차트를 확인합니다.

예제 전송은 로컬 지연으로 모사합니다. 실제 저장 서버, 인증, 파일 전송, 권한 판정은 제공하지 않습니다. ErrorState와 ErrorBoundary는 다른 역할이므로 앱의 오류 경계·라우터 오류 처리에서 기존 ErrorState를 렌더링하세요.

## 반복 검증

1. `npm run check`: 타입·포맷·빌드·Node 회귀 검사·문서 빌드.
2. `npm run dev` 후 `/readiness.html`: 브라우저에서 입력/범위/탭/그리드/토스트/저장 실패/일부 실패 검사를 자동 실행하며 PASS/FAIL을 표시합니다. 이 페이지는 배포 문서의 진입점에 포함되지 않습니다.
3. 실무 상태 카탈로그를 390px와 데스크톱에서 확인하고 키보드로 조작합니다. 실제 운영체제 IME, 스크린 리더와 다른 브라우저의 전수 인증을 대신하지 않습니다.

Playwright 환경에서는 `npm run test:browser -- tests/browser/readiness.spec.ts`로 위 회귀 페이지, 라우팅 취소와 모바일 배치 검사를 반복할 수 있습니다.

### 2026-09-09 검증 결과

- `npm run check` 통과: UX 라이팅·타입·포맷, Node 검사 50개, 라이브러리·문서 빌드.
- Chromium·Firefox·WebKit에서 readiness Playwright 검사 각 3개, 총 9개 통과. 각 엔진에서 브라우저 회귀 페이지의 10개 시나리오도 실행했습니다.
- 390px 화면의 가로 넘침·44px 버튼 영역·세로 차트 레이블 배치, 링크와 뒤로 가기 취소 시 초안 보존을 검사했습니다.
- 의미 검토: 추가한 예제의 버튼과 실제 동작, 실패 후 입력 보존·재시도, 로컬 전송 모사 안내가 일치하는지 확인했습니다.
- 실제 OS 한글 입력기·스크린 리더 조합은 미검증입니다. IME 검사는 합성 이벤트 수준이며 접근성 전수 인증은 아닙니다. 문서 빌드는 메인 청크 크기 권고 경고가 남지만 성공합니다.
