import { useEffect, useState, type ReactNode } from 'react';
import { Card, Chip, Heading, MegaIcon, Stack, Text } from '@mega-ui/react';

/** Card grid shared by every category page, plus the quick-scan chip row. */
export function CategoryCards({
  code,
  order,
  demos,
  groups = {},
  notes = {},
}: {
  code: string;
  /** Card ids in display order. Ids listed in `groups` render one card for several components. */
  order: readonly string[];
  demos: Record<string, ReactNode>;
  /** cardId → component names shown together in that card (chips still list each name). */
  groups?: Record<string, readonly string[]>;
  /** One-line cross-link shown under the card title (alias / extended-version notes). */
  notes?: Record<string, ReactNode>;
}) {
  const [active, setActive] = useState(order[0] ?? '');
  const cardOf = (name: string) =>
    Object.keys(groups).find((id) => groups[id]?.includes(name)) ?? name;

  // Highlight the chip of the card nearest the top of the viewport.
  useEffect(() => {
    const cards = order
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [order]);

  return (
    <Stack gap={5}>
      <div
        className="category-chips"
        role="group"
        aria-label="컴포넌트 바로가기"
      >
        {order
          .flatMap((id) => groups[id] ?? [id])
          .map((name) => (
            <Chip
              key={name}
              size="sm"
              variant="outline"
              selected={active === cardOf(name)}
              onClick={() =>
                document.getElementById(cardOf(name))?.scrollIntoView({
                  block: 'start',
                  behavior: matchMedia('(prefers-reduced-motion: reduce)')
                    .matches
                    ? 'auto'
                    : 'smooth',
                })
              }
            >
              {name}
            </Chip>
          ))}
      </div>
      <div className="catalog-showcase">
        {order.map((name, index) => (
          <Card
            key={name}
            id={name}
            data-members={groups[name]?.join(' ')}
            padding="lg"
            className="catalog-card"
          >
            <Stack gap={4}>
              <div className="catalog-label">
                {code} <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <Stack gap={1}>
                <Heading size="lg">{groups[name]?.join(' · ') ?? name}</Heading>
                {notes[name] ? (
                  <Text size="xs" tone="muted">
                    {notes[name]}
                  </Text>
                ) : null}
              </Stack>
              {demos[name]}
            </Stack>
          </Card>
        ))}
      </div>
    </Stack>
  );
}

/** P2-3: a static copy of an overlay's opened state, so it's visible without hovering. */
export function OpenState({ children }: { children: ReactNode }) {
  return (
    <div className="demo-open">
      <Text size="xs" tone="muted">
        열린 모습
      </Text>
      {children}
    </div>
  );
}

/** "X는 Y의 별칭/확장판이에요 → Y" cross-link between duplicated component pairs. */
export function PairNote({
  name,
  category,
  kind,
}: {
  name: string;
  category: string;
  /** alias/extends: this card is an alias/extension of `name`. aliased/extended: `name` is one of this card. */
  kind: 'alias' | 'extends' | 'aliased' | 'extended';
}) {
  const copy = {
    alias: '의 별칭이에요. 같은 컴포넌트를 다른 이름으로 내보내요',
    extends: '의 확장판이에요',
    aliased: '은(는) 이 컴포넌트의 별칭이에요',
    extended: '은(는) 이 컴포넌트의 확장판이에요',
  }[kind];
  return (
    <>
      <code>{name}</code>
      {copy}
      <span className="pair-note-arrow" aria-hidden="true">
        <MegaIcon name="arrow" width={14} height={14} />
      </span>
      <a href={`#components/${category}?to=${name}`}>{name}</a>
    </>
  );
}
