import { useState, type ReactNode } from 'react';
import {
  Button,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Stack,
  Text,
  Tooltip,
  useToast,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';
import { CategoryCards, OpenState } from './shell';

export const overlayNames = ['Dialog', 'Menu', 'Tooltip'] as const;

export function OverlayCategory() {
  const toast = useToast();
  const [dialog, setDialog] = useState(false);

  const demos: Record<(typeof overlayNames)[number], ReactNode> = {
    Dialog: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          중요한 결정을 하기 전에 한 번 더 확인해요.
        </Text>
        <Stack direction="row" gap={3} wrap>
          <Button variant="secondary" onClick={() => setDialog(true)}>
            확인창 열기
          </Button>
        </Stack>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="문서를 삭제할까요?"
          description="삭제한 문서는 복구할 수 없어요. 계속 진행할지 확인해 주세요."
          size="sm"
          actions={
            <>
              <Button variant="secondary" onClick={() => setDialog(false)}>
                돌아가기
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setDialog(false);
                  toast({ title: '예제 문서를 삭제했어요', tone: 'success' });
                }}
              >
                삭제하기
              </Button>
            </>
          }
        />
      </Stack>
    ),
    Menu: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          버튼을 눌러 추가 동작을 펼쳐요.
        </Text>
        <Stack direction="row" gap={3} wrap>
          <Menu
            trigger={
              <Button
                variant="secondary"
                trailing={<ExampleIcon name="chevron" />}
              >
                더 보기
              </Button>
            }
          >
            <MenuLabel>문서 관리</MenuLabel>
            <MenuItem
              icon={<ExampleIcon name="receipt" />}
              onSelect={() =>
                toast({ title: '문서를 보관했어요', tone: 'success' })
              }
            >
              보관하기
            </MenuItem>
            <MenuSeparator />
            <MenuItem tone="danger" onSelect={() => setDialog(true)}>
              삭제하기
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>
    ),
    Tooltip: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          짧은 도움말을 마우스와 키보드 모두에서 보여줘요.
        </Text>
        <Stack direction="row" gap={3} align="center" wrap>
          <Tooltip content="중요한 작업 전에 내용을 한 번 더 확인해요.">
            <IconButton
              label="확인창 도움말"
              size="sm"
              variant="filled"
              round
              className="demo-help"
            >
              ?
            </IconButton>
          </Tooltip>
          <Tooltip content="정산은 영업일 기준 2일 뒤에 완료돼요.">
            <Button variant="secondary">정산 안내</Button>
          </Tooltip>
        </Stack>
        <OpenState>
          <span className="mega-tooltip">
            <span className="mega-tooltip__bubble">
              정산은 영업일 기준 2일 뒤에 완료돼요.
            </span>
          </span>
        </OpenState>
      </Stack>
    ),
  };
  return <CategoryCards code="OVERLAY" order={overlayNames} demos={demos} />;
}
