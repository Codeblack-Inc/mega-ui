import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Checkbox,
  Chip,
  Input,
  type InputProps,
  type ChipProps,
} from './controls';

export interface AutoCompleteProps extends Omit<InputProps, 'list' | 'type'> {
  suggestions: readonly string[];
}
/** Native suggestions allow free text; selection is not restricted to the list. */
export function AutoComplete({
  suggestions,
  className = '',
  ...props
}: AutoCompleteProps) {
  const list = useId();
  return (
    <>
      <Input
        {...props}
        className={`mega-autocomplete ${className}`}
        type="text"
        list={list}
      />
      <datalist id={list}>
        {suggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
    </>
  );
}

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: ReactNode;
}
export interface ComboboxProps extends Omit<
  InputProps,
  'value' | 'defaultValue' | 'onChange' | 'type'
> {
  options: readonly ComboboxOption[];
  value?: string;
  defaultValue?: string;
  query?: string;
  onQueryChange?: (query: string) => void;
  onValueChange?: (value: string) => void;
  loading?: boolean;
  error?: ReactNode;
  emptyMessage?: ReactNode;
  clearable?: boolean;
  renderOption?: (option: ComboboxOption) => ReactNode;
}
export function Combobox({
  options,
  value,
  defaultValue = '',
  query,
  onQueryChange,
  onValueChange,
  loading = false,
  error,
  emptyMessage = '검색 결과가 없어요.',
  clearable = true,
  renderOption,
  name,
  disabled,
  className = '',
  ...props
}: ComboboxProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalQuery, setInternalQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedValue = value ?? internalValue;
  const selected = options.find((option) => option.value === selectedValue);
  const search = (query ?? internalQuery).trim().toLocaleLowerCase();
  const filtered = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(search),
  );
  const setQuery = (next: string) => {
    if (query === undefined) setInternalQuery(next);
    onQueryChange?.(next);
  };
  const select = (option: ComboboxOption) => {
    if (value === undefined) setInternalValue(option.value);
    onValueChange?.(option.value);
    setQuery(option.label);
    setOpen(false);
  };
  const message = loading ? '불러오는 중…' : (error ?? emptyMessage);

  return (
    <div
      ref={root}
      className={`mega-combobox ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <Input
        {...props}
        disabled={disabled}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={
          open && filtered[active] ? `${id}-${active}` : undefined
        }
        value={
          open
            ? (query ?? internalQuery)
            : (selected?.label ?? query ?? internalQuery)
        }
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setActive((current) =>
              Math.max(
                0,
                Math.min(
                  filtered.length - 1,
                  current + (event.key === 'ArrowDown' ? 1 : -1),
                ),
              ),
            );
          }
          if (
            event.key === 'Enter' &&
            open &&
            filtered[active] &&
            !filtered[active].disabled
          ) {
            event.preventDefault();
            select(filtered[active]);
          }
        }}
      />
      {clearable && selectedValue && !disabled ? (
        <button
          type="button"
          className="mega-combobox__clear"
          aria-label="선택 해제"
          onClick={() => {
            if (value === undefined) setInternalValue('');
            onValueChange?.('');
            setQuery('');
          }}
        >
          ×
        </button>
      ) : null}
      {open ? (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="mega-combobox__listbox"
          aria-busy={loading || undefined}
        >
          {!loading && !error && filtered.length ? (
            filtered.map((option, index) => (
              <button
                id={`${id}-${index}`}
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === selectedValue}
                disabled={option.disabled}
                data-active={index === active || undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
              >
                {renderOption?.(option) ?? (
                  <>
                    <span>{option.label}</span>
                    {option.description ? (
                      <small>{option.description}</small>
                    ) : null}
                  </>
                )}
              </button>
            ))
          ) : (
            <span role="status">{message}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

export interface CheckboxGroupProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'children' | 'onChange' | 'defaultValue'
> {
  label: string;
  name: string;
  options: readonly { label: string; value: string; disabled?: boolean }[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
}
export function CheckboxGroup({
  label,
  name,
  options,
  value,
  defaultValue = [],
  onValueChange,
  className = '',
  ...props
}: CheckboxGroupProps) {
  return (
    <fieldset {...props} className={`mega-choice-group ${className}`}>
      <legend>{label}</legend>
      {options.map((option) => (
        <Checkbox
          key={option.value}
          name={name}
          value={option.value}
          disabled={option.disabled}
          shape="square"
          onChange={(event) => {
            const group = event.currentTarget.closest('fieldset');
            if (group)
              onValueChange?.(
                Array.from(
                  group.querySelectorAll<HTMLInputElement>('input:checked'),
                ).map((input) => input.value),
              );
          }}
          checked={
            value === undefined ? undefined : value.includes(option.value)
          }
          defaultChecked={
            value === undefined
              ? defaultValue.includes(option.value)
              : undefined
          }
        >
          {option.label}
        </Checkbox>
      ))}
    </fieldset>
  );
}

export type DatePickerProps = Omit<InputProps, 'type'>;
export function DatePicker(props: DatePickerProps) {
  return <Input {...props} type="date" />;
}
export type InputColorProps = Omit<InputProps, 'type'>;
export function InputColor({ className = '', ...props }: InputColorProps) {
  return (
    <Input
      {...props}
      type="color"
      className={`mega-input-color ${className}`}
    />
  );
}
export type InputNumberProps = Omit<InputProps, 'type'>;
export function InputNumber(props: InputNumberProps) {
  return <Input {...props} type="number" />;
}

export type LabelProps = ComponentPropsWithRef<'label'>;
export function Label({ className = '', ...props }: LabelProps) {
  return <label {...props} className={`mega-field__label ${className}`} />;
}

export interface FloatLabelProps extends ComponentPropsWithRef<'div'> {
  label: string;
  htmlFor: string;
}
/** Give the child input placeholder=" " so an empty value is detectable in CSS. */
export function FloatLabel({
  label,
  htmlFor,
  className = '',
  children,
  ...props
}: FloatLabelProps) {
  return (
    <div {...props} className={`mega-float-label ${className}`}>
      {children}
      <Label htmlFor={htmlFor}>{label}</Label>
    </div>
  );
}
export type IftaLabelProps = FloatLabelProps;
export function IftaLabel({ className = '', ...props }: IftaLabelProps) {
  return <FloatLabel {...props} className={`mega-ifta-label ${className}`} />;
}

export interface IconFieldProps extends ComponentPropsWithRef<'div'> {
  leading?: ReactNode;
  trailing?: ReactNode;
}
export function IconField({
  leading,
  trailing,
  children,
  className = '',
  ...props
}: IconFieldProps) {
  return (
    <div
      {...props}
      className={`mega-icon-field ${className}`}
      data-leading={leading ? true : undefined}
      data-trailing={trailing ? true : undefined}
    >
      {leading ? (
        <span className="mega-icon-field__leading">{leading}</span>
      ) : null}
      {children}
      {trailing ? (
        <span className="mega-icon-field__trailing">{trailing}</span>
      ) : null}
    </div>
  );
}
export interface InputGroupProps extends ComponentPropsWithRef<'div'> {
  leading?: ReactNode;
  trailing?: ReactNode;
}
export function InputGroup({
  leading,
  trailing,
  children,
  className = '',
  ...props
}: InputGroupProps) {
  return (
    <div {...props} className={`mega-input-group ${className}`}>
      {leading ? (
        <span className="mega-input-group__addon">{leading}</span>
      ) : null}
      {children}
      {trailing ? (
        <span className="mega-input-group__addon">{trailing}</span>
      ) : null}
    </div>
  );
}

type FormattedInputProps = Omit<
  InputProps,
  'value' | 'defaultValue' | 'onChange' | 'type'
> & {
  value: string;
  onValueChange: (value: string) => void;
};
// Keep composition text intact; normalize only after the IME commits it.
function FormattedInput({
  value,
  onValueChange,
  format,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: FormattedInputProps & { format: (value: string) => string }) {
  const [composition, setComposition] = useState<string | null>(null);
  return (
    <Input
      {...props}
      type="text"
      value={composition ?? value}
      onCompositionStart={(event) => {
        setComposition(event.currentTarget.value);
        onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        setComposition(null);
        onValueChange(format(event.currentTarget.value));
        onCompositionEnd?.(event);
      }}
      onChange={(event) => {
        if (
          composition !== null ||
          (event.nativeEvent as InputEvent).isComposing
        )
          setComposition(event.currentTarget.value);
        else onValueChange(format(event.currentTarget.value));
      }}
    />
  );
}

export interface InputMaskProps extends FormattedInputProps {
  /** # is a digit slot; other characters are literal separators. */ mask: string;
}
export function InputMask({ mask, ...props }: InputMaskProps) {
  return (
    <FormattedInput
      {...props}
      inputMode={props.inputMode ?? 'numeric'}
      format={(value) => {
        const digits = value.replace(/\D/g, '');
        let index = 0;
        let result = '';
        for (const char of mask) {
          if (index >= digits.length) break;
          result += char === '#' ? digits[index++] : char;
        }
        return result;
      }}
    />
  );
}
export interface KeyFilterProps extends FormattedInputProps {
  filter?: 'digits' | 'alpha' | 'alphanumeric';
}
export function KeyFilter({ filter = 'digits', ...props }: KeyFilterProps) {
  return (
    <FormattedInput
      {...props}
      inputMode={props.inputMode ?? (filter === 'digits' ? 'numeric' : 'text')}
      format={(value) =>
        value.replace(
          filter === 'digits'
            ? /[^0-9]/g
            : filter === 'alpha'
              ? /[^a-zA-Z]/g
              : /[^a-zA-Z0-9]/g,
          '',
        )
      }
    />
  );
}

export interface InputOtpProps extends Omit<
  InputProps,
  'type' | 'maxLength' | 'pattern'
> {
  length?: number;
}
/** One real input (invisible, over the boxes) preserves mobile autofill, paste, selection and native validation. */
export function InputOtp({
  length = 6,
  className = '',
  variant,
  size,
  value,
  defaultValue,
  onChange,
  ref,
  style,
  ...props
}: InputOtpProps) {
  const count = Number.isFinite(length)
    ? Math.max(1, Math.trunc(length) || 6)
    : 6;
  const [local, setLocal] = useState(String(defaultValue ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);
  const text = String(value ?? local);
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form || value !== undefined) return;
    const reset = () =>
      queueMicrotask(() => setLocal(inputRef.current?.value ?? ''));
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [value]);
  return (
    <span
      className={`mega-input-otp ${variant === 'box' ? 'mega-input-otp--box' : ''} ${size && size !== 'md' ? `mega-input-otp--${size}` : ''} ${className}`}
      style={{ '--_otp-length': count, ...style } as CSSProperties}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="mega-input-otp__box"
          data-active={
            index === Math.min(text.length, count - 1) ? '' : undefined
          }
          aria-hidden="true"
        >
          {text[index]}
        </span>
      ))}
      <input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === 'function') return ref(node);
          if (ref) ref.current = node;
        }}
        autoComplete="one-time-code"
        inputMode="numeric"
        {...props}
        type="text"
        maxLength={count}
        pattern={`[0-9]{${count}}`}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          setLocal(event.currentTarget.value);
          onChange?.(event);
        }}
        className="mega-input-otp__input"
      />
    </span>
  );
}

export interface InputPasswordProps extends Omit<InputProps, 'type'> {
  showLabel?: string;
  hideLabel?: string;
}
export function InputPassword({
  showLabel = '비밀번호 보기',
  hideLabel = '비밀번호 숨기기',
  disabled,
  ...props
}: InputPasswordProps) {
  const [visible, setVisible] = useState(false);
  return (
    <IconField
      trailing={
        <button
          type="button"
          className="mega-password-toggle"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? '숨김' : '보기'}
        </button>
      }
    >
      <Input
        autoComplete="current-password"
        {...props}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
      />
    </IconField>
  );
}

export interface InputTagsProps extends Omit<
  InputProps,
  'value' | 'defaultValue' | 'onChange' | 'type'
> {
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  removeLabel?: (tag: string) => string;
}
export function InputTags({
  value,
  onValueChange,
  removeLabel = (tag) => `${tag} 삭제`,
  name,
  disabled,
  readOnly,
  onKeyDown,
  onBlur,
  ...props
}: InputTagsProps) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const tag = draft.trim();
    if (disabled || readOnly || !tag) return;
    if (!value.includes(tag)) onValueChange([...value, tag]);
    setDraft('');
  };
  return (
    <div className="mega-tags">
      <div className="mega-tags__items">
        {value.map((tag) => (
          <span className="mega-tags__tag" key={tag}>
            {tag}
            <button
              type="button"
              disabled={disabled || readOnly}
              aria-label={removeLabel(tag)}
              onClick={() =>
                onValueChange(value.filter((item) => item !== tag))
              }
            >
              ×
            </button>
            {name ? (
              <input
                type="hidden"
                name={name}
                value={tag}
                disabled={disabled}
                form={props.form}
              />
            ) : null}
          </span>
        ))}
      </div>
      <Input
        {...props}
        disabled={disabled}
        readOnly={readOnly}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            !event.defaultPrevented &&
            !event.nativeEvent.isComposing &&
            event.key === 'Enter'
          ) {
            event.preventDefault();
            add();
          }
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (!event.defaultPrevented) add();
        }}
      />
    </div>
  );
}

export type ListboxProps = ComponentPropsWithRef<'select'>;
export function Listbox({ size = 5, className = '', ...props }: ListboxProps) {
  return (
    <select
      {...props}
      size={Math.max(2, size)}
      className={`mega-input mega-listbox ${className}`}
    />
  );
}
export type SliderProps = Omit<ComponentPropsWithRef<'input'>, 'type'>;
export function Slider({ className = '', ...props }: SliderProps) {
  return (
    <input {...props} type="range" className={`mega-slider ${className}`} />
  );
}

export interface KnobProps extends Omit<
  SliderProps,
  'value' | 'defaultValue' | 'min' | 'max'
> {
  value: number;
  min?: number;
  max?: number;
  label: string;
}
/** A native range remains the keyboard and pointer control for the circular readout. */
export function Knob({
  value,
  min = 0,
  max = 100,
  label,
  className = '',
  ...props
}: KnobProps) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  const lowerBound = Math.min(safeMin, safeMax);
  const upperBound = Math.max(safeMin, safeMax);
  const safeValue = Math.max(
    lowerBound,
    Math.min(upperBound, Number.isFinite(value) ? value : lowerBound),
  );
  const progress =
    upperBound > lowerBound
      ? (safeValue - lowerBound) / (upperBound - lowerBound)
      : 0;
  return (
    <div className="mega-knob">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="40" />
        <circle
          className="mega-knob__value"
          cx="50"
          cy="50"
          r="40"
          pathLength="100"
          strokeDasharray={`${progress * 100} 100`}
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central">
          {safeValue}
        </text>
      </svg>
      <Slider
        {...props}
        className={className}
        aria-label={label}
        value={safeValue}
        min={lowerBound}
        max={upperBound}
      />
    </div>
  );
}

export interface RatingProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'children' | 'onChange'
> {
  label: string;
  name?: string;
  value: number;
  max?: number;
  onValueChange?: (value: number) => void;
}
export function Rating({
  label,
  name,
  value,
  max = 5,
  onValueChange,
  className = '',
  ...props
}: RatingProps) {
  const id = useId();
  return (
    <fieldset {...props} className={`mega-rating ${className}`}>
      <legend>{label}</legend>
      {Array.from(
        { length: Math.max(1, Math.trunc(max) || 5) },
        (_, index) => index + 1,
      ).map((score) => (
        <label key={score} data-filled={score <= value || undefined}>
          <input
            type="radio"
            name={name ?? id}
            value={score}
            checked={value === score}
            onChange={() => onValueChange?.(score)}
            aria-label={`${score} / ${max}`}
          />
          <span aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  );
}

export interface ToggleButtonProps extends Omit<ChipProps, 'selected'> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}
export function ToggleButton({
  pressed,
  defaultPressed = false,
  onPressedChange,
  onClick,
  ...props
}: ToggleButtonProps) {
  const [internal, setInternal] = useState(defaultPressed);
  const selected = pressed ?? internal;
  return (
    <Chip
      {...props}
      selected={selected}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (pressed === undefined) setInternal(!selected);
        onPressedChange?.(!selected);
      }}
    />
  );
}
