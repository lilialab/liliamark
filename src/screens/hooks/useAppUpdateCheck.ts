import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import i18n from '../../i18n';
import { checkAppUpdate } from '../../lib/appUpdate';
import { openExternalUrl } from '../../lib/tauri/opener';

const AUTO_CHECK_DELAY_MS = 2500;

async function runAppUpdateCheck(mode: 'auto' | 'manual') {
  const t = i18n.t.bind(i18n);
  const result = await checkAppUpdate();

  if (result.status === 'update-available') {
    toast.message(t('toast.updateAvailable', { version: result.latestVersion }), {
      description: t('toast.updateAvailableHint'),
      duration: 20_000,
      action: {
        label: t('toast.updateOpen'),
        onClick: () => {
          void openExternalUrl(result.releaseUrl);
        },
      },
    });
    return;
  }

  if (mode === 'auto') {
    return;
  }

  if (result.status === 'up-to-date') {
    toast.success(t('toast.updateUpToDate', { version: result.currentVersion }));
    return;
  }

  toast.error(t('toast.updateCheckFailed'), { description: result.reason });
}

/**
 * 启动后自动检查更新；菜单可手动检查。
 * 有新版本时 toast + 打开 Release 页；自动检查失败静默。
 */
export function useAppUpdateCheck() {
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (autoStartedRef.current) {
      return;
    }
    autoStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void runAppUpdateCheck('auto');
    }, AUTO_CHECK_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function checkForUpdates() {
    void runAppUpdateCheck('manual');
  }

  return { checkForUpdates };
}
