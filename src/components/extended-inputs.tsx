import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
import {
  Button,
  Checkbox,
  Chip,
  Field,
  IconButton,
  Input,
  Radio,
  Select,
  type ButtonProps,
  type FieldProps,
  type InputProps,
  type SelectProps,
} from './controls';
import {
  AutoComplete,
  DatePicker,
  InputColor,
  InputGroup,
  InputMask,
  InputNumber,
  InputOtp,
  InputPassword,
  Label,
  Listbox,
  Slider,
  type AutoCompleteProps,
  type DatePickerProps,
  type InputColorProps,
  type InputMaskProps,
  type InputNumberProps,
  type InputOtpProps,
  type InputPasswordProps,
  type LabelProps,
  type ListboxProps,
} from './forms';
import { Menu, MenuItem } from './overlay';

export interface ButtonGroupProps extends ComponentPropsWithRef<'div'> {
  orientation?: 'horizontal' | 'vertical';
}

export function ButtonGroup({
  orientation = 'horizontal',
  className = '',
  role = 'group',
  ...props
}: ButtonGroupProps) {
  return (
    <div
      {...props}
      role={role}
      className={`mega-button-group mega-button-group--${orientation} ${className}`}
    />
  );
}

export interface SplitButtonItem {
  label: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

export type SplitButtonVariant = Exclude<
  NonNullable<ButtonProps['variant']>,
  'text'
>;

export interface SplitButtonProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  children: ReactNode;
  onAction?: MouseEventHandler<HTMLButtonElement>;
  menuLabel?: string;
  items: readonly SplitButtonItem[];
  variant?: SplitButtonVariant;
  size?: ButtonProps['size'];
  disabled?: boolean;
}

export function SplitButton({
  children,
  onAction,
  menuLabel = '추가 작업',
  items,
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  ...props
}: SplitButtonProps) {
  return (
    <div
      {...props}
      className={`mega-split-button mega-split-button--${variant} mega-split-button--${size} ${className}`}
    >
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={onAction}
      >
        {children}
      </Button>
      <Menu
        align="end"
        trigger={
          <IconButton label={menuLabel} disabled={disabled}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" />
            </svg>
          </IconButton>
        }
      >
        {items.map((item, index) => (
          <MenuItem
            key={index}
            disabled={item.disabled}
            onSelect={item.onSelect}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

export interface FloatingActionButtonProps extends Omit<
  ButtonProps,
  'size' | 'children' | 'fullWidth' | 'leading' | 'trailing'
> {
  label: string;
  children: ReactNode;
}

export function FloatingActionButton({
  label,
  className = '',
  children,
  ...props
}: FloatingActionButtonProps) {
  return (
    <Button
      {...props}
      aria-label={label}
      className={`mega-floating-action-button ${className}`}
    >
      {children}
    </Button>
  );
}

export interface SpeedDialAction {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

export interface SpeedDialProps extends Omit<
  ComponentPropsWithRef<'details'>,
  'children'
> {
  label: string;
  icon?: ReactNode;
  actions: readonly SpeedDialAction[];
}

export function SpeedDial({
  label,
  icon = '+',
  actions,
  className = '',
  ...props
}: SpeedDialProps) {
  return (
    <details {...props} className={`mega-speed-dial ${className}`}>
      <summary aria-label={label}>{icon}</summary>
      <div className="mega-speed-dial__actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={action.disabled}
            onClick={(event) => {
              action.onSelect?.();
              event.currentTarget.closest('details')?.removeAttribute('open');
            }}
          >
            {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
            {action.label}
          </button>
        ))}
      </div>
    </details>
  );
}

export interface CopyButtonProps extends Omit<
  ButtonProps,
  'onClick' | 'value'
> {
  value: string;
  copiedLabel?: ReactNode;
  resetAfter?: number;
  onCopied?: () => void;
  onCopyError?: (error: unknown) => void;
}

export function CopyButton({
  value,
  copiedLabel = '복사됨',
  resetAfter = 2000,
  onCopied,
  onCopyError,
  children = '복사',
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), resetAfter);
    return () => window.clearTimeout(timer);
  }, [copied, resetAfter]);

  return (
    <Button
      {...props}
      onClick={async () => {
        try {
          if (!navigator.clipboard)
            throw new Error('Clipboard API is unavailable');
          await navigator.clipboard.writeText(value);
          setCopied(true);
          onCopied?.();
        } catch (error) {
          setCopied(false);
          onCopyError?.(error);
        }
      }}
    >
      <span aria-live="polite">{copied ? copiedLabel : children}</span>
    </Button>
  );
}

export interface LinkButtonProps extends ComponentPropsWithRef<'a'> {
  href: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leading,
  trailing,
  className = '',
  children,
  ...props
}: LinkButtonProps) {
  return (
    <a
      {...props}
      className={`mega-button mega-button--${variant} mega-button--${size} ${className}`}
      data-full-width={fullWidth || undefined}
    >
      {leading}
      {children}
      {trailing}
    </a>
  );
}

