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

## 스타일과 테마

전역 요소를 초기화하는 CSS reset은 제공하지 않습니다. 소비 앱의 body 여백과 기본 배경은 앱에서 설정합니다.
스타일 선택자는 `mega-` 접두사를 사용합니다. 레이아웃 및 컴포넌트 내부 스타일은 SCSS에서 관리합니다.
앱별 변경은 라이브러리 CSS 다음에 불러오는 스타일에서 CSS 변수를 재정의합니다.

```css
.company-theme {
  --mega-brand: #2458a6;
  --mega-on-brand: #ffffff;
  --mega-brand-soft: #edf2ff;
  --mega-radius: 12px;
}
```

```tsx
<div className="company-theme" data-mega-theme="light">
  <Button>브랜드 버튼</Button>
</div>
```

`data-mega-theme="dark"`로 다크 테마를 선택합니다. OS 설정 자동 감지나 저장은 소비 앱의 책임입니다.
테마 루트가 같은 요소에서 브랜드 변수를 덮어쓰도록 적용 순서를 유지하세요.
색상 변경 시 버튼 글자색과 배경색의 대비도 함께 확인하세요.

간격 토큰: `0=0`, `1=4px`, `2=8px`, `3=12px`, `4=16px`, `5=24px`, `6=32px`, `7=48px`, `8=64px`.
`gap={4}`는 4px이 아니라 16px입니다. 필요하면 `--mega-space-*` 값을 재정의합니다.

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
아이콘만 있는 버튼에는 aria-label이 필요합니다. 페이지의 h1은 한 개로 구성하세요.

## SSR와 프레임워크

라이브러리 컴포넌트는 window/document를 참조하지 않아 서버 렌더링할 수 있습니다.
CSS는 소비 앱의 전역 스타일 진입점에서 별도로 불러옵니다.
Next.js 등에서 상태/이벤트를 사용하는 화면은 소비 측 client component 경계 안에서 구성하세요.
초기 라이브러리에는 전역 Provider, 테마 스크립트, 스타일 런타임이 없습니다.

## 기여 흐름

1. 기존 컴포넌트 조합으로 해결 가능한지 먼저 확인합니다.
2. 필요한 컴포넌트를 `src/components`에 추가하고 props 타입을 공개합니다.
3. `src/styles`에서 `mega-` 클래스와 토큰으로 스타일을 작성합니다.
4. `src/index.ts`에 public export를 추가합니다.
5. 기본·disabled·오류·키보드 등 해당 상태의 실행 가능한 예제를 만듭니다.
6. components.md와 AI 가이드에 공개 API 및 사용 제약을 반영합니다.
7. `npm run check` 및 브라우저에서 좁은 화면/다크 모드/키보드 동작을 확인합니다.
