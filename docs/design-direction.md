# 디자인 방향 · 토스 실측 기준

> 새 컴포넌트의 필수 규칙과 현재 준수 현황은 [디자인 계약](./design-contract.md)을 기준으로 합니다. 이 문서는 기존 구현의 상세 수치와 배경을 설명합니다.

Mega UI의 색·치수·타입 스케일은 토스 웹 제품(토스페이먼츠 대시보드의 TDS 변수, 토스증권, 토스 모바일 웹)에서
**실측한 값**을 기준으로 맞췄습니다. 눈대중으로 비슷하게 만든 것이 아니라, 실제 렌더된 값을 재서 옮겼습니다.

공식 TDS 패키지를 사용하거나 비공개 토스 서비스의 컴포넌트를 재현한 구현은 아닙니다.
API 이름, props, 클래스 이름은 모두 Mega UI의 것이며 TDS와 호환되지 않습니다.
토스의 로고나 그래픽 자산은 사용하지 않고, 예제 데이터도 전부 가상입니다.

## 토큰 구조

TDS와 같은 3층 구조입니다. 자세한 목록은 [시작하기](./getting-started.md)에 있습니다.

- **기본 팔레트**: 테마마다 값이 바뀌는 원색. 회색 `--mega-grey-50` – `--mega-grey-900`과 같은 밝기의 알파 스케일
  `--mega-grey-a50` – `--mega-grey-a900`, 그리고 blue / red / green / yellow / teal / purple 계열.
  알파 회색을 따로 둔 이유는 카드·시트 위에 겹쳐도 아래 배경이 비쳐 위계가 유지되기 때문입니다.
- **표면**: `--mega-bg`, `--mega-surface`, `--mega-surface-raised`, `--mega-dim`, `--mega-shadow-color`.
  라이트에서 배경은 `#f2f4f7`, 표면은 흰색입니다. 다크에서는 `#17171c` / `#202025` / `#2a2b31`입니다.
- **시맨틱**: 테마와 무관한 이름. 컴포넌트 SCSS는 이 층만 읽습니다.

다크는 기본 팔레트를 통째로 교체하는 방식이고, `--mega-warning-fill`·`--mega-up`·`--mega-down` 세 개만
더 밝은 단계로 다시 가리킵니다.

## 색

- 브랜드 블루는 `#3182f6`(`--mega-blue-600`)입니다. hover/press는 밝기 필터가 아니라 `#2272eb` 단계로 내려갑니다.
- 상태 문자색은 red `#de2b39` / green `#009467` / yellow `#c95c00` / teal `#288a8a` / purple `#9d2aff`이고,
  채움색은 한 단계 밝은 `#ef3341` / `#1f9d6f` / `#ffbc46`입니다.
  각 계열에는 옅은 배경용 알파 단계(`-a100`, `-a200`)가 있어 tinted 배지·알림에 사용합니다.
- 시세는 한국 관행대로 **상승 빨강 · 하락 파랑**입니다(`--mega-up` / `--mega-down`).
- 문자 위계는 알파 회색으로 표현합니다. 본문 89%, 보조 77%, 부가 61%, placeholder 47%, disabled 30%.

### 의도적인 대비 예외

토스 실측값이라 일부 조합은 WCAG AA(4.5:1)에 못 미칩니다.
부가 문자 `--mega-muted`는 약 61% 알파 회색으로 흰 배경에서 약 4.2:1이고,
흰 글자 + `#3182f6` primary 버튼은 약 3.7:1입니다.
"토스와 같은 색"과 "AA 통과"가 충돌하는 지점이라, 라이브러리는 전자를 택하고 후자를 재정의로 넘겼습니다.
엄격한 AA가 필요하면 `--mega-muted`와 `--mega-brand`를 더 진한 값으로 덮으세요.

## 형태

반지름 사다리는 6 / 8 / 10 / 12 / 16 / 20 / 24 / full입니다. 요소가 클수록 반지름이 큽니다.
Badge 6 → Button md 8 → Input 10 → Alert·Menu·Toast 12 → Card sm 16 → Card·Dialog 20 → Card lg 24.

그림자는 TDS의 xsmall/small/medium/large에 대응하는 4단계입니다.
`--mega-shadow-xs`(1px)와 `sm`(2px)은 카드용, `md`(40px blur)와 `lg`(80px blur)는 떠 있는 레이어용입니다.
그림자 색은 검정 알파가 아니라 푸른기가 도는 회색 알파(`--mega-grey-a200`)입니다.

## 컨트롤 사다리

버튼 높이는 TDS PC 사다리 그대로 **24 / 28 / 34 / 40**px에, 모바일 CTA용 **56**px을 더한 5단계입니다.

