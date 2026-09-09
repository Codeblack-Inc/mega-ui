import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import * as ui from '@mega-ui/react';

test('list and form patterns expose complete native structure', () => {
  for (const name of [
    'FilterBar',
    'ActiveFilters',
    'BulkActionBar',
    'DataPagination',
    'FormSection',
    'FormActions',
    'FormErrorSummary',
  ])
    assert.equal(typeof ui[name], 'function', name);

  const html = render(
    h(
      'main',
      null,
      h(ui.FilterBar, {
        search: h(ui.Input, { type: 'search' }),
        advanced: h(ui.Select, null, h('option', null, '활성')),
      }),
      h(ui.ActiveFilters, {
        filters: [{ id: 'status', label: '상태: 활성' }],
        onRemove() {},
        onClear() {},
      }),
      h(
        ui.BulkActionBar,
        { count: 2, onClear() {} },
        h(ui.Button, null, '삭제'),
      ),
      h(ui.DataPagination, {
        total: 42,
        page: 2,
        pageSize: 10,
        onPageChange() {},
        onPageSizeChange() {},
      }),
      h(
        'form',
        null,
        h(ui.FormSection, { title: '계정', grouped: true }, h(ui.Input)),
        h(ui.FormErrorSummary, {
          errors: [
            { id: 'email', label: '이메일', message: '필수 항목입니다.' },
          ],
          focusOnMount: false,
        }),
        h(ui.FormActions, { dirty: true, saving: true, onCancel() {} }),
      ),
    ),
  );

  assert.match(html, /<details[^>]*><summary>고급 필터<\/summary>/);
  assert.match(html, /aria-label="상태: 활성 필터 제거"/);
  assert.match(html, /2개 선택/);
  assert.match(html, /42개 중 11–20개/);
  assert.match(html, /<fieldset[^>]*aria-labelledby=/);
  assert.match(html, /<legend[^>]*>계정<\/legend>/);
  assert.match(html, /role="alert" tabindex="-1"/);
  assert.match(html, /href="#email"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /저장하지 않은 변경 사항이 있어요/);
});

test('data pagination normalizes empty and invalid ranges', () => {
  const html = render(
    h(ui.DataPagination, {
      total: Number.NaN,
      page: Number.POSITIVE_INFINITY,
      pageSize: 0,
      pageSizeOptions: [0, 10, 10, Number.NaN],
      onPageSizeChange() {},
    }),
  );
  assert.match(html, />0개</);
  assert.equal((html.match(/<option/g) ?? []).length, 1);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