interface AffixedNumberInputProps extends InputNumberProps {
  suffix?: ReactNode;
}

export type CurrencyInputProps = AffixedNumberInputProps;
export type PercentInputProps = AffixedNumberInputProps;

export function CurrencyInput({
  suffix = '원',
  ...props
}: AffixedNumberInputProps) {
  return (
    <InputGroup trailing={suffix} className="mega-affixed-number-input">
      <InputNumber {...props} />
    </InputGroup>
  );
}

export function PercentInput({
  suffix = '%',
  ...props
}: AffixedNumberInputProps) {
  return (
    <InputGroup trailing={suffix} className="mega-affixed-number-input">
      <InputNumber {...props} />
    </InputGroup>
  );
}

export type SearchInputProps = Omit<InputProps, 'type'>;
export function SearchInput(props: SearchInputProps) {
  return <Input {...props} type="search" />;
}

export type FileInputProps = Omit<InputProps, 'type'>;
export function FileInput({ className = '', ...props }: FileInputProps) {
  return (
    <Input {...props} type="file" className={`mega-file-input ${className}`} />
  );
}

type DateRangePartProps = Omit<DatePickerProps, 'name'>;

export interface DateRangePickerProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'children' | 'onChange'
> {
  label: string;
  startLabel?: string;
  endLabel?: string;
  startName: string;
  endName: string;
  startProps?: DateRangePartProps;
  endProps?: DateRangePartProps;
  presets?: readonly { label: string; start: string; end: string }[];
  error?: ReactNode;
  onValueChange?: (value: { start: string; end: string }) => void;
}

