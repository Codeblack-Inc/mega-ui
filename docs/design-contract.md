# Mega UI 디자인 계약

이 문서는 새 컴포넌트가 따라야 하는 최소 계약입니다. 토스의 시각 언어를 참고하지만 토스의 브랜드·제품 구조·비공개 구현을 복제하지 않습니다.

## 자동 강제

`tests/design.test.mjs`가 모든 `src/styles/*.scss`를 검사하며 CI의 `npm run check`에서 자동 실행됩니다.

- 컴포넌트는 base palette나 색상 리터럴 대신 `--mega-*` 시맨틱 토큰만 사용합니다.
- 참조하는 모든 토큰은 `_tokens.scss`에 정의되어야 합니다.
- 기본 폰트는 Pretendard, 브랜드색은 `#3182f6`, disabled opacity는 `0.3`, pressed overlay는 검정 26%입니다.
- 모션 단계는 120/200/320ms이며 brightness filter, 800·900 weight, shimmer, bounce, overshoot, parallax를 금지합니다.
- 아이콘 데이터 URI처럼 색상 토큰을 쓸 수 없는 구현은 `_icons.scss`에만 둡니다.

UX 라이팅도 디자인 계약입니다. [문구 규칙·컴포넌트별 예시·AI 필수 절차](./ux-writing.md)를 따릅니다.
`npm run lint:ux`와 `tests/ux-writing.test.mjs`가 알려진 금지 표현을 차단하며,
CI의 `npm run check`에서 실행됩니다. 문맥적 적절성은 아래 리뷰와 라이팅 의미 검토로 확인합니다.

## PR 체크리스트

정적 검사로 의미를 판별할 수 없는 규칙은 리뷰에서 확인합니다.

- 한 화면의 primary CTA는 하나이며 버튼 라벨은 결과를 직접 말합니다.
- 제품 설명은 해요체, 버튼은 행동형, 필드·탭은 명사형을 씁니다. 과장·압박·불필요한 감탄사·inline emoji를 피합니다. 작업에 필요한 `입력해 주세요`는 허용합니다.
- 기본 본문은 15px/1.5, 금액·표·실시간 수치는 tabular nums를 씁니다.
- 간격은 4px 리듬, radius는 토큰 사다리, 아이콘은 16/20/24/32와 `currentColor`를 우선합니다.
- 모바일은 단일 컬럼, 44px touch target, BottomCTA safe area, Dialog보다 BottomSheet를 우선합니다.
- 그라디언트는 BottomCTA 보호막, loading highlight, illustration 외에는 추가하지 않습니다.
- 컴포넌트에 접근 가능한 이름, 키보드 조작, focus-visible, reduced-motion 처리를 포함합니다.

## 기존 구현 감사 · 2026-09-09

| 영역                  | 상태 | 결과                                                                                                  |
| --------------------- | ---- | ----------------------------------------------------------------------------------------------------- |
| 폰트·브랜드·시맨틱 색 | 통과 | Pretendard 우선, `#3182f6` 브랜드 alias, 컴포넌트의 base palette 직접 참조 제거                       |
| 숫자·접근성           | 통과 | Amount/Table/Stat tabular nums, 네이티브 폼 의미, focus/reduced-motion/forced-colors 처리             |
| disabled·pressed      | 통과 | 전체 노드 30%, filled button press overlay 26%로 통일                                                 |
| 로딩                  | 부분 | shimmer 제거, 버튼을 3-dot loader로 변경. 라벨 fade와 radial highlight는 아직 없음                    |
| 모션                  | 통과 | 120/200/320ms 토큰화, dialog/sheet는 320ms ease-out 사용. 반복 loader와 1ms 접근성 종료는 예외        |
| 타입 역할             | 부분 | 13/14/15/17 body와 17/20/22/26/28–30 heading 제공. display 40/56과 title 18 역할은 없음               |
| spacing               | 부분 | 4px 기반이지만 현재 public ladder는 4/8/12/16/24/32/48/64이며 20/28/40/80 단계가 없음                 |
| radius                | 부분 | 6/8/10/12/16/20/24/full을 제공. 새 기준의 4/14/32 단계는 없음                                         |
| 모바일 컨트롤         | 부분 | XL 56, box input 56, sheet/safe-area 지원. Button L48/S32, checkbox 22 square, switch 44×26과는 다름  |
| elevation·icon        | 부분 | 모든 shadow는 토큰화됐지만 새 shadow 수치와 완전 일치하지 않음. select data URI는 `currentColor` 불가 |
| 카피·CTA 위계         | 수동 | 금지 표현은 정적 검사로 차단. 행동 일치·해요체·조건 누락 등 의미는 필수 리뷰                          |

부분 항목은 기존 API와 화면 밀도를 바꾸는 변경입니다. 해당 surface를 재설계할 때 계약의 목표값으로 수렴시키고, 단순 토큰 교체로 기존 소비 화면을 깨뜨리지 않습니다.
