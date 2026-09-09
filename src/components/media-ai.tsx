import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { Button, Textarea, type TextareaProps } from './controls';
import { Dialog, type DialogProps } from './overlay';

export interface ImageProps extends ComponentPropsWithRef<'img'> {
  alt: string;
  fallback?: ReactNode;
}
export function Image({
  src,
  alt,
  fallback,
  onError,
  className = '',
  ...props
}: ImageProps) {
  const [failed, setFailed] = useState<string>();
  const source = src || props.srcSet;
  return !source || failed === source ? (
    <span
      className={`mega-image-fallback ${className}`}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={!alt || undefined}
    >
      {fallback ?? '이미지를 불러오지 못했어요.'}
    </span>
  ) : (
    <img
      loading="lazy"
      {...props}
      src={src}
      alt={alt}
      className={`mega-image ${className}`}
      onError={(e) => {
        setFailed(source);
        onError?.(e);
      }}
    />
  );
}
export interface ImageViewerProps extends Omit<DialogProps, 'children'> {
  src: string;
  alt: string;
}
export function ImageViewer({ src, alt, ...props }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    setZoom(1);
  }, [src, props.open]);
  return (
    <Dialog size="lg" {...props}>
      <div className="mega-image-viewer">
        <Image
          src={src}
          alt={alt}
          style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
        />
      </div>
      <div className="mega-media-actions">
        <Button
          variant="secondary"
          disabled={zoom <= 1}
          onClick={() => setZoom((v) => v - 0.5)}
        >
          축소
        </Button>
        <span aria-live="polite">{zoom * 100}%</span>
        <Button
          variant="secondary"
          disabled={zoom >= 3}
          onClick={() => setZoom((v) => v + 0.5)}
        >
          확대
        </Button>
      </div>
    </Dialog>
  );
}
export interface GalleryProps extends ComponentPropsWithRef<'div'> {
  images: readonly { src: string; alt: string; thumbnail?: string }[];
  label: string;
}
export function Gallery({
  images,
  label,
  className = '',
  ...props
}: GalleryProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const item = selected === null ? undefined : images[selected];
  return (
    <div
      {...props}
      className={`mega-gallery ${className}`}
      role="group"
      aria-label={label}
    >
      {images.map((image, i) => (
        <button
          type="button"
          key={`${image.src}-${i}`}
          aria-label={`${image.alt} 확대`}
          onClick={() => setSelected(i)}
        >
          <Image src={image.thumbnail ?? image.src} alt={image.alt} />
        </button>
      ))}
      {item && (
        <ImageViewer
          open
          title={item.alt}
          src={item.src}
          alt={item.alt}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
export interface DropzoneProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'onChange'
> {
  label: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSize?: number;
  onFilesChange: (files: File[]) => void;
  onReject?: (message: string) => void;
}
export function Dropzone({
  label,
  accept,
  multiple = false,
  disabled = false,
  maxSize,
  onFilesChange,
  onReject,
  className = '',
  children,
  onDragOver,
  onDrop,
  ...props
}: DropzoneProps) {
  const [error, setError] = useState('');
  const id = useId();
  const receive = (files: File[]) => {
    if (disabled) return;
    const patterns =
      accept
        ?.split(',')
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean) ?? [];
    const invalid =
      (!multiple && files.length > 1) ||
      files.some(
        (file) =>
          (maxSize !== undefined && file.size > maxSize) ||
          (patterns.length > 0 &&
            !patterns.some((pattern) =>
              pattern.startsWith('.')
                ? file.name.toLowerCase().endsWith(pattern)
                : pattern.endsWith('/*')
                  ? file.type.toLowerCase().startsWith(pattern.slice(0, -1))
                  : file.type.toLowerCase() === pattern,
            )),
      );
    if (invalid) {
      const message = '파일 형식, 크기 또는 개수를 확인해 주세요.';
      setError(message);
      onReject?.(message);
      return;
    }
    setError('');
    onFilesChange(files);
  };
  return (
    <div
      {...props}
      className={`mega-dropzone ${className}`}
      data-disabled={disabled || undefined}
      onDragOver={(e) => {
        onDragOver?.(e);
        if (!e.defaultPrevented) e.preventDefault();
      }}
      onDrop={(e) => {
        onDrop?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        receive(Array.from(e.dataTransfer.files));
      }}
    >
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          receive(Array.from(e.currentTarget.files ?? []));
          e.currentTarget.value = '';
        }}
      />
      {children}
      {error && (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export interface FileUploadProps extends DropzoneProps {
  files?: readonly File[];
}
/** Selection only. Applications own transport, authorization and server validation. */
export function FileUpload({
  files,
  onFilesChange,
  ...props
}: FileUploadProps) {
  const [selected, setSelected] = useState<readonly File[]>([]);
  return (
    <div className="mega-file-upload">
      <Dropzone
        {...props}
        onFilesChange={(next) => {
          setSelected(next);
          onFilesChange(next);
        }}
      />
      <ul>
        {(files ?? selected).map((file, i) => (
          <li key={`${file.name}-${i}`}>
            {file.name} · {Math.ceil(file.size / 1024)} KB
          </li>
        ))}
      </ul>
    </div>
  );
}
export interface PDFViewerProps extends ComponentPropsWithRef<'object'> {
  src: string;
  label: string;
}
export function PDFViewer({
  src,
  label,
  className = '',
  children,
  ...props
}: PDFViewerProps) {
  return (
    <object
      {...props}
      className={`mega-pdf-viewer ${className}`}
      data={src}
      type="application/pdf"
      aria-label={label}
    >
      {children ?? (
        <a href={src} target="_blank" rel="noreferrer">
          {label} 열기
        </a>
      )}
    </object>
  );
}
export interface FilePreviewProps extends ComponentPropsWithRef<'div'> {
  file: File;
}
export function FilePreview({
  file,
  className = '',
  ...props
}: FilePreviewProps) {
  const [preview, setPreview] = useState<{ file: File; url: string }>();
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const url = preview?.file === file ? preview.url : undefined;
  return (
    <div className={`mega-file-preview ${className}`} {...props}>
      {url &&
        (file.type.startsWith('image/') ? (
          <Image src={url} alt={file.name} />
        ) : file.type === 'application/pdf' ? (
          <PDFViewer src={url} label={file.name} />
        ) : (
          <a href={url} download={file.name}>
            {file.name} 다운로드
          </a>
        ))}
      <p>
        {file.name} · {Math.ceil(file.size / 1024)} KB
      </p>
    </div>
  );
}
export interface ChatProps extends ComponentPropsWithRef<'section'> {
  label: string;
}
export function Chat({ label, className = '', ...props }: ChatProps) {
  return (
    <section
      role="log"
      aria-label={label}
      aria-live="polite"
      aria-relevant="additions"
      {...props}
      className={`mega-chat ${className}`}
    />
  );
}
export interface MessageBubbleProps extends ComponentPropsWithRef<'article'> {
  author: string;
  side?: 'start' | 'end';
  time?: string;
}
export function MessageBubble({
  author,
  side = 'start',
  time,
  children,
  className = '',
  ...props
}: MessageBubbleProps) {
  return (
    <article
      {...props}
      className={`mega-message-bubble ${className}`}
      data-side={side}
    >
      <header>
        {author}
        {time && <time>{time}</time>}
      </header>
      <div>{children}</div>
    </article>
  );
}
export interface PromptInputProps extends Omit<
  TextareaProps,
  'onSubmit' | 'value' | 'defaultValue'
> {
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (value: string) => void | Promise<void>;
  busy?: boolean;
  onStop?: () => void;
}
export function PromptInput({
  label,
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  busy = false,
  onStop,
  disabled,
  onChange,
  onKeyDown,
  className = '',
  ...props
}: PromptInputProps) {
  const [draft, setDraft] = useState(defaultValue);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const current = value ?? draft;
  const update = (text: string) => {
    if (value === undefined) setDraft(text);
    onValueChange?.(text);
  };
  const send = async () => {
    if (disabled || busy || pending.current || !current.trim()) return;
    pending.current = true;
    setSending(true);
    setError('');
    try {
      await onSubmit(current.trim());
      update('');
    } catch {
      setError('메시지를 보내지 못했어요. 다시 시도해 주세요.');
    } finally {
      pending.current = false;
      setSending(false);
    }
  };
  return (
    <div className={`mega-prompt-input ${className}`}>
      <Textarea
        {...props}
        aria-label={label}
        value={current}
        disabled={disabled || busy || sending}
        onChange={(e) => {
          onChange?.(e);
          update(e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (
            !e.defaultPrevented &&
            e.key === 'Enter' &&
            !e.shiftKey &&
            !e.nativeEvent.isComposing
          ) {
            e.preventDefault();
            void send();
          }
        }}
      />
      {error && <p role="alert">{error}</p>}
      <div className="mega-media-actions">
        {busy && onStop ? (
          <Button variant="secondary" onClick={onStop}>
            생성 중지
          </Button>
        ) : (
          <Button
            disabled={disabled || busy || sending || !current.trim()}
            onClick={() => {
              void send();
            }}
          >
            보내기
          </Button>
        )}
      </div>
    </div>
  );
}
export interface StreamingTextProps extends ComponentPropsWithRef<'div'> {
  text: string;
  streaming?: boolean;
}
export function StreamingText({
  text,
  streaming = false,
  className = '',
  ...props
}: StreamingTextProps) {
  return (
    <div
      {...props}
      className={`mega-streaming-text ${className}`}
      aria-busy={streaming}
      aria-live={streaming ? 'off' : 'polite'}
    >
      {text}
      {streaming && <span aria-hidden="true"> ▍</span>}
    </div>
  );
}
export interface AgentActivityProps extends ComponentPropsWithRef<'ol'> {
  steps: readonly {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    detail?: ReactNode;
  }[];
  label?: string;
}
export function AgentActivity({
  steps,
  label = '에이전트 작업 상태',
  className = '',
  ...props
}: AgentActivityProps) {
  const names = {
    pending: '대기',
    running: '진행 중',
    complete: '완료',
    error: '오류',
  };
  return (
    <ol
      {...props}
      className={`mega-agent-activity ${className}`}
      aria-label={label}
      aria-live="polite"
    >
      {steps.map((step) => (
        <li key={step.id} data-status={step.status}>
          <span className="mega-agent-activity__status">
            {step.status === 'running' ? (
              <span className="mega-spinner" aria-hidden="true" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {step.status === 'complete' ? (
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                ) : step.status === 'error' ? (
                  <path d="M12 5v8m0 4.5v.01" />
                ) : (
                  <circle cx="12" cy="12" r="8.5" />
                )}
              </svg>
            )}
            {names[step.status]}
          </span>{' '}
          {step.label}
          {step.detail && <div>{step.detail}</div>}
        </li>
      ))}
    </ol>
  );
}
