import { useState } from 'react';
import { Button, Input, Text } from '@mega-ui/react';
import { categories } from './catalog';

export function ComponentSearch() {
  const [query, setQuery] = useState('');
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = terms.length
    ? categories.flatMap((category) =>
        category.names
          .filter((name) => {
            const text =
              `${name} ${category.label} ${category.description}`.toLocaleLowerCase();
            return terms.every((term) => text.includes(term));
          })
          .map((name) => ({ name, category })),
      )
    : [];

  return (
    <section className="docs-search" role="search" aria-label="컴포넌트 검색">
      <label htmlFor="component-search">컴포넌트 검색</label>
      <Input
        id="component-search"
        type="search"
        placeholder="이름 또는 분류 검색"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
            setQuery('');
          }
        }}
        aria-describedby="component-search-status"
        aria-controls="component-search-results"
      />
      <Text id="component-search-status" size="xs" tone="muted" role="status">
        {terms.length
          ? results.length
            ? `검색 결과 ${results.length}건`
            : '검색 결과가 없어요. 다른 이름이나 분류로 검색해 보세요.'
          : '예: Button, 버튼, 입력'}
      </Text>
      {query ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setQuery('');
            document.getElementById('component-search')?.focus();
          }}
        >
          검색어 지우기
        </Button>
      ) : null}
      <ul id="component-search-results" hidden={!results.length}>
        {results.map(({ name, category }) => (
          <li key={`${category.key}-${name}`}>
            <a
              href={`#components/${category.key}?to=${encodeURIComponent(name)}`}
            >
              <span>{name}</span>
              <Text as="span" size="xs" tone="muted">
                {category.label}
              </Text>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
