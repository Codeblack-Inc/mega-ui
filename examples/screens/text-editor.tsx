import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  PageHeader,
  Stack,
} from '@mega-ui/react';
import {
  TextEditor,
  parseTextEditorDocument,
  serializeTextEditorDocument,
  type TextEditorDocument,
} from '@mega-ui/react/text-editor';

const storageKey = 'mega-ui:text-editor:example:v1';
const initial: TextEditorDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '팀 운영 안내' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '회의에서 결정한 내용과 다음 할 일을 적어 주세요.',
        },
      ],
    },
  ],
};

export function TextEditorExample() {
  const [loaded] = useState(() => {
    try {
      const text = localStorage.getItem(storageKey);
      return {
        document: text ? parseTextEditorDocument(text) : initial,
        error: false,
      };
    } catch {
      return { document: initial, error: true };
    }
  });
  const [saved, setSaved] = useState(loaded.document);
  const [start, setStart] = useState(loaded.document);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fail, setFail] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [cancel, setCancel] = useState(false);
  return (
    <Stack gap={4}>
      <PageHeader
        title="팀 운영 문서"
        description="이 예제는 현재 브라우저에 저장해요. 저장하지 않은 내용은 화면을 닫으면 사라져요."
      />
      {loaded.error ? (
        <Alert tone="danger" role="alert">
          보관된 문서를 불러오지 못했어요. 원본은 바꾸지 않았어요. 브라우저
          저장소의 접근 설정과 문서 형식을 점검한 뒤 새로고침해 주세요.
        </Alert>
      ) : (
        <>
          <div className="mega-text-editor__tools">
            <Checkbox
              checked={fail}
              disabled={saving}
              onChange={(event) => setFail(event.target.checked)}
            >
              저장 실패 시뮬레이션
            </Checkbox>
            <Checkbox
              checked={readOnly}
              disabled={saving}
              onChange={(event) => setReadOnly(event.target.checked)}
            >
              읽기 전용
            </Checkbox>
            <Button
              variant="secondary"
              disabled={!dirty || saving || readOnly}
              onClick={() => setCancel(true)}
            >
              변경 취소
            </Button>
          </div>
          <TextEditor
            key={revision}
            label="팀 운영 문서 본문"
            defaultValue={start}
            readOnly={readOnly}
            onChange={(document) =>
              setDirty(JSON.stringify(document) !== JSON.stringify(saved))
            }
            onSave={async (document) => {
              setSaving(true);
              try {
                await new Promise((resolve) => setTimeout(resolve, 200));
                if (fail) throw new Error('Simulated save failure');
                localStorage.setItem(
                  storageKey,
                  serializeTextEditorDocument(document),
                );
                setSaved(document);
                setDirty(false);
              } finally {
                setSaving(false);
              }
            }}
          />
          <Dialog
            open={cancel}
            onClose={() => setCancel(false)}
            title="변경 사항을 취소할까요?"
            description="이 화면에서 편집한 내용을 지우고 마지막으로 저장한 문서로 돌아가요."
            actions={
              <>
                <Button variant="secondary" onClick={() => setCancel(false)}>
                  계속 편집
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setStart(saved);
                    setRevision((value) => value + 1);
                    setDirty(false);
                    setCancel(false);
                  }}
                >
                  변경 사항 지우기
                </Button>
              </>
            }
          />
        </>
      )}
    </Stack>
  );
}
