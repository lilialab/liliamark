import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export type ConfirmResult = 'primary' | 'secondary' | 'cancel';

export type ConfirmOptions = {
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  title?: string;
  closeLabel?: string;
};

type Pending = ConfirmOptions & {
  resolve: (value: ConfirmResult) => void;
};

/** 应用内确认；同一时间只挂一个，新请求会取消未完成的 */
export function useConfirmDialog() {
  const { t } = useTranslation();
  const pendingRef = useRef<Pending | null>(null);
  const [request, setRequest] = useState<ConfirmOptions | null>(null);

  function finish(value: ConfirmResult) {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setRequest(null);
    pending?.resolve(value);
  }

  function confirm(options: ConfirmOptions): Promise<ConfirmResult> {
    pendingRef.current?.resolve('cancel');
    return new Promise((resolve) => {
      pendingRef.current = { ...options, resolve };
      setRequest(options);
    });
  }

  const dialog = request !== null
    ? (
      <ConfirmDialog
        title={request.title}
        message={request.message}
        primaryLabel={request.primaryLabel}
        secondaryLabel={request.secondaryLabel}
        closeLabel={request.closeLabel ?? t('dialog.close')}
        onCancel={() => {
          finish('cancel');
        }}
        onSecondary={() => {
          finish('secondary');
        }}
        onPrimary={() => {
          finish('primary');
        }}
      />
    )
    : null;

  return { confirm, dialog };
}
