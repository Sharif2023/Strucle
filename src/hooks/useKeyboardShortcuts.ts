import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

export const useKeyboardShortcuts = () => {
  const { selectedNodeId, deleteNode, undo, redo } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId && selectedNodeId !== 'root') {
          e.preventDefault();
          deleteNode(selectedNodeId);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        useEditorStore.getState().copyNode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        useEditorStore.getState().cutNode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        useEditorStore.getState().pasteNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, deleteNode, undo, redo]);
};
