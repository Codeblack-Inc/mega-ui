import { useEffect, useRef, useState } from 'react';
import {
  ActiveFilters,
  Alert,
  BarChart,
  BulkActionBar,
  Button,
  Checkbox,
  DataGrid,
  DataPagination,
  Dialog,
  Field,
  FileUploadList,
  FilterBar,
  FormActions,
  FormErrorSummary,
  FormSection,
  InlineEdit,
  Input,
  LineChart,
  MegaIcon,
  MultiSelect,
  NotificationList,
  SelectionCard,
  Sparkline,
  Stack,
  Text,
  Textarea,
  useToast,
  type DataTableSort,
  type FileUploadItem,
  type FormSummaryError,
} from '@mega-ui/react';

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 500));

/** Local transport simulation: the production app supplies its own API and router. */
export function SaveWorkflow() {
  const [saved, setSaved] = useState({
    name: '김메가',
    email: 'mega@example.com',
    bio: '일상의 좋은 경험을 만들어요.',
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<FormSummaryError[]>([]);
  const [leaving, setLeaving] = useState(false);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const form = useRef<HTMLFormElement>(null);
  const inFlight = useRef(false);
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    const confirmRoute = (event: Event) => {
      if (
        !window.confirm(
          saving
            ? '저장이 진행 중이에요. 화면을 나갈까요?'
            : '저장하지 않은 변경 사항을 버리고 이동할까요?',
        )
      )
        event.preventDefault();
    };
    window.addEventListener('mega-before-route', confirmRoute);
    return () => {
      window.removeEventListener('beforeunload', warn);
      window.removeEventListener('mega-before-route', confirmRoute);
    };
  }, [dirty, saving]);

  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        저장·실패·재시도 예제예요. 실제 서버에는 저장하지 않아요.
      </Text>
      <Checkbox
        checked={failNext}
        disabled={saving}
        onChange={(event) => setFailNext(event.currentTarget.checked)}
      >
        다음 저장 실패 체험
      </Checkbox>
      <form
        ref={form}
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          if (inFlight.current) return;
          const invalid = Array.from(event.currentTarget.elements).flatMap(
            (element) => {
              if (
                !(element instanceof HTMLInputElement) ||
                element.validity.valid
              )
                return [];
              return [
                {
                  id: element.id,
                  label: element.name === 'name' ? '이름' : '이메일',
                  message: element.validationMessage,
                },
              ];
            },
          );
          setErrors(invalid);
          if (invalid.length) return;
          inFlight.current = true;
          setSaving(true);
          setStatus('');
          try {
            await pause();
            if (failNext)
              throw new Error(
                '저장하지 못했어요. 입력은 유지했으니 다시 시도해 주세요.',
              );
            setSaved(draft);
            setStatus('저장했어요.');
          } catch (reason) {
            setStatus((reason as Error).message);
            setFailNext(false);
          } finally {
            inFlight.current = false;
            setSaving(false);
          }
        }}
      >
        <Stack gap={4}>
          <FormErrorSummary
            key={errors.map((error) => error.message).join()}
            errors={errors}
          />
          <FormSection title="프로필" description="이름과 연락처를 관리해요.">
            {(['name', 'email'] as const).map((key) => (
              <Field
                key={key}
                label={key === 'name' ? '이름' : '이메일'}
                htmlFor={`workflow-${key}`}
                error={
                  errors.find((error) => error.id === `workflow-${key}`)
                    ?.message as string | undefined
                }
                required
              >
                <Input
                  id={`workflow-${key}`}
                  name={key}
                  type={key === 'email' ? 'email' : 'text'}
                  autoComplete={key}
                  required
                  disabled={saving}
                  value={draft[key]}
                  aria-invalid={
                    errors.some((error) => error.id === `workflow-${key}`) ||
                    undefined
                  }
                  aria-describedby={
                    errors.some((error) => error.id === `workflow-${key}`)
                      ? `workflow-${key}-description`
                      : undefined
                  }
                  onChange={(event) => {
                    setDraft({ ...draft, [key]: event.currentTarget.value });
                    setStatus('');
                  }}
                />
              </Field>
            ))}
            <Field label="소개" htmlFor="workflow-bio">
              <Textarea
                id="workflow-bio"
                disabled={saving}
                value={draft.bio}
                onChange={(event) => {
                  setDraft({ ...draft, bio: event.currentTarget.value });
                  setStatus('');
                }}
              />
            </Field>
          </FormSection>
          <FormActions
            dirty={dirty}
            saving={saving}
            status={status}
            statusTone={status === '저장했어요.' ? 'success' : 'danger'}
            onCancel={() => {
              setDraft(saved);
              setErrors([]);
              setStatus('');
            }}
          />
        </Stack>
      </form>
      <Button
        variant="text"
        disabled={saving}
        onClick={() => (dirty ? setLeaving(true) : location.assign('#home'))}
      >
        편집을 마치고 소개로 이동
      </Button>
      <Dialog
        open={leaving}
        onClose={() => setLeaving(false)}
        title="변경 사항을 버릴까요?"
        description="저장하지 않은 입력은 사라져요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setLeaving(false)}>
              계속 편집
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDraft(saved);
                setLeaving(false);
                location.assign('#home');
              }}
            >
              변경 사항 버리고 이동
            </Button>
          </>
        }
      />
    </Stack>
  );
}

