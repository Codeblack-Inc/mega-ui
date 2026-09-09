# DiagramEditor

`DiagramEditor`는 노드·포트·연결을 그리고 편집하는 제어형 다이어그램 편집기입니다.
`@mega-ui/react`와 기본 `styles.css`에서 제공합니다. 추가 엔진 의존성은 없고 캔버스는 SVG로 그립니다.
기존 `OrganizationChart`는 계층 목록 표시용으로 그대로 유지합니다.

```tsx
import { useState } from 'react';
import { DiagramEditor, type DiagramInput } from '@mega-ui/react';
import '@mega-ui/react/styles.css';

const initial: DiagramInput = {
  version: 1,
  nodes: [
    {
      id: 'intake',
      title: '주문 접수',
      type: '시작',
      x: 40,
      y: 40,
      width: 176,
      height: 64,
    },
    {
      id: 'check',
      title: '재고 확인',
      type: '작업',
      x: 296,
      y: 40,
      width: 176,
      height: 64,
    },
  ],
  edges: [
    {
      id: 'e1',
      fromNode: 'intake',
      fromPort: 'out',
      toNode: 'check',
      toPort: 'in',
    },
  ],
};
function Flow() {
  const [value, setValue] = useState(initial);
  return (
    <DiagramEditor value={value} onChange={setValue} label="주문 처리 흐름" />
  );
}
```

## API

| prop                     | 계약                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `value`                  | 필수 `DiagramInput`. 원본을 변경하지 않음. 노드의 `ports`를 생략하면 좌측 입력·우측 출력을 채움                    |
| `onChange(next, action)` | 편집·이동·연결·삭제·실행 취소·복원의 결과는 항상 포트를 채운 `DiagramData`. 생략 시 읽기 전용                      |
| `onSave(snapshot)`       | 선택적 비동기 저장. resolve를 저장 확정으로 간주. 실패 시 현재 내용 유지. 실제 서버/브라우저 저장은 소비 앱이 수행 |
| `label`                  | 영역 이름·도구 제목. 기본 다이어그램                                                                               |
| `editable`               | 기본 true. false는 편집을 끄고 이동·확대·선택만 제공                                                               |
| `showTools`              | 기본 true. 상단 추가/배치/저장/파일 도구 표시                                                                      |
| `grid`                   | 격자 간격이자 스냅 단위. 기본 16, 0이면 스냅하지 않음                                                              |
| `nodeTypes`              | 추가 버튼 팔레트. `{type, title, width?, height?, ports?}`. 생략하면 `새 노드` 하나                                |
| 네이티브 div 속성        | ref·className·style·id·이벤트 전달. children/onChange 제외. 영역 role·이름은 편집기가 지정                         |

`DiagramData`는 `version: 1`, `nodes`, `edges`와 선택적 `rules`로 구성합니다.

- `nodes`: `{id, title, type?, x, y, width, height, notes?, ports}`. 좌표는 확대율과 무관한 다이어그램 단위입니다.
- `ports`: `{id, title, side, direction, limit?}`. `side`는 top·right·bottom·left, `direction`은 in·out입니다.
  같은 변의 포트는 순서대로 균등 배치합니다. 생략하면 `defaultDiagramPorts()`가 채웁니다.
- `edges`: `{id, fromNode, fromPort, toNode, toPort, label?, shape?}`. `shape`는 `orthogonal`(기본) 또는 `straight`입니다.
- `rules`: `{from, to}` 노드 종류 쌍의 허용 목록입니다. 비어 있으면 모든 조합을 허용합니다.

이름·ID는 최대 200 UTF-16 단위이며 공백만인 값은 거부합니다. 메모는 5,000자, 종류·포트 ID는 50자입니다.
노드 300개·연결 600개·노드당 포트 8개·직렬화된 JSON 2백만 자가 상한입니다.
좌표는 ±100,000, 노드 크기는 40~2,000입니다.

## 연결 제약

`validateDiagram`과 `diagramConnectionError`가 같은 규칙을 사용합니다.

- 출력 포트에서 입력 포트로만 연결합니다.
- 같은 노드끼리는 연결하지 않습니다.
- 같은 두 포트를 두 번 연결하지 않습니다.
- 포트의 `limit`을 넘는 연결은 거부합니다.
- `rules`가 있으면 허용한 종류 조합만 연결합니다.

화면에서 연결을 놓을 때는 `diagramConnectionError`로 먼저 확인하고, 거부한 이유를 그대로 안내합니다.
`updateDiagram`도 같은 검증을 거치므로 파일 반입이나 프로그램 편집에서도 규칙이 유지됩니다.

## 변경과 검증

`validateDiagram(unknown)`은 검증 후 알려진 필드만 복사한 데이터를 반환합니다.
`updateDiagram(value, action)`은 같은 검증을 사용하는 순수 함수입니다. 실패 시 예외를 던지며 원본은 유지됩니다.

`DiagramAction`:

- `put-node {node}`, `delete-node {id}`: 노드를 지우면 연결된 선도 함께 지웁니다.
- `place-nodes {positions}`: 여러 노드의 좌표를 한 번에 지정합니다. 드래그와 자동 배치가 사용합니다.
- `put-edge {edge}`, `delete-edge {id}`

put은 같은 ID가 있으면 편집하고 없으면 추가합니다. 파일 교체·실행 취소의 onChange는 `{type: 'replace'}`를 전달합니다.

