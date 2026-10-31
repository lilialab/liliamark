import { type Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

const editableCompartments = new WeakMap<EditorView, Compartment>();

/** 把该 view 的 editable 隔间登记下来，供临时只读切换 */
export function bindEditableCompartment(view: EditorView, compartment: Compartment) {
  editableCompartments.set(view, compartment);
}

/** 是否允许用户编辑（API dispatch 不受影响） */
export function setViewUserEditable(view: EditorView, editable: boolean) {
  const compartment = editableCompartments.get(view);
  if (!compartment || !view.dom.isConnected) {
    return;
  }
  view.dispatch({
    effects: compartment.reconfigure(
      editable ? [] : [EditorState.readOnly.of(true), EditorView.editable.of(false)],
    ),
  });
}
