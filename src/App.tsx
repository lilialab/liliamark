import { Toaster } from 'sonner';
import { EditorScreen } from './screens/EditorScreen';
import './theme/app.css';
import './App.css';

export default function App() {
  return (
    <>
      <EditorScreen />
      <Toaster theme="dark" richColors closeButton position="bottom-right" />
    </>
  );
}
