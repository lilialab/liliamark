import { useTranslation } from 'react-i18next';
import { Combobox } from '../../components/Combobox';
import { cn } from '../../utils/cn';
import { normalizeUntitledExt, UNTITLED_EXTENSIONS } from '../../utils/untitled';

type UntitledExtPickerProps = {
  ext: string;
  onChange: (ext: string) => void;
};

/** 未命名文档：编辑区右上角悬浮选后缀（aria 标明用途，无可见文案） */
export function UntitledExtPicker({ ext, onChange }: UntitledExtPickerProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-2 right-2 z-10',
        'opacity-45 transition-opacity hover:opacity-100 focus-within:opacity-100',
      )}
    >
      <div className={cn('pointer-events-auto rounded-md bg-(--app-bg-raised)')}>
        <Combobox
          value={ext}
          options={UNTITLED_EXTENSIONS}
          parse={normalizeUntitledExt}
          menuAlign="end"
          aria-label={t('editor.untitledExt')}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
