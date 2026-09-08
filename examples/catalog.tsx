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
