import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import * as ui from '@mega-ui/react';

test('extended navigation, overlay and feedback names are public', () => {
  for (const name of [
    'Anchor',
    'Stepper',
    'DropdownMenu',
    'ContextMenu',
    'NavigationMenu',
    'MegaMenu',
    'Sidebar',
    'BottomNavigation',
    'CommandPalette',
    'BackToTop',
    'Popover',
    'HoverCard',
    'Modal',
    'AlertDialog',
    'Drawer',
    'Sheet',
    'Tour',
    'Message',
    'Toast',
    'Notification',
    'Progress',
    'CircularProgress',
    'Spinner',
    'ErrorState',
  ])
    assert.equal(typeof ui[name], 'function', name);
  assert.equal(ui.DropdownMenu, ui.Menu);
  assert.equal(ui.Modal, ui.Dialog);
  assert.equal(ui.Progress, ui.ProgressBar);
});

test('extended components preserve native and ARIA semantics on the server', () => {
  const html = render(
    h(
      'main',
      null,
      h(ui.Anchor, { href: '/settings' }, 'Settings'),
      h(ui.Stepper, {
        current: 1,
        items: [{ label: 'Start' }, { label: 'Review' }],
      }),
      h(ui.BottomNavigation, {
        label: 'Primary',
        value: 'home',
        items: [{ value: 'home', label: 'Home', icon: 'H' }],
      }),
      h(
        ui.Popover,
        { label: 'More', trigger: h('button', null, 'More') },
        'Content',
      ),
      h(ui.CommandPalette, {
        open: false,
        onClose() {},
        commands: [{ id: 'new', label: 'New', onSelect() {} }],
      }),
      h(ui.CircularProgress, { label: 'Uploading', value: 25 }),
      h(ui.Spinner, null),
      h(ui.ErrorState, { title: 'Failed' }),
    ),
  );
  assert.match(html, /href="\/settings"/);
  assert.match(html, /aria-current="step"/);
  assert.match(html, /aria-label="Primary"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /role="progressbar"[^>]*aria-valuenow="25"/);
  assert.match(html, /role="status"[^>]*aria-label="로딩 중"/);
  assert.match(html, /mega-result--danger/);
});

test('extended edge cases keep safe values and native fallback semantics', () => {
  const html = render(
    h(
      'main',
      null,
      h(ui.BottomNavigation, {
        label: 'Primary',
        items: [
          {
            value: 'locked',
            label: 'Locked',
            icon: 'L',
            href: '/locked',
            disabled: true,
          },
        ],
      }),
      h(ui.AlertDialog, { open: false, title: 'Delete', onClose() {} }),
      h(ui.CommandPalette, {
        open: false,
        onClose() {},
        commands: [{ id: 'new', label: 'New', onSelect() {} }],
      }),
      h(ui.Tour, {
        open: false,
        onClose() {},
        current: 1,
        steps: [{ title: 'First' }, { title: 'Last' }],
      }),
      h(ui.Notification, { title: 'Notice' }, 'Consumer content'),
      h(ui.CircularProgress, {
        label: 'Broken input',
        value: Number.NaN,
        max: 0,
        style: { marginInline: 4 },
      }),
    ),
  );
  assert.match(html, /<button[^>]*disabled=""[^>]*>[^<]*<span[^>]*>L/);
  assert.doesNotMatch(html, /href="\/locked"/);
  assert.match(html, /role="alertdialog"/);
  assert.doesNotMatch(html, /role="listbox"/);
  assert.doesNotMatch(html, /role="option"/);
  assert.match(html, /<button[^>]*>완료<\/button>/);
  assert.match(html, /Consumer content/);
  assert.match(html, /aria-valuemax="100"[^>]*aria-valuenow="0"/);
  assert.match(html, /margin-inline:4px/);
});
