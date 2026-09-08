import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import * as ui from '@mega-ui/react';

test('all reference form names are public and existing implementations are shared', () => {
  for (const name of [
    'AutoComplete',
    'Checkbox',
    'CheckboxGroup',
    'DatePicker',
    'FloatLabel',
    'IconField',
    'IftaLabel',
    'InputColor',
    'InputGroup',
    'InputMask',
    'InputNumber',
    'InputOtp',
    'InputPassword',
    'InputTags',
    'InputText',
    'KeyFilter',
    'Knob',
    'Label',
    'Listbox',
    'RadioButton',
    'Rating',
    'Select',
    'Slider',
    'Textarea',
    'ToggleButton',
    'ToggleButtonGroup',
    'ToggleSwitch',
  ]) {
    assert.equal(typeof ui[name], 'function', name);
  }
  for (const [alias, original] of [
    ['InputText', 'Input'],
    ['RadioButton', 'Radio'],
    ['ToggleSwitch', 'Switch'],
    ['ToggleButtonGroup', 'SegmentedControl'],
  ])
    assert.equal(ui[alias], ui[original]);
});

test('numeric masks and filters handle partial values, paste, invalid characters and overflow', () => {
  const format = ui.InputMask({
    mask: '###-####-####',
    value: '',
    onValueChange() {},
  }).props.format;
  for (const [input, expected] of [
    ['', ''],
    ['abc', ''],
    ['010', '010'],
    ['0101', '010-1'],
    ['010-1234-5678', '010-1234-5678'],
    ['a010b1234c567899', '010-1234-5678'],
  ])
    assert.equal(format(input), expected);
  for (const [filter, expected] of [
    ['digits', '012'],
    ['alpha', 'Abz'],
    ['alphanumeric', 'A0b1z2'],
  ]) {
    const clean = ui.KeyFilter({ filter, value: '', onValueChange() {} }).props
      .format;
    assert.equal(clean('한 A0-b1.z2!'), expected);
  }
});

test('new form controls preserve native semantics, names and constraints', () => {
  const html = render(
    h(
      'form',
      null,
      h(ui.AutoComplete, {
        id: 'city',
        suggestions: ['서울', '부산'],
        'aria-label': 'City',
      }),
      h(ui.DatePicker, { name: 'date', min: '2026-01-01' }),
      h(ui.InputNumber, { name: 'count', min: 1, max: 9, step: 2 }),
      h(ui.InputColor, { defaultValue: '#3182f6' }),
      h(ui.InputOtp, { length: 4, required: true }),
      h(ui.CheckboxGroup, {
        label: 'Teams',
        name: 'team',
        defaultValue: ['dev'],
        options: [
          { label: 'Development', value: 'dev' },
          { label: 'Operations', value: 'ops', disabled: true },
        ],
      }),
      h(ui.InputTags, {
        value: ['한글', 'React'],
        onValueChange() {},
        name: 'tags',
        form: 'external',
      }),
      h(ui.Rating, { label: 'Score', name: 'score', value: 3, disabled: true }),
      h(ui.Listbox, { size: 1, multiple: true }, h('option', null, 'A')),
      h(ui.Knob, { label: 'Volume', value: 25, onChange() {} }),
      h(
        ui.FloatLabel,
        { label: 'Email', htmlFor: 'email' },
        h(ui.InputText, { id: 'email', placeholder: ' ' }),
      ),
      h(ui.InputPassword, { 'aria-label': 'Password', disabled: true }),
      h(ui.ToggleButton, { defaultPressed: true }, 'Favorite'),
    ),
  );
  const list = html.match(/list="([^"]+)"/)[1];
  assert.ok(html.includes(`datalist id="${list}"`));
  assert.match(html, /min="2026-01-01"[^>]*type="date"/);
  assert.match(html, /min="1" max="9" step="2" type="number"/);
  assert.match(html, /type="color"/);
  assert.match(html, /autoComplete="one-time-code"/);
  assert.match(html, /maxLength="4" pattern="\[0-9\]\{4\}"/);
  assert.match(html, /name="team"[^>]*checked="" value="dev"/);
  assert.match(
    html,
    /<input(?=[^>]*type="hidden")(?=[^>]*name="tags")(?=[^>]*form="external")(?=[^>]*value="한글")[^>]*>/,
  );
  assert.match(html, /name="score"[^>]*checked="" value="3"/);
  assert.match(html, /multiple="" size="2"/);
  assert.match(html, /aria-label="Volume"[^>]*type="range"/);
  assert.match(html, /for="email"/);
  assert.match(html, /type="password"/);
  assert.match(html, /aria-pressed="true"/);
});

test('form styles only reference existing theme tokens', () => {
  const tokens = readFileSync('src/styles/_tokens.scss', 'utf8');
  const styles = readFileSync('src/styles/_forms.scss', 'utf8');
  const defined = new Set(
    [...tokens.matchAll(/(--mega-[\w-]+)\s*:/g)].map((match) => match[1]),
  );
  for (const [, token] of styles.matchAll(/var\((--mega-[\w-]+)/g))
    assert.ok(defined.has(token), token);
});
