import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import * as ui from '@mega-ui/react';

test('extended checklist names are public and simple equivalents share implementations', () => {
  for (const name of [
    'ButtonGroup',
    'SplitButton',
    'FloatingActionButton',
    'SpeedDial',
    'CopyButton',
    'LinkButton',
    'PasswordInput',
    'NumberInput',
    'CurrencyInput',
    'PercentInput',
    'MaskInput',
    'OTPInput',
    'SearchInput',
    'ColorInput',
    'FileInput',
    'DateInput',
    'DateRangePicker',
    'TimePicker',
    'DateTimePicker',
    'RangeSlider',
    'FormField',
    'FormLabel',
    'FormDescription',
    'FormError',
    'RadioGroup',
    'MultiSelect',
    'Autocomplete',
    'Combobox',
    'TreeSelect',
  ])
    assert.equal(typeof ui[name], 'function', name);

  for (const [alias, original] of [
    ['PasswordInput', 'InputPassword'],
    ['NumberInput', 'InputNumber'],
    ['MaskInput', 'InputMask'],
    ['OTPInput', 'InputOtp'],
    ['ColorInput', 'InputColor'],
    ['DateInput', 'DatePicker'],
    ['FormField', 'Field'],
    ['FormLabel', 'Label'],
    ['Autocomplete', 'AutoComplete'],
    ['Combobox', 'AutoComplete'],
  ])
    assert.equal(ui[alias], ui[original], alias);
});

test('native input variants retain browser semantics and form values', () => {
  const html = render(
    h(
      'form',
      null,
      h(ui.SearchInput, { name: 'query' }),
      h(ui.FileInput, { name: 'attachment', accept: '.pdf' }),
      h(ui.TimePicker, { name: 'time', min: '09:00' }),
      h(ui.DateTimePicker, { name: 'meeting' }),
      h(ui.CurrencyInput, { name: 'amount', defaultValue: 10000 }),
      h(ui.PercentInput, { name: 'rate', defaultValue: 15 }),
      h(
        ui.MultiSelect,
        { name: 'teams', defaultValue: ['dev'], size: 1 },
        h('option', { value: 'dev' }, 'Development'),
        h('option', { value: 'ops' }, 'Operations'),
      ),
      h(ui.TreeSelect, {
        name: 'team',
        groups: [
          {
            label: 'Product',
            options: [
              { label: 'Design', value: 'design' },
              {
                label: 'Engineering',
                disabled: true,
                options: [{ label: 'Web', value: 'web' }],
              },
            ],
          },
        ],
      }),
    ),
  );

  assert.match(html, /<input(?=[^>]*name="query")(?=[^>]*type="search")[^>]*>/);
  assert.match(
    html,
    /<input(?=[^>]*name="attachment")(?=[^>]*accept="\.pdf")(?=[^>]*type="file")[^>]*>/,
  );
  assert.match(
    html,
    /<input(?=[^>]*name="time")(?=[^>]*min="09:00")(?=[^>]*type="time")[^>]*>/,
  );
  assert.match(
    html,
    /<input(?=[^>]*name="meeting")(?=[^>]*type="datetime-local")[^>]*>/,
  );
  assert.match(
    html,
    /<input(?=[^>]*name="amount")(?=[^>]*type="number")[^>]*>/,
  );
  assert.match(html, /<input(?=[^>]*name="rate")(?=[^>]*type="number")[^>]*>/);
  assert.match(html, /<select[^>]*multiple=""[^>]*size="2"/);
  assert.match(html, /<optgroup label="Product"><option value="design"/);
  assert.match(html, /<option value="web" disabled="">Engineering › Web/);
});

