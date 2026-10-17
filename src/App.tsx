import { Toaster } from 'sonner';
import { EditorScreen } from './screens/EditorScreen';
import './App.css';

export default function App() {
  return (
    <>
      <EditorScreen />
      <Toaster richColors closeButton position="bottom-right" />
    </>
  );
}
