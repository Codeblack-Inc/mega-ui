# Mega UI를 사용하는 AI를 위한 가이드

대상 버전: 0.1.0. 먼저 `components.md`의 실제 export와 props를 확인하세요.
이 문서는 패키지 내부 `docs/ai-guide.md`와 예제 사이트 `/ai-guide.md`에서 제공합니다.

## 생성 규칙

1. `@mega-ui/react`의 공개 named export만 사용합니다. 내부 dist 경로를 import하지 않습니다.
2. 앱 진입점에 `import '@mega-ui/react/styles.css'`를 한 번 추가합니다.
3. Container → PageHeader → Stack/Grid → Card → 기본 UI 순서로 조합합니다.
4. 간격은 gap 0–8 토큰, 표면/문자/상태는 문서화된 variant/tone을 사용합니다.
5. 반복되는 디자인에 임의의 CSS를 추가하기 전에 기존 컴포넌트와 CSS 변수로 해결합니다.
6. 의미 있는 main/nav/section/form/table 등 네이티브 HTML은 사용합니다. 모든 DOM을 커스텀 컴포넌트로 바꿀 필요는 없습니다.
7. Tailwind, styled-components, 새로운 UI 라이브러리를 자동 도입하지 않습니다.
8. 문서에 없는 props나 컴포넌트를 만들어 호출하지 않습니다. 부족한 기능은 명시하고 구현을 제안합니다.
9. 서버 요청, 인증, 폼 상태, 라우팅은 소비 앱에서 담당합니다.
10. aria 연결, 키보드 동작, heading 구조, 좁은 화면을 확인합니다.

## 폼 레시피

```tsx
import { Button, Card, Field, Input, Stack } from '@mega-ui/react';

export function ProjectForm() {
  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <Card>
        <Stack gap={5}>
          <Field
            label="프로젝트 이름"
            htmlFor="project-name"
            hint="팀에서 알아볼 수 있는 이름"
            required
          >
            <Input
              id="project-name"
              name="name"
              required
              aria-describedby="project-name-description"
            />
          </Field>
          <Stack direction="row" gap={2}>
            <Button type="submit">만들기</Button>
            <Button type="reset" variant="secondary">
              초기화
            </Button>
          </Stack>
        </Stack>
      </Card>
    </form>
  );
}
```

위 예제는 요청을 보내지 않습니다. 실제 생성/저장은 소비 앱의 검증된 API로 연결합니다.
페이지에서 여러 폼을 렌더링한다면 id가 중복되지 않도록 만듭니다.

## 확장 시 원칙

같은 패턴이 실제 화면에서 반복되면 작은 합성 컴포넌트로 추출합니다.
처음부터 모든 화면을 포괄하는 거대한 configuration API를 만들지 않습니다.
새 public API에는 타입, SCSS, 상태별 예제, 문서, 동작 검증을 함께 추가합니다.
화면을 만들며 필요한 기능이 현재 목록에 없으면 구현 완료 여부를 분명히 구분합니다.

## MCP 지원 상태

현재 MCP 서버는 제공하지 않습니다. 이 가이드와 API 문서가 AI 지원의 첫 단계입니다.
MCP를 추가할 때는 동일 문서를 resources로 노출하고, 컴포넌트 조회/검색 기능부터 시작합니다.
문서와 별도 API 목록을 수작업으로 중복 유지하거나 사용되지 않는 MCP 의존성을 미리 추가하지 않습니다.

## 토스 스타일 조합

목록은 ListRow, 선택은 SegmentedControl, 설정은 Switch, 마지막 행동은 BottomCTA,
결과는 Result로 조합합니다. 이들은 Mega UI API이며 TDS의 as/htmlStyle/variant=fill 같은 props를 사용하지 않습니다.
Button은 primary/weak/secondary/ghost/danger, Card는 elevated/filled/outlined를 지원합니다.
디자인 방향과 공개 참고 자료는 design-direction.md를 참고하세요.
