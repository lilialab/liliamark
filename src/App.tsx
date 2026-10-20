import { Toaster } from 'sonner';
import { EditorScreen } from './screens/EditorScreen';
import { isDarkFlavor } from './theme/flavor';
import './theme/app.css';
import './App.css';

export default function App() {
  return (
    <>
      <EditorScreen />
      <Toaster
        theme={isDarkFlavor() ? 'dark' : 'light'}
        richColors
        closeButton
        position="bottom-right"
      />
    </>
  );
}