| size | 높이 | 폰트 | 반지름 | 쓰는 곳                 |
| ---- | ---- | ---- | ------ | ----------------------- |
| xs   | 24   | 12   | 6      | 테이블 셀 안, 정렬 헤더 |
| sm   | 28   | 14   | 7      | 툴바, 필터 줄           |
| md   | 34   | 15   | 8      | 데스크톱 기본           |
| lg   | 40   | 17   | 10     | 강조 액션, 폼 제출      |
| xl   | 56   | 17   | 16     | 모바일 하단 CTA         |

같은 사다리를 IconButton(28/34/40)과 Input(sm 34 / md 40 / lg 48)이 공유합니다.
`variant="box"` 입력만 모바일 전용으로 56px 회색 박스입니다.
모든 variant는 밝기 필터 대신 같은 hover/press 오버레이를 겹칩니다.

Chip은 md 28px / 13px / r7, sm 24px / 12px / r6입니다.
Switch는 트랙 28px에 노브 22px, SegmentedControl은 3px 안쪽 여백에 흰색 선택 알약과 옅은 그림자입니다.
Checkbox는 24px 원형이 기본이고, 폼용 사각형은 `shape="square"`로 바꿉니다.

## 타입 역할

TDS의 title t1–t5, body 역할을 그대로 옮겼습니다. 굵기는 400/500/600/700만 사용합니다(가변 폰트라도 800은 쓰지 않습니다).

| 역할        | 크기                 | 행간 | 자간    |
| ----------- | -------------------- | ---- | ------- |
| Heading 2xl | clamp(28, 3.5vw, 30) | 1.3  | -0.02em |
| Heading xl  | 26                   | 1.35 | -0.01em |
| Heading lg  | 22                   | 1.45 | -0.01em |
| Heading md  | 20                   | 1.45 | -0.01em |
| Heading sm  | 17                   | 1.45 | -0.01em |
| Text lg     | 17                   | 1.53 | —       |
| Text md     | 15                   | 1.47 | —       |
| Text sm     | 14                   | 1.43 | —       |
| Text xs     | 13                   | 1.45 | —       |

Heading은 항상 700입니다. 본문 15px, 캡션 13px이 기본 조합이고, 숫자에는 `numeric`으로 tabular-nums를 켭니다.

## 화면 요소 실측치

- **Table**: 헤더 41px / 13px / 500 굵기 / `--mega-fill-solid` 배경, 셀 52px(compact 40px) / 14px.
  숫자 열은 tabular-nums에 우측 정렬이고, 상승·하락 색은 시세 토큰을 씁니다.
- **Tabs**: 항목 14px에 8×12px 여백, `size="lg"`는 16px. underline은 선택 항목 아래 2px 브랜드 선,
  pill은 36px 높이에 반지름 10px 알약입니다.
- **SideNav**: 항목 36px / 15px, 섹션 제목 13px muted, 활성 항목은 fill 배경에 text-strong. **NavRail**: 항목 56px에 24px 아이콘과 11px 캡션.
- **TopBar**: 높이 60px, 좌우 24px 여백, 링크 36px.
- **Dialog**: 최대 너비 400 / 560 / 800px, 반지름 20px, `--mega-shadow-lg`. 600px 이하에서 `sheet`는 하단에 붙습니다.
- **Stat**: 값 20 / 24 / 28px 굵기 700, 라벨 13px muted, 변화율 12px에 삼각형 아이콘.
- **Amount**: 14 / 16 / 20 / 26px. `원` 단위만 0.85em으로 살짝 줄여 숫자를 돋보이게 합니다.

## 접근성 처리

- Checkbox·Switch·SegmentedControl은 reduced-motion에서 전환을 끄고, 강제 색상 모드에서는 네이티브 표시나 시스템 색 외곽선으로 대체합니다.
- 포커스 링은 브랜드색 2px outline에 2px offset으로 통일했습니다.
- Tabs는 WAI-ARIA 자동 활성화, Menu는 ↓/↑ 이동과 Escape 복귀, Dialog는 네이티브 `showModal()`의 포커스 트랩을 씁니다.
- 아이콘은 전부 `aria-hidden`이고, 이름은 `label` prop으로 따로 받습니다.

## 예제 화면

자산 홈은 카드·계좌 리스트·기간 선택·진행률을, 결제 화면은 수단 선택·입력·동의·CTA·완료 화면을,
설정 화면은 입력과 네이티브 스위치를 조합합니다.
어드민 대시보드는 NavRail·SideNav·TopBar·Table·Stat을, 증권 홈은 Tabs·Amount·시세 색을 사용합니다.
모든 예제는 가상 데이터이며 실제 거래나 API 요청은 없습니다.

## 참고

수치는 공개된 토스 웹 제품에서 실측한 값이며, 비공개 문서나 내부 자료를 옮긴 것이 아닙니다.
색상·치수·API의 완전한 호환은 보장하지 않고, 토스가 제품을 바꾸면 이 값들도 다시 재야 합니다.
