# Mega UI

회사 웹을 **컴포넌트 조합으로 만드는** React UI 라이브러리입니다.
React 19 · TypeScript · SCSS · Vite. 레이아웃부터 테이블·다이얼로그·내비게이션까지 83개 export를 제공하며,
색·치수·타입 스케일은 토스 웹 제품에서 실측한 값에 맞췄습니다. Tailwind, CSS-in-JS, 별도 상태 관리, 모노레포 도구를 사용하지 않습니다.

## 실행

Node.js 22.12 이상이 필요합니다. Node 22 LTS 환경을 권장합니다.

```sh
npm ci
npm run dev
```

터미널에 표시된 주소에서 컴포넌트 카탈로그, 27종 폼 컴포넌트 체험 화면과 5개 화면 예제(자산 홈, 설정, 결제, 어드민 대시보드, 증권 홈), 그리고 소스 코드를 확인합니다.

```sh
npm run check       # 타입, 포맷, 빌드 결과 테스트, 문서 사이트 빌드
npm run build       # dist/: ESM + 타입 선언 + styles.css
npm run build:docs  # site/: 정적 예제 사이트 + AI 문서
npm run preview    # 빌드한 예제 사이트 확인
npm run format
node examples/check-forms.mjs http://localhost:5173 # 개발 서버 실행 후 폼 브라우저 검증
npm pack           # 실제 소비 프로젝트에서 검증할 로컬 패키지
```

## 다른 프로젝트에서 사용

현재 npm에 게시하지 않았습니다. `npm pack`으로 생성한 tgz를 소비 프로젝트에서 설치합니다.
패키지 이름은 임시로 `@mega-ui/react`이며, 사내 레지스트리와 배포 정책을 정하기 전까지 `private: true`로 둡니다.

```sh
npm install /absolute/path/to/mega-ui-react-0.1.0.tgz
```

```tsx
import { Button, Card, Container, Heading, Stack, Text } from '@mega-ui/react';
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
}
```

기본 서체는 SUIT이며 IBM Plex Sans KR로 대체합니다. 폰트 파일은 번들하지 않으므로 소비 앱에서 직접 불러오세요.
불러오는 방법은 [시작하기](docs/getting-started.md)의 폰트 절에 있습니다.

React와 React DOM은 peer dependency로 외부화합니다. 라이브러리 자체의 추가 런타임 의존성은 없습니다.
ESM만 제공하며, React 19를 지원 대상으로 시작합니다. React 18과 CommonJS는 현재 지원 대상으로 검증하지 않았습니다.

## 구조와 선택

```text
src/components/     레이아웃, 타이포그래피, 컨트롤, 표면, 패턴, 내비게이션, 오버레이, 데이터
src/styles/         SCSS 파트와 CSS 변수 토큰
examples/           실제 컴포넌트를 사용하는 Vite 예제 사이트
docs/               사람과 AI가 함께 읽는 Markdown 문서
tests/              빌드 산출물에 대한 Node 기본 테스트
```

- **SCSS + CSS 변수**: SCSS로 스타일을 분리하고, `--mega-*` 변수로 브랜드와 테마를 변경합니다. 소비 앱에 Sass 설치는 필요 없습니다.
- **단일 패키지**: 현재는 라이브러리와 문서 사이트만 있어 npm 하나로 관리합니다. 독립 배포 단위가 생기면 workspace를 도입합니다.
- **조합 우선**: 레이아웃 → 기본 컴포넌트 → 반복 패턴 → 화면 예제로 확장합니다. 모든 화면을 하나의 거대한 설정 객체로 표현하지 않습니다.
- **브라우저 기본 동작**: 폼은 네이티브 요소, 모달은 네이티브 `<dialog>`의 `showModal()`을 사용합니다. Combobox나 위치 계산이 필요한 Popover를 만들 때 primitive 도입을 다시 판단합니다.
- **문서 우선 AI 지원**: `llms.txt`는 문서 인덱스이며 MCP 서버가 아닙니다. 현재 가이드로 사용법을 전달하고, 실제 검색/조회 수요가 생기면 같은 문서를 제공하는 MCP를 추가합니다.

## 문서

- [시작하기 / 테마 / SSR](docs/getting-started.md)
- [전체 컴포넌트 API](docs/components.md)
- [AI 코드 작성 가이드](docs/ai-guide.md)
- [확장 로드맵 및 완료 기준](docs/roadmap.md)
- [AI 문서 인덱스](docs/llms.txt)

현재 83개 export와 5개 화면 예제를 제공합니다. Combobox, Drawer 같은 남은 컴포넌트와 MCP 서버, 레지스트리 게시, 브라우저 접근성 전수 검증은 아직 진행 중입니다.

빌드 설정 참고: [Vite library mode](https://vite.dev/guide/build.html#library-mode), [Sass CSS 변수와 Sass 변수의 차이](https://sass-lang.com/documentation/variables/).

실측 기준과 토큰·치수 사다리는 [디자인 방향](docs/design-direction.md)에 정리했습니다. 공식 TDS 패키지나 API 호환 구현은 아닙니다.
