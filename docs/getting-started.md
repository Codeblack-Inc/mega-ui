# 시작하기

## 설치와 기본 사용

이 패키지는 아직 레지스트리에 게시되지 않았습니다. 저장소에서 `npm ci && npm pack`을 실행한 뒤,
소비 프로젝트에서 `npm install /absolute/path/to/mega-ui-react-0.1.0.tgz`로 설치하세요.
React 19와 React DOM 19가 필요합니다.

```tsx
import { Container, Grid, Card, Heading, Text } from '@mega-ui/react';
import '@mega-ui/react/styles.css';

export function Overview() {
  return (
    <Container>
      <Grid minItemWidth={240} gap={5}>
        <Card>
          <Heading level={2}>프로젝트</Heading>
          <Text>12개</Text>
        </Card>
        <Card>
          <Heading level={2}>팀원</Heading>
          <Text>48명</Text>
        </Card>
      </Grid>
    </Container>
  );
}
```

## 폰트

기본 서체는 Pretendard입니다. 라이브러리는 폰트 파일을 번들하지 않으므로
소비 앱이 직접 불러옵니다.

```css
--mega-font:
  'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
  'Apple SD Gothic Neo', 'Noto Sans KR', 'Segoe UI', sans-serif;
```

```html
<!-- Pretendard Variable dynamic subset (jsDelivr) -->
<link
  rel="stylesheet"
  crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
/>
```

자체 호스팅이나 npm 패키지(`pretendard`)로 설치해도 동일하게 동작합니다.
라이브러리가 사용하는 굵기는 400/500/600/700입니다.
`--mega-font`를 다른 서체로 바꾸더라도 이 네 굵기는 제공되어야 합니다.

## 스타일과 테마

전역 요소를 초기화하는 CSS reset은 제공하지 않습니다. 소비 앱의 body 여백과 기본 배경은 앱에서 설정합니다.
스타일 선택자는 `mega-` 접두사를 사용합니다. 앱별 변경은 라이브러리 CSS 다음에 불러오는 스타일에서
CSS 변수를 재정의합니다.

### 토큰 3층 구조

TDS와 같은 방식으로 세 층을 나눕니다.

1. **기본 팔레트** — 테마마다 값이 바뀌는 원색입니다. `--mega-grey-50` – `--mega-grey-900`, 같은 밝기의 알파 스케일
   `--mega-grey-a50` – `--mega-grey-a900`, 그리고 `--mega-blue-*`, `--mega-red-*`, `--mega-green-*`, `--mega-yellow-*`,
   `--mega-teal-*`, `--mega-purple-*`. 색상 계열에는 `-a100` 같은 알파 단계도 있습니다.
2. **표면** — 테마에만 존재하는 값입니다. `--mega-bg`, `--mega-surface`, `--mega-surface-raised`,
   `--mega-dim`, `--mega-shadow-color`, `--mega-shadow-color-weak`.
3. **시맨틱** — 테마와 무관하게 이름이 고정되고, 값은 1층을 가리킵니다. 컴포넌트는 이 층만 읽습니다.

| 분류    | 토큰                                                                                                                              |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 문자    | `--mega-text-strong`, `--mega-text`, `--mega-text-secondary`, `--mega-muted`, `--mega-placeholder`, `--mega-text-disabled`        |
| 아이콘  | `--mega-icon`, `--mega-icon-weak`                                                                                                 |
| 채움/선 | `--mega-fill`, `--mega-fill-strong`, `--mega-fill-solid`, `--mega-hover`, `--mega-press`, `--mega-border`, `--mega-border-strong` |
| 컨트롤  | `--mega-control`, `--mega-control-hover`, `--mega-control-strong`, `--mega-knob`                                                  |
| 브랜드  | `--mega-brand`, `--mega-brand-hover`, `--mega-brand-strong`, `--mega-on-brand`, `--mega-brand-soft`, `--mega-brand-soft-hover`    |
| 위험    | `--mega-danger`, `--mega-danger-fill`, `--mega-danger-fill-hover`, `--mega-danger-soft`, `--mega-danger-soft-hover`               |
| 상태    | `--mega-success`, `--mega-success-fill`, `--mega-success-soft`, `--mega-warning`, `--mega-warning-fill`, `--mega-warning-soft`    |
| 보조색  | `--mega-teal`, `--mega-teal-soft`, `--mega-purple`, `--mega-purple-soft`                                                          |
| 시세    | `--mega-up`(상승·빨강), `--mega-down`(하락·파랑)                                                                                  |

형태·그림자·모션·간격은 다음과 같습니다.

- 반지름: `--mega-radius-2xs`(6) · `xs`(8) · `sm`(10) · `md`(12) · `lg`(16) · `xl`(20) · `2xl`(24) · `full`
- 그림자: `--mega-shadow-xs` · `sm` · `md` · `lg`
- 모션: `--mega-ease`, `--mega-duration`(160ms)
- 간격: `--mega-space-0` – `--mega-space-8` = `0 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px`
- 서체: `--mega-font`

`gap={4}`는 4px이 아니라 `--mega-space-4`(16px)입니다.
컴포넌트마다 읽는 반지름 토큰이 다릅니다. Button은 xs→2xs, md→xs, lg→sm, xl→lg(sm만 7px 고정),
Input은 기본 sm, sm→xs, lg→md, `variant="box"`→lg, Card는 xl(padding sm→lg, lg→2xl),
Badge는 2xs, Alert·Menu·Toast는 md, Dialog는 xl입니다.

### 브랜드 바꾸기

기본 팔레트를 덮으면 그 색을 쓰는 시맨틱 토큰이 한 번에 따라옵니다. 특정 역할만 바꾸려면 시맨틱 토큰을 직접 덮습니다.

