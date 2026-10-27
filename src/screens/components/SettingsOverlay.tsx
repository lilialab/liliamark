import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { defaultAppSettings, useAppSettingsStore } from '../../stores/appSettingsStore';
import { MAX_FONT_SIZE, MIN_FONT_SIZE, parseFontSizeInput } from '../../theme/fonts';
import type { AppLocalePreference, AppSettings, IndentStyle } from '../../types/appSettings';
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
  const { t } = useTranslation();
  const stored = useAppSettingsStore((state) => state.settings);
  const commit = useAppSettingsStore((state) => state.commit);

  const [fontFamily, setFontFamily] = useState(defaults.fontFamily);
  const [fontSize, setFontSize] = useState(String(defaults.fontSize));
  const [indentStyle, setIndentStyle] = useState<IndentStyle>(defaults.indentStyle);
  const [locale, setLocale] = useState<AppLocalePreference>(defaults.locale);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFontFamily(stored.fontFamily);
    setFontSize(String(stored.fontSize));
    setIndentStyle(stored.indentStyle);
    setLocale(stored.locale);
  }, [open, stored]);

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
      indentStyle,
      indentSize: stored.indentSize,
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
      aria-label={t('settings.aria')}
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
        <h2 className={cn('mb-3 text-base font-medium text-(--app-fg)')}>
          {t('settings.fonts')}
        </h2>
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
            placeholder={defaults.fontFamily}
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
            placeholder={String(defaults.fontSize)}
            disabled={saving}
            onChange={(event) => {
              setFontSize(event.target.value);
            }}
          />
        </label>

        <div className={cn('mb-4 border-t border-(--app-border) pt-3')}>
          <h3 className={cn('mb-2 text-sm font-medium text-(--app-fg)')}>
            {t('settings.indent')}
          </h3>
          <fieldset className={cn('flex flex-col gap-2')} disabled={saving}>
            <legend className={cn('mb-1 text-sm text-(--app-fg)')}>
              {t('settings.indentStyle')}
            </legend>
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
              {t('settings.space')}
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
              {t('settings.tab')}
            </label>
          </fieldset>
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

        <div className={cn('flex justify-end gap-2')}>
          <Button tabFocusable disabled={saving} onClick={onClose}>
            {t('settings.cancel')}
          </Button>
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
      </div>
    </div>
  );
}
