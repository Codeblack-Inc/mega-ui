# TextEditor — 첫 구현 범위

`@mega-ui/react/text-editor`의 리치 텍스트 편집기입니다. 전문 Text Editor 목표의 **부분 구현**입니다.
Tiptap 3.31.3의 MIT 엔진을 재사용합니다. React 19 호환 peer 범위를 확인했으며 엔진은 기본 진입점에서 로드하지 않습니다.

```tsx
import {
  TextEditor,
  serializeTextEditorDocument,
} from '@mega-ui/react/text-editor';
import '@mega-ui/react/styles.css';
import '@mega-ui/react/text-editor.css';

<TextEditor
  label="운영 문서 본문"
  onSave={async (document) => {
    const response = await fetch('/api/document', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: serializeTextEditorDocument(document),
    });
    if (!response.ok) throw new Error('Save rejected');
  }}
/>;
```

## API와 상태 소유권

| API                                     | 계약                                                                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label: string`                         | section과 편집 영역의 접근 가능한 이름. 필수입니다.                                                                                                                           |
| `defaultValue?: TextEditorDocument`     | 최초 JSON 문서. 기본은 빈 문단입니다. 편집 상태는 컴포넌트가 소유합니다. 다른 문서 열기·변경 취소는 확인 후 `key`로 재마운트합니다. prop 변경만으로 입력을 덮어쓰지 않습니다. |
| `readOnly?: boolean`                    | 편집·붙여넣기·서식·저장을 막습니다. 전환 중 초안과 undo 이력을 유지합니다. 이미 시작한 저장은 완료될 수 있습니다.                                                             |
| `onChange?(document)`                   | 변경된 JSON 문서 알림. 저장 완료를 의미하지 않습니다. 앱 내부 이동 보호에 연결합니다.                                                                                         |
| `onSave?(document): Promise<void>`      | 전달된 문서를 확정한 뒤 resolve, 실패 시 reject합니다. 없으면 저장 버튼을 제공하지 않습니다.                                                                                  |
| `ref`, `className`, section 속성        | 바깥 section에 전달합니다. ref는 편집기 인스턴스가 아닙니다.                                                                                                                  |
| `serializeTextEditorDocument(document)` | `{ version: 1, document }` JSON 문자열. 스키마와 링크를 검사합니다.                                                                                                           |
| `parseTextEditorDocument(text)`         | 같은 버전의 문서를 검증·정규화합니다. 손상·미지원 노드·위험 링크·크기 초과는 예외를 던집니다.                                                                                 |

`TextEditorDocument`는 Tiptap `JSONContent` 타입입니다. 타입만으로 외부 입력의 유효성을 보장하지 않습니다.
외부 문서는 `parseTextEditorDocument`로 먼저 검사하고 실패하면 원본을 보존하는 오류 화면을 제공합니다.
초깃값 검증 실패는 예외이므로 소비 앱에서 처리해야 합니다. 1,000,000 UTF-16 코드 단위가 저장·불러오기 상한입니다.
초과 입력은 편집 중 잘라내지 않고 저장을 거부하며 현재 화면에 보존합니다.

저장 중 편집을 잠그고 중복 저장을 막습니다. 실패하면 입력과 이력을 지우지 않으며 재시도할 수 있습니다.
성공 안내는 `onSave`가 resolve한 뒤에만 표시합니다. 서버 권한·버전 충돌·원자적 저장은 소비 앱 책임입니다.
미저장 변경에 `beforeunload` 경고를 등록하지만 브라우저 강제 종료·앱 내부 라우팅을 보장하지 않습니다.
자동 초안 보관·협업·서버 연결은 내장하지 않습니다. 저장 전 언마운트하면 입력과 이력이 사라집니다.

## 기능별 상태

| 로드맵 기능                     | 상태와 근거                                                                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 문단·서식·목록·링크·블록        | 구현: 제목(h2/h3 스키마, 툴바 h2), 굵게·기울임·밑줄·취소선, 번호/글머리 목록, 인용·코드 블록. 단축키·입력 규칙은 StarterKit 기본을 사용합니다. 기본 서식·링크 브라우저 회귀 검사를 제공합니다. |
| undo/redo                       | 구현, 버튼 회귀 검사. 저장 뒤에도 이력은 유지하고 재마운트 시 초기화합니다.                                                                                                                    |
| 붙여넣기 정제                   | 부분: 엔진 스키마로 지원 노드·서식만 수용합니다. 스크립트·이벤트 속성·이미지·위험 링크 제거를 회귀 검사합니다. Word 등 모든 외부 서식 보존은 보장하지 않습니다.                                |
| 문서 직렬화·복원·저장 실패 보존 | 구현, 버전 JSON 검증·실패 후 재시도·재열기·취소·저장 용량 실패 검사.                                                                                                                           |
| 한글 IME                        | 부분: ProseMirror 조합 처리 재사용, 합성 조합 이벤트 중 툴바 잠금 검사. 실제 OS 입력기 검증 필요.                                                                                              |
| 표·이미지                       | 미구현. HTML 붙여넣기 시 이미지와 표 구조는 보존하지 않습니다.                                                                                                                                 |
| Markdown 변환                   | 미구현. 일부 Markdown 형태 입력 규칙은 문서 변환 API가 아닙니다.                                                                                                                               |
| 블록 드래그·고급 편집           | 미구현. 일반 텍스트 선택·목록·블록 명령만 제공합니다.                                                                                                                                          |

링크는 공백·제어문자가 없는 절대 `http:`, `https:`, `mailto:`, `tel:` 주소만 허용합니다.
선택한 글자에 링크를 적용하며 링크 클릭으로 편집기 밖을 열지 않습니다. 상대 주소·커스텀 스킴·이미지 URL은 지원하지 않습니다.
JSON은 스키마 밖 속성을 보존하지 않을 수 있습니다. 원본 HTML을 보관하거나 임의 HTML 렌더링에 쓰는 API가 아닙니다.

## 예제와 검증

`/#text-editor?full=1`: 운영 문서 편집 → 브라우저 저장 → 새로고침 → 복원 흐름입니다.
저장 실패 시뮬레이션, 읽기 전용 전환, 확인 후 변경 취소를 제공합니다.
손상된 보관 자료는 자동 삭제·덮어쓰기하지 않습니다. 서버에 저장하는 예제가 아닙니다.

```sh
npm run check
npm run test:browser -- tests/browser/text-editor.spec.ts
```

성능 사전 기준: 1,000문단(각 약 40자)의 재열기부터 표시까지 3초 이내, 마지막 문단 접근·입력 표시까지 3초 이내.
개발 서버·Playwright 측정값은 회귀 참고값이며 대형 문서·장시간 편집의 성능 보장은 아닙니다.
실제 OS IME·스크린 리더·터치 입력·실제 서버 저장은 미검증입니다.

엔진 근거: [React 설치](https://tiptap.dev/docs/editor/getting-started/install/react),
[StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit),
[링크 검증](https://tiptap.dev/docs/editor/extensions/marks/link),
[MIT 라이선스](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md).