```css
/* 1) 팔레트 교체: 브랜드 블루 계열 전체가 바뀝니다 */
.company-theme {
  --mega-blue-600: #2458a6;
  --mega-blue-700: #1c4680;
  --mega-blue-a100: rgb(36 88 166 / 9%);
  --mega-blue-a200: rgb(36 88 166 / 14%);
}

/* 2) 역할만 교체: 버튼 채움색만 바꾸고 링크 색은 유지 */
.company-theme {
  --mega-brand: #2458a6;
  --mega-brand-hover: #1c4680;
}
```

```tsx
<div className="company-theme" data-mega-theme="light">
  <Button>브랜드 버튼</Button>
</div>
```

### 다크 테마

`data-mega-theme="dark"`를 지정합니다. 다크는 기본 팔레트를 통째로 교체하는 방식이라 시맨틱 층은 그대로 두고,
예외적으로 `--mega-warning-fill`, `--mega-up`, `--mega-down`만 더 밝은 단계로 다시 가리킵니다.
따라서 팔레트만 바꾸면 라이트/다크가 함께 갱신됩니다.
OS 설정 자동 감지와 선택 저장은 소비 앱의 책임입니다. 테마 루트와 같은 요소에서 브랜드 변수를 덮도록 적용 순서를 유지하세요.

### 대비에 대한 의도적 예외

토스 실측값을 그대로 옮겼기 때문에 일부 조합은 WCAG AA(4.5:1)에 못 미칩니다.
보조 문자 `--mega-muted`는 약 61% 알파 회색(≈4.2:1)이고, 흰 배경 위 `#3182f6` primary 버튼은 약 3.7:1입니다.
엄격한 AA가 필요한 제품은 `--mega-muted`와 `--mega-brand`를 더 진한 값으로 덮어쓰고,
버튼 글자색과 배경색 대비를 직접 측정해 확인하세요.

## 데스크톱 vs 모바일

같은 컴포넌트를 화면 폭에 따라 다르게 조합합니다.

| 상황       | 데스크톱(어드민·대시보드)                | 모바일(앱 내 웹뷰·결제 플로)                        |
| ---------- | ---------------------------------------- | --------------------------------------------------- |
| 입력       | `<Input />` 기본 outline, 40px           | `<Input variant="box" />` 회색 박스, 56px           |
| 주요 버튼  | `<Button size="md" />` 34px, 인라인 배치 | `<Button size="xl" fullWidth />` 56px, BottomCTA 안 |
| 목록       | `Table` + `Pagination`                   | `ListRow` 나열                                      |
| 내비게이션 | `NavRail` + `SideNav` + `TopBar`         | `Tabs` 또는 화면 전환                               |
| 모달       | `<Dialog />` 중앙 정렬                   | `<Dialog sheet />` 하단 시트                        |

`variant="box"`는 크기가 56px로 고정되므로 `size`를 함께 지정하지 않습니다.

## 폼과 접근성

```tsx
<Field label="이메일" htmlFor="email" hint="회사 이메일을 사용하세요." required>
  <Input
    id="email"
    name="email"
    type="email"
    autoComplete="email"
    required
    aria-describedby="email-description"
  />
</Field>
```

Field는 label과 안내문을 렌더링합니다. 자식 요소를 복제하거나 속성을 자동 주입하지 않습니다.
`htmlFor`와 입력의 `id`를 동일하게 설정합니다. hint/error가 있으면 입력의 `aria-describedby`에
`${htmlFor}-description`을 지정하세요. error가 있으면 `aria-invalid`도 설정합니다.
Field의 required는 별표 표시용이며, 실제 입력에도 required를 설정해야 합니다.
오류가 동적으로 발생하면 적절한 포커스 이동이나 live region을 소비 앱에서 설계하세요.

Button의 기본 type은 button입니다. 폼 제출에만 `type="submit"`을 사용하세요.
loading은 중복 클릭을 막지만 요청 상태나 완료 알림까지 관리하지 않습니다.
아이콘만 있는 버튼은 `IconButton`의 `label`로 이름을 붙입니다. 페이지의 h1은 한 개로 구성하세요.

## SSR와 프레임워크

컴포넌트는 렌더 중에 window/document를 참조하지 않습니다. Dialog와 Menu도 DOM 접근이 effect 안에만 있어
서버 렌더링할 수 있습니다. CSS는 소비 앱의 전역 스타일 진입점에서 별도로 불러옵니다.

전역 Provider는 `ToastProvider` 하나뿐이며, `useToast()`를 쓰는 화면보다 위에 한 번 두면 됩니다.
Next.js 등에서 상태/이벤트를 사용하는 화면(Tabs, Dialog, Menu, Toast)은 소비 측 client component 경계 안에 두세요.
테마 선택 스크립트와 스타일 런타임은 제공하지 않습니다.

## 기여 흐름

1. 기존 컴포넌트 조합으로 해결 가능한지 먼저 확인합니다.
2. 필요한 컴포넌트를 `src/components`에 추가하고 props 타입을 공개합니다.
3. `src/styles`에서 `mega-` 클래스와 시맨틱 토큰으로 스타일을 작성합니다. 기본 팔레트를 직접 읽지 않습니다.
4. `src/index.ts`에 public export를 추가합니다.
5. 기본·disabled·오류·키보드 등 해당 상태의 실행 가능한 예제를 만듭니다.
6. components.md와 AI 가이드에 공개 API 및 사용 제약을 반영합니다.
7. `npm run check` 및 브라우저에서 좁은 화면/다크 모드/키보드 동작을 확인합니다.