export function DateRangePicker({
  label,
  startLabel = '시작일',
  endLabel = '종료일',
  startName,
  endName,
  startProps,
  endProps,
  presets = [],
  error,
  onValueChange,
  className = '',
  ref,
  ...props
}: DateRangePickerProps) {
  const id = useId();
  const groupRef = useRef<HTMLFieldSetElement>(null);
  const [localRange, setLocalRange] = useState(() => ({
    start: String(startProps?.defaultValue ?? ''),
    end: String(endProps?.defaultValue ?? ''),
  }));
  const startValue = String(startProps?.value ?? localRange.start);
  const endValue = String(endProps?.value ?? localRange.end);
  const rangeError =
    startValue && endValue && startValue > endValue
      ? '종료일은 시작일 이후로 선택해 주세요.'
      : undefined;
  const message = error ?? rangeError;
  const startMax = [startProps?.max, endValue]
    .filter(Boolean)
    .map(String)
    .sort()[0];
  const endMin = [endProps?.min, startValue]
    .filter(Boolean)
    .map(String)
    .sort()
    .at(-1);
  useEffect(() => {
    const form = groupRef.current?.form;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (!event.defaultPrevented)
          setLocalRange({
            start: String(startProps?.defaultValue ?? ''),
            end: String(endProps?.defaultValue ?? ''),
          });
      });
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [startProps?.defaultValue, endProps?.defaultValue, props.form]);
  const report = (field: HTMLInputElement) => {
    const group = field.closest('fieldset');
    const next = {
      start:
        group?.querySelector<HTMLInputElement>('[data-mega-range-start]')
          ?.value ?? '',
      end:
        group?.querySelector<HTMLInputElement>('[data-mega-range-end]')
          ?.value ?? '',
    };
    setLocalRange(next);
    onValueChange?.(next);
  };

  return (
    <fieldset
      {...props}
      ref={(node) => {
        groupRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={`mega-date-range-picker ${className}`}
      aria-describedby={
        [props['aria-describedby'], message ? `${id}-error` : null]
          .filter(Boolean)
          .join(' ') || undefined
      }
    >
      <legend>{label}</legend>
      {presets.length ? (
        <div className="mega-date-range-picker__presets">
          {presets.map((preset) => (
            <Button
              key={`${preset.label}-${preset.start}-${preset.end}`}
              type="button"
              disabled={
                startProps?.disabled ||
                endProps?.disabled ||
                startProps?.readOnly ||
                endProps?.readOnly
              }
              size="sm"
              variant="weak"
              onClick={() => {
                const start = groupRef.current?.querySelector<HTMLInputElement>(
                  '[data-mega-range-start]',
                );
                const end = groupRef.current?.querySelector<HTMLInputElement>(
                  '[data-mega-range-end]',
                );
                if (start && startProps?.value === undefined)
                  start.value = preset.start;
                if (end && endProps?.value === undefined)
                  end.value = preset.end;
                setLocalRange({ start: preset.start, end: preset.end });
                onValueChange?.({ start: preset.start, end: preset.end });
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      ) : null}
      <label htmlFor={startProps?.id ?? `${id}-start`}>
        <span>{startLabel}</span>
        <DatePicker
          {...startProps}
          id={startProps?.id ?? `${id}-start`}
          name={startName}
          data-mega-range-start=""
          max={startMax}
          aria-invalid={message ? true : startProps?.['aria-invalid']}
          aria-describedby={
            [startProps?.['aria-describedby'], message ? `${id}-error` : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          onChange={(event) => {
            startProps?.onChange?.(event);
            if (!event.defaultPrevented) report(event.currentTarget);
          }}
        />
      </label>
      <label htmlFor={endProps?.id ?? `${id}-end`}>
        <span>{endLabel}</span>
        <DatePicker
          {...endProps}
          id={endProps?.id ?? `${id}-end`}
          name={endName}
          data-mega-range-end=""
          min={endMin}
          aria-invalid={message ? true : endProps?.['aria-invalid']}
          aria-describedby={
            [endProps?.['aria-describedby'], message ? `${id}-error` : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          onChange={(event) => {
            endProps?.onChange?.(event);
            if (!event.defaultPrevented) report(event.currentTarget);
          }}
        />
      </label>
      {message ? <FormError id={`${id}-error`}>{message}</FormError> : null}
    </fieldset>
  );
}

export type TimePickerProps = Omit<InputProps, 'type'>;
export function TimePicker(props: TimePickerProps) {
  return <Input {...props} type="time" />;
}

export type DateTimePickerProps = Omit<InputProps, 'type'>;
export function DateTimePicker(props: DateTimePickerProps) {
  return <Input {...props} type="datetime-local" />;
}

export type RangeSliderValue = readonly [number, number];

export interface RangeSliderProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'children' | 'defaultValue' | 'onChange'
> {
  label: string;
  name: string;
  lowerLabel?: string;
  upperLabel?: string;
  min?: number;
  max?: number;
  step?: number | 'any';
  value?: RangeSliderValue;
  defaultValue?: RangeSliderValue;
  onValueChange?: (value: [number, number]) => void;
}

const normalizeRange = (
  value: RangeSliderValue,
  min: number,
  max: number,
): [number, number] => {
  const first = Number.isFinite(value[0]) ? value[0] : min;
  const second = Number.isFinite(value[1]) ? value[1] : max;
  return [
    Math.max(min, Math.min(first, second, max)),
    Math.min(max, Math.max(first, second, min)),
  ];
};

export function RangeSlider({
  label,
  name,
  lowerLabel = '최솟값',
  upperLabel = '최댓값',
  min = 0,
  max = 100,
  step,
  value,
  defaultValue = [min, max],
  onValueChange,
  className = '',
  ...props
}: RangeSliderProps) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  const lowerBound = Math.min(safeMin, safeMax);
  const upperBound = Math.max(safeMin, safeMax);
  const safeStep =
    step === 'any' ||
    (typeof step === 'number' && Number.isFinite(step) && step > 0)
      ? step
      : undefined;
  const [internal, setInternal] = useState(() =>
    normalizeRange(defaultValue, lowerBound, upperBound),
  );
  const current = normalizeRange(value ?? internal, lowerBound, upperBound);
  const change = (index: 0 | 1, nextValue: number) => {
    const finiteValue = Math.max(
      lowerBound,
      Math.min(
        upperBound,
        Number.isFinite(nextValue) ? nextValue : current[index],
      ),
    );
    const next: [number, number] =
      index === 0
        ? [Math.min(finiteValue, current[1]), current[1]]
        : [current[0], Math.max(finiteValue, current[0])];
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <fieldset {...props} className={`mega-range-slider ${className}`}>
      <legend>{label}</legend>
      <label>
        <span>{lowerLabel}</span>
        <Slider
          aria-label={lowerLabel}
          name={`${name}Min`}
          min={lowerBound}
          max={current[1]}
          step={safeStep}
          value={current[0]}
          onChange={(event) => change(0, event.currentTarget.valueAsNumber)}
        />
      </label>
      <label>
        <span>{upperLabel}</span>
        <Slider
          aria-label={upperLabel}
          name={`${name}Max`}
          min={current[0]}
          max={upperBound}
          step={safeStep}
          value={current[1]}
          onChange={(event) => change(1, event.currentTarget.valueAsNumber)}
        />
      </label>
    </fieldset>
  );
}

export type FormDescriptionProps = ComponentPropsWithRef<'p'>;
export function FormDescription({
  className = '',
  ...props
}: FormDescriptionProps) {
  return <p {...props} className={`mega-field__description ${className}`} />;
}

export type FormErrorProps = ComponentPropsWithRef<'p'>;
export function FormError({
  className = '',
  role = 'alert',
  ...props
}: FormErrorProps) {
  return (
    <p
      {...props}
      role={role}
      className={`mega-field__description mega-field__description--error ${className}`}
    />
  );
}

export interface RadioGroupProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'children' | 'defaultValue' | 'onChange' | 'name'
> {
  label: string;
  name: string;
  options: readonly { label: ReactNode; value: string; disabled?: boolean }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function RadioGroup({
  label,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  className = '',
  ...props
}: RadioGroupProps) {
  return (
    <fieldset {...props} className={`mega-choice-group ${className}`}>
      <legend>{label}</legend>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          disabled={option.disabled}
          checked={value === undefined ? undefined : value === option.value}
          defaultChecked={
            value === undefined ? defaultValue === option.value : undefined
          }
          onChange={(event) => {
            if (event.currentTarget.checked) onValueChange?.(option.value);
          }}
        >
          {option.label}
        </Radio>
      ))}
    </fieldset>
  );
}

export interface MultiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}
export interface SearchableMultiSelectProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'children' | 'defaultValue' | 'onChange'
> {
  label: string;
  name: string;
  options: readonly MultiSelectOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  searchable?: boolean;
  maxSelected?: number;
  searchLabel?: string;
  clearLabel?: string;
  loading?: boolean;
  error?: ReactNode;
  emptyMessage?: ReactNode;
  onRetry?: () => void;
  onQueryChange?: (query: string) => void;
  /** Server results have already been filtered. */
  manual?: boolean;
}
export type MultiSelectProps =
  Omit<ListboxProps, 'multiple'> | SearchableMultiSelectProps;

function SearchableMultiSelect({
  label,
  name,
  options,
  value,
  defaultValue = [],
  onValueChange,
  searchable = true,
  maxSelected = Infinity,
  searchLabel = '옵션 검색',
  clearLabel = '전체 해제',
  loading = false,
  error,
  emptyMessage = '검색 결과가 없어요.',
  onRetry,
  onQueryChange,
  manual = false,
  className = '',
  ...props
}: SearchableMultiSelectProps) {
  const [internal, setInternal] = useState([...defaultValue]);
  const [query, setQuery] = useState('');
  const selected = [...(value ?? internal)];
  const visible = options.filter(
    (option) =>
      manual ||
      option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const update = (next: string[]) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  return (
    <fieldset {...props} className={`mega-multi-select ${className}`}>
      <legend>{label}</legend>
      {selected.map((item) => (
        <input key={item} type="hidden" name={name} value={item} />
      ))}
      <div className="mega-multi-select__summary">
        <span>{selected.length}개 선택</span>
        {selected.length ? (
          <Button
            type="button"
            size="sm"
            variant="text"
            onClick={() => update([])}
          >
            {clearLabel}
          </Button>
        ) : null}
      </div>
      {selected.length ? (
        <div className="mega-multi-select__chips">
          {selected.map((item) => (
            <Chip
              key={item}
              size="sm"
              aria-label={`${options.find((option) => option.value === item)?.label ?? item} 선택 해제`}
              onClick={() => update(selected.filter((value) => value !== item))}
            >
              {options.find((option) => option.value === item)?.label ?? item} ×
            </Chip>
          ))}
        </div>
      ) : null}
      {searchable ? (
        <Input
          type="search"
          aria-label={searchLabel}
          placeholder={searchLabel}
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            onQueryChange?.(event.currentTarget.value);
          }}
        />
      ) : null}
      <div
        className="mega-multi-select__options"
        aria-busy={loading || undefined}
      >
        {loading || error || !visible.length ? (
          <div role={error ? 'alert' : 'status'}>
            {loading ? '불러오는 중…' : (error ?? emptyMessage)}
            {!loading && error && onRetry ? (
              <Button variant="text" onClick={onRetry}>
                다시 시도
              </Button>
            ) : null}
          </div>
        ) : (
          visible.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <Checkbox
                key={option.value}
                shape="square"
                checked={checked}
                disabled={
                  option.disabled ||
                  (!checked && selected.length >= maxSelected)
                }
                onChange={() =>
                  update(
                    checked
                      ? selected.filter((item) => item !== option.value)
                      : [...selected, option.value],
                  )
                }
              >
                {option.label}
              </Checkbox>
            );
          })
        )}
      </div>
    </fieldset>
  );
}

export function MultiSelect(props: MultiSelectProps) {
  return 'options' in props ? (
    <SearchableMultiSelect {...props} />
  ) : (
    <Listbox {...props} multiple />
  );
}

export interface TreeSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface TreeSelectGroup {
  label: string;
  disabled?: boolean;
  options: readonly (TreeSelectOption | TreeSelectGroup)[];
}

export interface TreeSelectProps extends Omit<SelectProps, 'children'> {
  groups: readonly TreeSelectGroup[];
}

const flattenTreeOptions = (
  options: TreeSelectGroup['options'],
  path: readonly string[] = [],
  disabled = false,
): ReactNode[] =>
  options.flatMap((option) => {
    const optionDisabled = disabled || option.disabled === true;
    if ('options' in option)
      return flattenTreeOptions(
        option.options,
        [...path, option.label],
        optionDisabled,
      );
    return (
      <option
        key={[...path, option.label, option.value].join('/')}
        value={option.value}
        disabled={optionDisabled}
      >
        {[...path, option.label].join(' › ')}
      </option>
    );
  });

export function TreeSelect({ groups, ...props }: TreeSelectProps) {
  return (
    <Select {...props}>
      {groups.map((group) => (
        <optgroup
          key={group.label}
          label={group.label}
          disabled={group.disabled}
        >
          {flattenTreeOptions(group.options, [], group.disabled)}
        </optgroup>
      ))}
    </Select>
  );
}

export {
  AutoComplete as Autocomplete,
  DatePicker as DateInput,
  Field as FormField,
  InputColor as ColorInput,
  InputMask as MaskInput,
  InputNumber as NumberInput,
  InputOtp as OTPInput,
  InputPassword as PasswordInput,
  Label as FormLabel,
};

export type {
  AutoCompleteProps as AutocompleteProps,
  DatePickerProps as DateInputProps,
  FieldProps as FormFieldProps,
  InputColorProps as ColorInputProps,
  InputMaskProps as MaskInputProps,
  InputNumberProps as NumberInputProps,
  InputOtpProps as OTPInputProps,
  InputPasswordProps as PasswordInputProps,
  LabelProps as FormLabelProps,
};