`layoutDiagram(data, options?)`은 좌→우 계층 배치를 계산해 `{id, x, y}` 목록을 돌려줍니다.
순환은 배치 계산에서만 끊고 데이터는 그대로 둡니다. 계층은 최장 경로, 같은 계층의 순서는 선행 노드 평균 위치로 정합니다.
`diagramEdgePath`는 포트의 바깥 방향으로 나갔다가 들어오는 직각 경로를 만듭니다. 뒤에 있는 노드로 갈 때는 두 행 사이 통로로 우회합니다.
**노드를 피해 가는 경로 계산은 하지 않습니다.** 겹치는 배치에서는 자동 배치나 노드 이동으로 정리하세요.

## 조작·접근성

- 노드를 끌어 옮기고, 여러 노드를 선택하면 함께 움직입니다. 이동은 `grid` 단위로 스냅합니다.
- 출력 포트에서 끌어 입력 포트나 노드 위에 놓으면 연결합니다. 노드 위에 놓으면 첫 입력 포트를 사용합니다.
  Escape·창 포커스 이탈·pointercancel은 연결을 취소합니다.
- 빈 곳을 끌면 사각형으로 여러 노드를 선택하고, Shift/⌘를 누르면 선택에 더합니다. Alt+드래그나 가운데 버튼은 화면을 옮깁니다.
- Ctrl/⌘+휠은 커서 기준 확대·축소, 휠은 상하좌우 이동입니다. 확대 버튼과 `전체 맞추기`, 미니맵 클릭도 같은 화면 이동을 제공합니다.
  처음 열 때 내용이 화면보다 크면 전체가 보이도록 축소합니다.
- Tab으로 노드와 연결을 차례로 포커스하고, 포커스한 항목은 선택됩니다.
  방향키는 선택한 노드를 격자만큼, Shift+방향키는 1씩 옮깁니다. 선택이 없으면 화면을 이동합니다.
  Delete/Backspace는 선택을 삭제하고, 연결이 있는 노드는 확인 화면을 거칩니다. Ctrl/⌘+A는 전체 노드를 선택합니다.
- Ctrl/Meta+Z, Shift+Ctrl/Meta+Z는 입력 필드 밖에서 실행 취소·다시 실행을 수행합니다. 기록은 최대 50회입니다.
- 오른쪽 편집 패널에서 이름·종류·메모와 연결 라벨·모양을 바꿉니다. 텍스트는 포커스를 떠날 때 반영해 실행 취소 기록이 한 번에 남습니다.
- 노드와 연결은 접근 가능한 이름에 제목·종류·연결 방향을 담습니다. 다크·모바일·긴 문구를 기본 토큰으로 처리합니다.

## 저장·복원과 내보내기

`onSave`가 있으면 저장 버튼을 제공합니다. 처음 입력은 기준 상태이며 실제 저장을 했다고 표시하지 않습니다.
저장 호출은 중복 실행하지 않고, 실패하면 내용과 실행 취소 기록을 유지합니다.
처음/저장한 상태로 되돌리기와 파일 교체는 현재 다이어그램 전체를 바꾸므로 적용 확인 화면을 제공합니다.

`serializeDiagram(data)`와 `parseDiagram(json)`으로 노드·포트·연결·규칙을 버전 1 JSON으로 왕복합니다.
파일 입력은 최대 8MB이며 파싱·검증에 실패하면 현재 다이어그램에 적용하지 않습니다.
`SVG 내려받기`는 화면의 캔버스를 그대로 파일로 만듭니다. 격자·선택 사각형·연결 미리보기는 빼고,
현재 테마에서 계산한 색을 각 요소에 인라인으로 넣으며, 내용 범위에 맞춘 `viewBox`를 지정합니다.
PNG 변환, 이미지 서식 지원, 폰트 임베딩은 제공하지 않습니다.

## 검증 범위

- `tests/diagram.test.mjs`: 포트 기본값·연결 제약(방향·자기 연결·중복·제한·종류 규칙)·노드 삭제 시 연결 정리·
  좌표 일괄 이동·상한과 참조 검증·포트 좌표와 직각 경로·순환이 있는 자동 배치·JSON 왕복.
- `tests/browser/diagram.spec.ts`: 실제 포인터 연결과 거부 안내, 노드 드래그와 격자 스냅, 사각형 선택,
  키보드 이동, 확인 후 삭제와 실행 취소, 노드 추가·자동 배치·확대·전체 맞추기,
  JSON·SVG 내려받기와 반입, 저장 실패/재시도·재열기, 다크 390px 레이아웃과 미니맵.
- 성능 기준: 노드 60개·연결 59개의 예제 전환 후 DOM 표시 1,500ms 미만. 브라우저 개발 서버에서 측정하며
  최초 네트워크 로딩은 포함하지 않습니다. 최대 300노드를 지원하고 가상화는 하지 않습니다.
- 실제 스크린 리더 낭독, 모바일 하드웨어 터치, OS IME 조합 입력은 수동 검증하지 않았습니다.

### 실행 기록 · 2026-09-09

Node 24.18.0, macOS arm64, Playwright의 Chromium·Firefox·WebKit, Vite 개발 서버, 2 workers.
노드 60개 예제 전환은 Chromium 59ms, Firefox 59ms, WebKit 44ms였습니다.
통계적 벤치마크나 실제 기기 성능 보장은 아닙니다.
라이트/다크 1440px과 다크 390px 화면에서 캔버스·미니맵·편집 패널과 문구를 동작과 대조했습니다.
