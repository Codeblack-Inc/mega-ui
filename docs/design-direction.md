# 디자인 방향 · Toss-inspired

토스의 공개 디자인 시스템과 서비스 패턴을 참고해 Mega UI를 재구성했습니다.
공식 TDS 패키지를 사용하거나 비공개 토스 서비스의 전체 컴포넌트를 재현한 구현은 아닙니다.
API는 Mega UI의 공개 인터페이스를 사용합니다.

## 이번에 적용한 기준

- 블루 계열 주요 액션, 회색 정보 위계, 옅은 상태 배경을 사용합니다.
- 작은 텍스트의 대비를 위해 액션 색상은 `--mega-brand-strong`으로 분리했습니다.
- 둥근 카드, 채워진 입력창, 충분한 행 높이와 여백으로 화면을 구성합니다.
- ListRow의 좌측 시각 요소, 제목/설명, 우측 액션을 조합합니다.
- Button은 primary/weak/secondary로 시각적 중요도를 나눕니다.
- 하단 CTA와 완료 화면을 분리해 다음 행동과 결과를 알려줍니다.
- 실제 토스 로고나 그래픽 자산 대신 Mega UI의 이름과 예제용 아이콘을 사용합니다.

## 예제

자산 홈은 카드, 계좌 리스트, 기간 선택과 진행률을 조합합니다.
결제 화면은 결제 수단 선택, 입력, 동의, CTA, 완료 화면으로 구성합니다.
설정 화면은 입력과 네이티브 스위치를 조합합니다. 모든 예제는 가상의 데이터이며 실제 거래/API 요청은 없습니다.

## 참고 자료

- [TDS Button](https://tossmini-docs.toss.im/tds-mobile/components/button/): 주요 액션과 보조 액션의 강도 구분.
- [TDS ListRow 구성](https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/): 행의 좌측·본문·우측 영역을 조합하는 방식.
- [TDS BottomCTA](https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/Single/): 하단 주요 액션과 안전 영역.
- [토스페이먼츠](https://www.tosspayments.com/): 결제 서비스의 화면 구성 맥락.
- [토스 컬러 시스템 업데이트](https://toss.tech/article/43385): 테마와 접근성을 고려한 컬러 토큰 설계.

위 자료는 디자인 방향의 참고이며 색상/치수/API의 완전한 호환을 보장하지 않습니다.
