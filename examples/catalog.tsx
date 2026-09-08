import type { ComponentType } from 'react';
import { FoundationCategory, foundationNames } from './categories/foundation';
import { ControlsCategory, controlNames } from './categories/controls';
import { InputsCategory, inputNames } from './categories/inputs';
import { SurfacesCategory, surfaceNames } from './categories/surfaces';
import { NavigationCategory, navigationNames } from './categories/navigation';
import { OverlayCategory, overlayNames } from './categories/overlay';
import { DataCategory, dataNames } from './categories/data';
import foundationSource from './categories/foundation.tsx?raw';
import controlsSource from './categories/controls.tsx?raw';
import inputsSource from './categories/inputs.tsx?raw';
import surfacesSource from './categories/surfaces.tsx?raw';
import navigationSource from './categories/navigation.tsx?raw';
import overlaySource from './categories/overlay.tsx?raw';
import dataSource from './categories/data.tsx?raw';
import {
  ExtendedFoundationCategory,
  extendedFoundationNames,
} from './categories/extended-foundation';
import extendedFoundationSource from './categories/extended-foundation.tsx?raw';
import {
  ContentMediaCategory,
  contentMediaNames,
} from './categories/content-media';
import contentMediaSource from './categories/content-media.tsx?raw';
import {
  ExtendedNavigationCategory,
  extendedNavigationNames,
} from './categories/extended-navigation';
import extendedNavigationSource from './categories/extended-navigation.tsx?raw';
import {
  ExtendedInputsCategory,
  extendedInputNames,
} from './categories/extended-inputs';
import extendedInputsSource from './categories/extended-inputs.tsx?raw';
import { EnterpriseCategory, enterpriseNames } from './categories/enterprise';
import enterpriseSource from './categories/enterprise.tsx?raw';

export interface Category {
  key: string;
  label: string;
  description: string;
  names: readonly string[];
  Component: ComponentType;
  source: string;
}

export const categories: Category[] = [
  {
    key: 'enterprise',
    label: '업무·대용량 데이터',
    description: '정렬, 편집, 가상 스크롤과 업무 일정 컴포넌트예요.',
    names: enterpriseNames,
    Component: EnterpriseCategory,
    source: enterpriseSource,
  },
  {
    key: 'extended-inputs',
    label: '입력·액션 확장',
    description: '추가 입력 형식과 선택, 복사와 실행 동작을 확인해요.',
    names: extendedInputNames,
    Component: ExtendedInputsCategory,
    source: extendedInputsSource,
  },
  {
    key: 'extended-foundation',
    label: '기초·레이아웃 확장',
    description: '기존 토큰과 레이아웃을 바탕으로 구성한 확장 컴포넌트예요.',
    names: extendedFoundationNames,
    Component: ExtendedFoundationCategory,
    source: extendedFoundationSource,
  },
  {
    key: 'content-media',
    label: '콘텐츠·파일·AI',
    description: '정보 표시부터 파일 미리보기, 대화와 작업 상태까지 살펴봐요.',
    names: contentMediaNames,
    Component: ContentMediaCategory,
    source: contentMediaSource,
  },
  {
    key: 'extended-navigation',
    label: '탐색·오버레이 확장',
    description: '화면 탐색과 떠 있는 정보, 다양한 상태를 확인해요.',
    names: extendedNavigationNames,
    Component: ExtendedNavigationCategory,
    source: extendedNavigationSource,
  },
  {
    key: 'foundation',
    label: '기초',
    description: '레이아웃과 타이포그래피, 모든 화면의 출발점이에요.',
    names: foundationNames,
    Component: FoundationCategory,
    source: foundationSource,
  },
  {
    key: 'controls',
    label: '버튼·컨트롤',
    description: '누르고, 켜고, 고르는 모든 동작을 담당해요.',
    names: controlNames,
    Component: ControlsCategory,
    source: controlsSource,
  },
  {
    key: 'inputs',
    label: '입력',
    description: '입력은 간편하게, 선택은 명확하게.',
    names: inputNames,
    Component: InputsCategory,
    source: inputsSource,
  },
  {
    key: 'surfaces',
    label: '표면·피드백',
    description: '정보를 담는 면과 상태를 알려주는 신호예요.',
    names: surfaceNames,
    Component: SurfacesCategory,
    source: surfacesSource,
  },
  {
    key: 'navigation',
    label: '내비게이션',
    description: '지금 어디에 있고 어디로 갈 수 있는지 알려줘요.',
    names: navigationNames,
    Component: NavigationCategory,
    source: navigationSource,
  },
  {
    key: 'overlay',
    label: '오버레이',
    description: '필요한 순간에만 화면 위에 나타나요.',
    names: overlayNames,
    Component: OverlayCategory,
    source: overlaySource,
  },
  {
    key: 'data',
    label: '데이터·패턴',
    description: '숫자와 목록을 읽기 쉽게 정리해요.',
    names: dataNames,
    Component: DataCategory,
    source: dataSource,
  },
];
