import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppModal } from '../../components/AppModal';
import { Button } from '../../components/Button';
import { useAppSettings, useAppSettingsStore } from '../../stores/appSettingsStore';
import { MAX_FONT_SIZE, MIN_FONT_SIZE, parseFontSizeInput } from '../../theme/fonts';
import {
  type AppLocalePreference,
  type AppSettings,
  INDENT_SIZES,
  type IndentSize,
} from '../../types/appSettings';
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

export function SettingsOverlay({ open, onClose }: SettingsOverlayProps) {
  const { t } = useTranslation();
  const stored = useAppSettings();
  const commit = useAppSettingsStore((state) => state.commit);

  const [fontFamily, setFontFamily] = useState(stored.fontFamily);
  const [fontSize, setFontSize] = useState(String(stored.fontSize));
  const [indentSize, setIndentSize] = useState<IndentSize>(stored.indentSize);
  const [formatOnSave, setFormatOnSave] = useState(stored.formatOnSave);
  const [saveOnBlur, setSaveOnBlur] = useState(stored.saveOnBlur);
  const [locale, setLocale] = useState<AppLocalePreference>(stored.locale);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFontFamily(stored.fontFamily);
    setFontSize(String(stored.fontSize));
    setIndentSize(stored.indentSize);
    setFormatOnSave(stored.formatOnSave);
    setSaveOnBlur(stored.saveOnBlur);
    setLocale(stored.locale);
  }, [open, stored]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadVersion() {
      try {
        const next = await getVersion();
        if (!cancelled) {
          setVersion(next);
        }
      } catch {
        if (!cancelled) {
          setVersion(null);
        }
      }
    }

    void loadVersion();

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleSave() {
    const parsedSize = parseFontSizeInput(fontSize);
    if (parsedSize === null) {
      toast.error(
        t('toast.fontSizeInvalid', { min: MIN_FONT_SIZE, max: MAX_FONT_SIZE }),
      );
      return;
    }
    const settings: AppSettings = {
      fontFamily,
      fontSize: parsedSize,
      indentSize,
      formatOnSave,
      saveOnBlur,
      locale,
    };
    setSaving(true);
    try {
      await commit(settings);
      onClose();
    } catch (error) {
      toast.error(t('toast.saveFailedWithReason', { reason: errorMessage(error) }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={open}
      title={t('settings.title')}
      closeLabel={t('dialog.close')}
      onClose={onClose}
      footer={
        <div className={cn('flex justify-end')}>
          <Button
            tabFocusable
            disabled={saving}
            onClick={() => {
              void handleSave();
            }}
          >
            {t('settings.save')}
          </Button>
        </div>
      }
    >
      <h3 className={cn('mb-3 text-sm font-medium text-(--app-fg)')}>
        {t('settings.fonts')}
      </h3>
      <p className={cn('mb-4 text-xs text-(--app-muted)')}>
        {t('settings.fontsHint', { min: MIN_FONT_SIZE, max: MAX_FONT_SIZE })}
      </p>

      <label className={cn('mb-4 block')}>
        <span className={cn('mb-1 block text-sm text-(--app-fg)')}>
          {t('settings.fontFamily')}
        </span>
        <input
          type="text"
          className={fieldClass}
          value={fontFamily}
          disabled={saving}
          onChange={(event) => {
            setFontFamily(event.target.value);
          }}
        />
      </label>

      <label className={cn('mb-4 block')}>
        <span className={cn('mb-1 block text-sm text-(--app-fg)')}>
          {t('settings.fontSize')}
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={1}
          className={fieldClass}
          value={fontSize}
          disabled={saving}
          onChange={(event) => {
            setFontSize(event.target.value);
          }}
        />
      </label>

      <div className={cn('mb-4 border-t border-(--app-border) pt-3')}>
        <h3 className={cn('mb-2 text-sm font-medium text-(--app-fg)')}>
          {t('settings.indentSize')}
        </h3>
        <p className={cn('mb-2 text-xs text-(--app-muted)')}>
          {t('settings.indentSizeHint')}
        </p>
        <fieldset className={cn('flex flex-col gap-2')} disabled={saving}>
          {INDENT_SIZES.map((size) => (
            <label
              key={size}
              className={cn('flex items-center gap-2 text-sm text-(--app-fg)')}
            >
              <input
                type="radio"
                name="indentSize"
                value={size}
                checked={indentSize === size}
                onChange={() => {
                  setIndentSize(size);
                }}
              />
              {t('settings.indentSizeOption', { size })}
            </label>
          ))}
        </fieldset>
      </div>

      <div className={cn('mb-4 border-t border-(--app-border) pt-3')}>
        <label className={cn('flex items-center gap-2 text-sm text-(--app-fg)')}>
          <input
            type="checkbox"
            checked={formatOnSave}
            disabled={saving}
            onChange={(event) => {
              setFormatOnSave(event.target.checked);
            }}
          />
          {t('settings.formatOnSave')}
        </label>
        <p className={cn('mt-2 text-xs text-(--app-muted)')}>
          {t('settings.formatOnSaveHint')}
        </p>
        <label className={cn('mt-3 flex items-center gap-2 text-sm text-(--app-fg)')}>
          <input
            type="checkbox"
            checked={saveOnBlur}
            disabled={saving}
            onChange={(event) => {
              setSaveOnBlur(event.target.checked);
            }}
          />
          {t('settings.saveOnBlur')}
        </label>
        <p className={cn('mt-2 text-xs text-(--app-muted)')}>
          {t('settings.saveOnBlurHint')}
        </p>
      </div>

      <div className={cn('mb-4 border-t border-(--app-border) pt-3')}>
        <h3 className={cn('mb-2 text-sm font-medium text-(--app-fg)')}>
          {t('settings.language')}
        </h3>
        <fieldset className={cn('flex flex-col gap-2')} disabled={saving}>
          {(
            [
              ['system', 'settings.languageSystem'],
              ['zh', 'settings.languageZh'],
              ['en', 'settings.languageEn'],
            ] as const
          ).map(([value, labelKey]) => (
            <label
              key={value}
              className={cn('flex items-center gap-2 text-sm text-(--app-fg)')}
            >
              <input
                type="radio"
                name="locale"
                value={value}
                checked={locale === value}
                onChange={() => {
                  setLocale(value);
                }}
              />
              {t(labelKey)}
            </label>
          ))}
        </fieldset>
      </div>

      {version && (
        <p className={cn('text-center text-xs text-(--app-muted)')}>
          {t('settings.version', { version })}
        </p>
      )}
    </AppModal>
  );
}