const seedRows = [
  { id: '1', name: '김민준' },
  { id: '2', name: '이서연' },
  { id: '3', name: '박지훈' },
];
export function ListWorkflow() {
  const [rows, setRows] = useState(seedRows);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSort>({
    key: 'name',
    direction: 'asc',
  });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const lock = useRef(false);
  const filtered = rows
    .filter((row) => row.name.includes(query))
    .sort(
      (a, b) =>
        (sort.direction === 'asc' ? 1 : -1) *
        a.name.localeCompare(b.name, 'ko'),
    );
  const process = async (ids: string[], retry = false) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    await pause();
    const failures: string[] = retry ? [] : ids.filter((id) => id === '2');
    setRows((current) =>
      current.filter(
        (row) => !ids.includes(row.id) || failures.includes(row.id),
      ),
    );
    setFailed(failures);
    setSelected(failures);
    setPage(1);
    setBusy(false);
    lock.current = false;
  };
  return (
    <Stack gap={3}>
      <Text size="sm" tone="muted">
        예제 응답을 정렬·페이지 단위로 전달해요. 이서연 항목은 첫 보관 시
        실패해요.
      </Text>
      <FilterBar
        search={
          <Input
            type="search"
            aria-label="팀원 검색"
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setPage(1);
            }}
          />
        }
      />
      <ActiveFilters
        filters={query ? [{ id: 'query', label: `이름: ${query}` }] : []}
        onRemove={() => {
          setQuery('');
          setPage(1);
        }}
      />
      <BulkActionBar count={selected.length} onClear={() => setSelected([])}>
        <Button disabled={busy} onClick={() => void process(selected)}>
          선택 항목 보관
        </Button>
      </BulkActionBar>
      {failed.length ? (
        <Alert tone="danger">
          {failed.length}개를 보관하지 못했어요.{' '}
          <Button
            variant="text"
            disabled={busy}
            onClick={() => void process(failed, true)}
          >
            실패한 항목만 재시도
          </Button>
        </Alert>
      ) : null}
      <DataGrid
        label="작업 대상"
        manual
        rows={filtered.slice((page - 1) * 2, page * 2)}
        columns={[{ key: 'name', header: '이름', sortable: true }]}
        getRowId={(row) => row.id}
        selectedIds={selected}
        onSelectionChange={setSelected}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        loading={busy}
      />
      <DataPagination
        total={filtered.length}
        page={page}
        pageSize={2}
        onPageChange={setPage}
      />
    </Stack>
  );
}

export function RemoteSelectionDemo() {
  const [state, setState] = useState('ready');
  return (
    <Stack gap={3}>
      <label>
        표시 상태{' '}
        <select
          value={state}
          onChange={(event) => setState(event.currentTarget.value)}
        >
          <option value="ready">정상</option>
          <option value="empty">빈 결과</option>
          <option value="loading">로딩</option>
          <option value="error">오류</option>
          <option value="disabled">비활성</option>
        </select>
      </label>
      <MultiSelect
        label="참여 팀"
        name="teams"
        disabled={state === 'disabled'}
        options={
          state === 'empty'
            ? []
            : [
                { value: 'design', label: '디자인' },
                { value: 'dev', label: '개발' },
              ]
        }
        loading={state === 'loading'}
        error={state === 'error' ? '팀 목록을 불러오지 못했어요.' : undefined}
        onRetry={() => setState('ready')}
      />
    </Stack>
  );
}

export function FeedbackDemo() {
  const toast = useToast();
  const handle = useRef<ReturnType<typeof toast> | null>(null);
  const [name, setName] = useState('분기 보고서');
  const [files, setFiles] = useState<FileUploadItem[]>([
    { id: '1', name: '보고서.pdf', status: 'error', error: '전송이 끊겼어요.' },
    { id: '2', name: '내역.csv', status: 'uploading', progress: 42 },
  ]);
  const [read, setRead] = useState(false);
  return (
    <Stack gap={4}>
      <Stack direction="row" wrap gap={2}>
        <Button
          onClick={() => {
            handle.current?.dismiss();
            handle.current = toast({
              title: '보고서를 준비하고 있어요',
              duration: 0,
            });
          }}
        >
          지속형 알림
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            handle.current?.update({
              title: '보고서가 준비됐어요',
              tone: 'success',
              duration: 3000,
            })
          }
        >
          알림 갱신
        </Button>
      </Stack>
      <FileUploadList
        items={files}
        onRetry={(id) =>
          setFiles(
            files.map((file) =>
              file.id === id
                ? { ...file, status: 'complete', error: undefined }
                : file,
            ),
          )
        }
        onCancel={(id) => setFiles(files.filter((file) => file.id !== id))}
        onRemove={(id) => setFiles(files.filter((file) => file.id !== id))}
      />
      <NotificationList
        items={[
          {
            id: 'notice',
            group: '오늘',
            title: '보고서를 확인해 주세요',
            read,
          },
        ]}
        onRead={() => setRead(true)}
        onReadAll={() => setRead(true)}
      />
      <InlineEdit label="보고서 제목" value={name} onSave={setName} />
      <SelectionCard
        name="delivery"
        value="email"
        title="이메일로 받기"
        icon={<MegaIcon name="bell" />}
      />
    </Stack>
  );
}

export function ChartDemo() {
  const [empty, setEmpty] = useState(false);
  const data = empty
    ? []
    : [
        { label: '월', value: -20 },
        { label: '화', value: 0 },
        { label: '수', value: 40 },
      ];
  return (
    <Stack gap={4}>
      <Checkbox
        checked={empty}
        onChange={(event) => setEmpty(event.currentTarget.checked)}
      >
        빈 데이터 확인
      </Checkbox>
      <BarChart
        label="일별 손익"
        data={data}
        formatValue={(value) => `${value}만원`}
      />
      <BarChart
        label="일별 손익 · 세로"
        orientation="vertical"
        data={data}
        formatValue={(value) => `${value}만원`}
      />
      <LineChart
        label="손익 추이"
        data={data}
        formatValue={(value) => `${value}만원`}
      />
      <Sparkline
        label="손익 추이 요약"
        values={data.map((item) => item.value)}
      />
    </Stack>
  );
}
