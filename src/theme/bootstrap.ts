import { setWindowTheme } from '../lib/tauri/theme';
import { APP_FLAVOR, applyDocumentFlavor, windowThemeForFlavor } from './flavor';

applyDocumentFlavor(APP_FLAVOR);

void setWindowTheme(windowThemeForFlavor(APP_FLAVOR)).catch(() => {
  // Browser / non-tauri preview has no window theme command.
});
