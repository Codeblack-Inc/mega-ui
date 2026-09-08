import type { ReactNode } from 'react';
import { Card, Chip, Heading, Stack } from '@mega-ui/react';

/** Card grid shared by every category page, plus the quick-scan chip row. */
export function CategoryCards({
  code,
  order,
  demos,
}: {
  code: string;
  order: readonly string[];
  demos: Record<string, ReactNode>;
}) {
  return (
    <Stack gap={5}>
      <div
        className="category-chips"
        role="group"
        aria-label="컴포넌트 바로가기"
      >
        {order.map((name) => (
          <Chip
            key={name}
            size="sm"
            variant="outline"
            onClick={() =>
              document
                .getElementById(name)
                ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
            }
          >
            {name}
          </Chip>
        ))}
      </div>
      <div className="catalog-showcase">
        {order.map((name, index) => (
          <Card key={name} id={name} padding="lg" className="catalog-card">
            <Stack gap={4}>
              <div className="catalog-label">
                {code} <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <Heading size="lg">{name}</Heading>
              {demos[name]}
            </Stack>
          </Card>
        ))}
      </div>
    </Stack>
  );
}
