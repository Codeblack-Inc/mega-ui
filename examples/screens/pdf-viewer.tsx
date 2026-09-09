import { useEffect, useState } from 'react';
import { Alert, Checkbox, PageHeader, Select, Stack } from '@mega-ui/react';
import { PdfViewerPro } from '@mega-ui/react/pdf-viewer';
import '@mega-ui/react/pdf-viewer.css';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const files = [
  { id: 'report', name: '분기 보고서.pdf', url: './sample-report.pdf' },
  { id: 'form', name: '검토 요청서.pdf', url: './sample-form.pdf' },
  { id: 'broken', name: '손상된 파일.pdf', url: './llms.txt' },
];
export function PdfViewerDemo() {
  return (
    <PdfViewerPro
      source="./sample-report.pdf"
      name="분기 보고서.pdf"
      label="분기 보고서"
      workerSrc={workerSrc}
    />
  );
}
const storageKey = 'mega-pdf-example-v1';
export function PdfViewerExample() {
  const [id, setId] = useState('report');
  const [fail, setFail] = useState(false);
  const [saved, setSaved] = useState<{ name: string; size: number } | null>(
    null,
  );
  const [source, setSource] = useState<string | Uint8Array>(files[0]!.url);
  const [note, setNote] = useState('');
  const file = files.find((item) => item.id === id) ?? files[0]!;
  useEffect(() => {
    setSource(file.url);
    setSaved(null);
    setNote('');
  }, [file.url]);
  const openSaved = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setNote(
          '이 브라우저에 저장한 문서가 없어요. 문서를 저장한 뒤 다시 열어 주세요.',
        );
        return;
      }
      const bytes = Uint8Array.from(atob(stored), (char) => char.charCodeAt(0));
      setSource(bytes);
      setNote('저장한 문서를 다시 열었어요.');
    } catch {
      setNote('저장한 문서를 열지 못했어요. 브라우저 저장소를 확인해 주세요.');
    }
  };
  return (
    <Stack gap={4}>
      <PageHeader
        title="문서 검토와 서식 작성"
        description="PDF를 읽고 검색하고, 양식에 입력한 뒤 저장·인쇄해요. 저장은 이 브라우저의 저장소에 기록해요."
      />
      <PdfViewerPro
        key={`${file.id}-${typeof source === 'string' ? source : 'bytes'}`}
        source={source}
        name={file.name}
        label={file.name}
        workerSrc={workerSrc}
        onSave={async (bytes, name) => {
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (fail) throw new Error('Example save failure');
          let binary = '';
          for (const byte of bytes) binary += String.fromCharCode(byte);
          localStorage.setItem(storageKey, btoa(binary));
          setSaved({ name, size: bytes.length });
        }}
      />
      {saved && (
        <Alert tone="success">
          {saved.name}을(를) 저장했어요. {saved.size.toLocaleString('ko-KR')}
          바이트를 이 브라우저에 기록했어요.
        </Alert>
      )}
      {note && <Alert>{note}</Alert>}
      <Stack direction="row" gap={3} wrap align="end">
        <label>
          예제 문서
          <Select
            aria-label="예제 문서"
            value={id}
            onChange={(event) => setId(event.target.value)}
          >
            {files.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </label>
        <Checkbox
          checked={fail}
          onChange={(event) => setFail(event.target.checked)}
        >
          저장 실패 재현
        </Checkbox>
        <button
          type="button"
          className="mega-button mega-button--secondary mega-button--md"
          onClick={openSaved}
        >
          브라우저 저장본 열기
        </button>
      </Stack>
    </Stack>
  );
}
