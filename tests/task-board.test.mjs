import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TaskBoard, Kanban } from '@mega-ui/react';
import {
  validateTaskBoard,
  updateTaskBoard,
  serializeTaskBoard,
  parseTaskBoard,
  isTaskBoardDate,
} from '../src/components/task-board-model.ts';
const board = {
  version: 1,
  columns: [
    { id: 'a', title: '대기' },
    { id: 'b', title: '진행', wipLimit: 2 },
  ],
  lanes: [{ id: 'l', title: '제품' }],
  assignees: [{ id: 'p', name: '메가' }],
  cards: [
    {
      id: '1',
      title: '첫 카드',
      columnId: 'a',
      laneId: 'l',
      assigneeId: 'p',
      dueDate: '2026-09-19',
    },
    { id: '2', title: '두 번째', columnId: 'a' },
    { id: '3', title: '진행 카드', columnId: 'b' },
  ],
};
test('task board shares one immutable reducer for order, CRUD, lanes and WIP', () => {
  const original = structuredClone(board);
  const moved = updateTaskBoard(board, {
    type: 'move-card',
    id: '1',
    columnId: 'b',
    beforeId: '3',
  });
  assert.deepEqual(
    moved.cards.filter((c) => c.columnId === 'b').map((c) => c.id),
    ['1', '3'],
  );
  assert.equal(moved.cards[0].laneId, undefined);
  assert.throws(
    () => updateTaskBoard(moved, { type: 'move-card', id: '2', columnId: 'b' }),
    /제한/,
  );
  assert.throws(() =>
    updateTaskBoard(board, {
      type: 'move-card',
      id: '1',
      columnId: 'b',
      beforeId: '2',
    }),
  );
  const same = updateTaskBoard(board, {
    type: 'move-card',
    id: '2',
    columnId: 'a',
    laneId: 'l',
    beforeId: '1',
  });
  assert.deepEqual(
    same.cards.filter((c) => c.columnId === 'a').map((c) => c.id),
    ['2', '1'],
  );
  assert.throws(() =>
    updateTaskBoard(board, { type: 'delete-column', id: 'a' }),
  );
  assert.throws(
    () =>
      updateTaskBoard(board, {
        type: 'delete-column',
        id: 'a',
        toColumnId: 'b',
      }),
    /제한/,
  );
  const deleted = updateTaskBoard(board, { type: 'delete-lane', id: 'l' });
  assert.equal(deleted.cards[0].laneId, undefined);
  assert.equal(deleted.cards.length, 3);
  const reordered = updateTaskBoard(board, {
    type: 'move-column',
    id: 'b',
    index: 0,
  });
  assert.equal(reordered.columns[0].id, 'b');
  assert.deepEqual(board, original);
  const added = updateTaskBoard(board, {
    type: 'put-card',
    card: { id: '4', title: '추가', columnId: 'a' },
  });
  assert.equal(added.cards.length, 4);
  const edited = updateTaskBoard(added, {
    type: 'put-card',
    card: { ...added.cards[3], title: '변경' },
  });
  assert.equal(edited.cards[3].title, '변경');
  assert.equal(
    updateTaskBoard(edited, { type: 'delete-card', id: '4' }).cards.length,
    3,
  );
});
test('board JSON roundtrips ordered state and validates the trust boundary', () => {
  assert.deepEqual(parseTaskBoard(serializeTaskBoard(board)), board);
  assert.equal(isTaskBoardDate('2024-02-29'), true);
  assert.equal(isTaskBoardDate('2026-02-29'), false);
  for (const value of [
    null,
    {},
    { ...board, version: 2 },
    { ...board, cards: new Array(1) },
    { ...board, cards: [board.cards[0], board.cards[0]] },
    { ...board, cards: [{ ...board.cards[0], columnId: 'bad' }] },
    { ...board, cards: [{ ...board.cards[0], dueDate: '2026-02-30' }] },
    { ...board, cards: [{ ...board.cards[0], assigneeId: 'bad' }] },
    { ...board, columns: [{ id: 'a', title: 'A', wipLimit: 1 }] },
    { ...board, cards: [{ ...board.cards[0], description: 'x'.repeat(5001) }] },
  ])
    assert.throws(() => validateTaskBoard(value));
  assert.throws(() => parseTaskBoard('{'));
  assert.throws(() => parseTaskBoard(' '.repeat(2_000_001)));
  assert.equal(
    validateTaskBoard({
      ...board,
      cards: Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        title: '카드',
        columnId: 'a',
      })),
    }).cards.length,
    1000,
  );
  assert.throws(() =>
    validateTaskBoard({
      ...board,
      cards: Array.from({ length: 1001 }, (_, i) => ({
        id: String(i),
        title: '카드',
        columnId: 'a',
      })),
    }),
  );
});
test('Kanban delegates to TaskBoard and preserves ReactNode content and move callback controls', () => {
  const modern = renderToStaticMarkup(
    h(TaskBoard, { value: board, onChange() {}, label: '작업' }),
  );
  assert.match(modern, /mega-task-board/);
  assert.match(modern, /aria-label="첫 카드 카드 이동"/);
  assert.match(modern, /type="date"/);
  const legacy = renderToStaticMarkup(
    h(Kanban, {
      columns: [
        {
          id: 'a',
          title: h('em', null, '대기'),
          cards: [
            { id: '1', title: '검토', description: h('span', null, '내용') },
          ],
        },
        { id: 'b', title: '완료', cards: [] },
      ],
      onMove() {},
    }),
  );
  assert.match(legacy, /mega-task-board/);
  assert.doesNotMatch(legacy, /mega-kanban/);
  assert.match(legacy, /<em>대기<\/em>/);
  assert.match(legacy, /<span>내용<\/span>/);
  assert.match(legacy, /검토 다음 열로 이동/);
});
