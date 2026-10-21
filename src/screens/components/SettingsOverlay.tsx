import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { loadAppSettings, saveAppSettings } from '../../lib/tauri/storage';
import {
  applyAppFonts,
  DEFAULT_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  parseFontSizeInput,
} from '../../theme/fonts';
import type { AppSettings } from '../../types/appSettings';
import { cn } from '../../utils/cn';

type SettingsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const fieldClass = cn(
  'w-full rounded border border-(--app-border) bg-(--app-bg) px-3 py-2',
  'font-mono text-sm text-(--app-fg) outline-none',
  'focus:border-(--app-link)',
);

const buttonClass = cn(
  'rounded border border-(--app-border) bg-(--app-surface) px-3 py-1.5 text-sm text-(--app-fg)',
  'hover:bg-(--app-surface-hover) disabled:cursor-not-allowed disabled:opacity-50',
);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function SettingsOverlay({ open, onClose }: SettingsOverlayProps) {
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState(String(DEFAULT_FONT_SIZE));
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    void loadAppSettings()
      .then((settings) => {
        if (cancelled) {
          return;
        }
        setFontFamily(settings.fontFamily);
        setFontSize(String(settings.fontSize));
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        // Browser / non-tauri：空串 → 沿用 :root 默认
        setFontFamily('');
        setFontSize(String(DEFAULT_FONT_SIZE));
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleSave() {
    const parsedSize = parseFontSizeInput(fontSize);
    if (parsedSize === null) {
      toast.error(`字号须为 ${MIN_FONT_SIZE}–${MAX_FONT_SIZE} 的整数`);
      return;
    }

    const settings: AppSettings = { fontFamily, fontSize: parsedSize };
    setSaving(true);
    try {
      await saveAppSettings(settings);
      applyAppFonts(settings);
      toast.success('设置已保存');
      onClose();
    } catch (error) {
      toast.error(`保存失败：${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center',
        'bg-(--app-overlay-scrim) p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="设置"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-md border border-(--app-border)',
          'bg-(--app-bg-raised) p-4 shadow-lg',
        )}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <h2 className={cn('mb-3 text-base font-medium text-(--app-fg)')}>字体</h2>
        <p className={cn('mb-4 text-xs text-(--app-muted)')}>
          编辑器与预览共用。font-family 留空则用默认；字号{' '}
          {MIN_FONT_SIZE}–{MAX_FONT_SIZE}（px）。保存后生效。
        </p>

        <label className={cn('mb-4 block')}>
          <span className={cn('mb-1 block text-sm text-(--app-fg)')}>font-family</span>
          <input
            type="text"
            className={fieldClass}
            value={fontFamily}
            placeholder="留空使用默认"
            disabled={!loaded || saving}
            onChange={(event) => {
              setFontFamily(event.target.value);
            }}
          />
        </label>

        <label className={cn('mb-4 block')}>
          <span className={cn('mb-1 block text-sm text-(--app-fg)')}>字号（px）</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            step={1}
            className={fieldClass}
            value={fontSize}
            placeholder={String(DEFAULT_FONT_SIZE)}
            disabled={!loaded || saving}
            onChange={(event) => {
              setFontSize(event.target.value);
            }}
          />
        </label>

        <div className={cn('flex justify-end gap-2')}>
          <button
            type="button"
            className={buttonClass}
            disabled={saving}
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={!loaded || saving}
            onClick={() => {
              void handleSave();
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