test('range controls replace non-finite input before rendering native values', () => {
  const html = render(
    h(
      'main',
      null,
      h(ui.RangeSlider, {
        label: 'Invalid range',
        name: 'range',
        min: Number.NaN,
        max: Number.POSITIVE_INFINITY,
        step: Number.NaN,
        value: [Number.NaN, Number.NEGATIVE_INFINITY],
      }),
      h(ui.Knob, {
        label: 'Invalid knob',
        min: Number.NaN,
        max: Number.POSITIVE_INFINITY,
        value: Number.NaN,
        onChange() {},
      }),
    ),
  );

  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.match(
    html,
    /<input(?=[^>]*name="rangeMin")(?=[^>]*min="0")(?=[^>]*max="100")(?=[^>]*value="0")[^>]*>/,
  );
  assert.match(
    html,
    /<input(?=[^>]*name="rangeMax")(?=[^>]*min="0")(?=[^>]*max="100")(?=[^>]*value="100")[^>]*>/,
  );
  assert.match(html, /stroke-dasharray="0 100"/);
  assert.match(
    html,
    /<input(?=[^>]*aria-label="Invalid knob")(?=[^>]*min="0")(?=[^>]*max="100")(?=[^>]*value="0")[^>]*>/,
  );
});

test('composed controls expose labels, native controls and constrained ranges', () => {
  const html = render(
    h(
      'main',
      null,
      h(
        ui.ButtonGroup,
        { 'aria-label': 'Editor actions', orientation: 'vertical' },
        h(ui.Button, null, 'Save'),
      ),
      h(
        ui.SplitButton,
        {
          menuLabel: 'More save options',
          items: [{ label: 'Save copy', disabled: true }],
        },
        'Save',
      ),
      h(ui.FloatingActionButton, { label: 'Add item' }, '+'),
      h(ui.SpeedDial, {
        label: 'Quick actions',
        actions: [{ label: 'Create note' }],
      }),
      h(ui.CopyButton, { value: 'ABC' }, 'Copy code'),
      h(ui.LinkButton, { href: '/settings' }, 'Settings'),
      h(ui.DateRangePicker, {
        label: 'Trip',
        startName: 'start',
        endName: 'end',
        startProps: { min: '2026-01-01' },
      }),
      h(ui.RangeSlider, {
        label: 'Budget',
        name: 'budget',
        value: [80, 20],
        min: 0,
        max: 100,
      }),
      h(ui.RadioGroup, {
        label: 'Plan',
        name: 'plan',
        defaultValue: 'pro',
        options: [
          { label: 'Basic', value: 'basic' },
          { label: 'Pro', value: 'pro' },
        ],
      }),
      h(ui.FormDescription, { id: 'hint' }, 'Helpful text'),
      h(ui.FormError, { id: 'error' }, 'Invalid value'),
    ),
  );

  assert.match(html, /role="group"[^>]*mega-button-group--vertical/);
  assert.match(html, /aria-label="More save options"/);
  assert.match(html, /aria-label="Add item"/);
  assert.match(html, /<details[^>]*mega-speed-dial/);
  assert.match(html, /<summary aria-label="Quick actions">/);
  assert.match(html, /aria-live="polite">Copy code/);
  assert.match(html, /href="\/settings"/);
  assert.match(
    html,
    /<input(?=[^>]*name="start")(?=[^>]*min="2026-01-01")(?=[^>]*type="date")[^>]*>/,
  );
  assert.match(html, /<input(?=[^>]*name="end")(?=[^>]*type="date")[^>]*>/);
  assert.match(
    html,
    /<input(?=[^>]*name="budgetMin")(?=[^>]*max="80")(?=[^>]*value="20")[^>]*>/,
  );
  assert.match(
    html,
    /<input(?=[^>]*name="budgetMax")(?=[^>]*min="20")(?=[^>]*value="80")[^>]*>/,
  );
  assert.match(html, /name="plan"[^>]*checked="" value="pro"/);
  assert.match(html, /id="error" role="alert"/);
});

test('extended styles reference defined tokens and avoid runtime custom properties', () => {
  const tokens = readFileSync('src/styles/_tokens.scss', 'utf8');
  const styles = readFileSync('src/styles/_extended-inputs.scss', 'utf8');
  const defined = new Set(
    [...tokens.matchAll(/(--mega-[\w-]+)\s*:/g)].map((match) => match[1]),
  );
  for (const [, token] of styles.matchAll(/var\((--mega-[\w-]+)/g))
    assert.ok(defined.has(token), token);
  assert.doesNotMatch(styles, /style=|--mega-[\w-]+\s*;/);
});
