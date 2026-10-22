import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { defaultAppSettings, useAppSettingsStore } from '../../stores/appSettingsStore';
import { MAX_FONT_SIZE, MIN_FONT_SIZE, parseFontSizeInput } from '../../theme/fonts';
import type { AppSettings, IndentStyle } from '../../types/appSettings';
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const defaults = defaultAppSettings();

export function SettingsOverlay({ open, onClose }: SettingsOverlayProps) {
  const stored = useAppSettingsStore((state) => state.settings);
  const commit = useAppSettingsStore((state) => state.commit);

  const [fontFamily, setFontFamily] = useState(defaults.fontFamily);
  const [fontSize, setFontSize] = useState(String(defaults.fontSize));
  const [indentStyle, setIndentStyle] = useState<IndentStyle>(defaults.indentStyle);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFontFamily(stored.fontFamily);
    setFontSize(String(stored.fontSize));
    setIndentStyle(stored.indentStyle);
  }, [open, stored]);

  async function handleSave() {
    const parsedSize = parseFontSizeInput(fontSize);
    if (parsedSize === null) {
      toast.error(`字号须为 ${MIN_FONT_SIZE}–${MAX_FONT_SIZE} 的整数`);
      return;
    }

    const settings: AppSettings = {
      fontFamily,
      fontSize: parsedSize,
      indentStyle,
      indentSize: stored.indentSize,
    };
    setSaving(true);
    try {
      await commit(settings);
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
          'w-full max-w-lg max-h-[80vh] overflow-y-auto',
          'rounded-md border border-(--app-border) bg-(--app-bg-raised) p-4 shadow-lg',
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
            disabled={saving}
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
            placeholder={String(defaults.fontSize)}
            disabled={saving}
            onChange={(event) => {
              setFontSize(event.target.value);
            }}
          />
        </label>

        <div className={cn('mb-4 border-t border-(--app-border) pt-3')}>
          <h3 className={cn('mb-2 text-sm font-medium text-(--app-fg)')}>缩进</h3>
          <fieldset className={cn('flex flex-col gap-2')} disabled={saving}>
            <legend className={cn('mb-1 text-sm text-(--app-fg)')}>方式</legend>
            <label className={cn('flex items-center gap-2 text-sm text-(--app-fg)')}>
              <input
                type="radio"
                name="indentStyle"
                value="space"
                checked={indentStyle === 'space'}
                onChange={() => {
                  setIndentStyle('space');
                }}
              />
              空格
            </label>
            <label className={cn('flex items-center gap-2 text-sm text-(--app-fg)')}>
              <input
                type="radio"
                name="indentStyle"
                value="tab"
                checked={indentStyle === 'tab'}
                onChange={() => {
                  setIndentStyle('tab');
                }}
              />
              制表符
            </label>
          </fieldset>
        </div>

        <div className={cn('flex justify-end gap-2')}>
          <Button tabFocusable disabled={saving} onClick={onClose}>
            取消
          </Button>
          <Button
            tabFocusable
            disabled={saving}
            onClick={() => {
              void handleSave();
            }}
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
