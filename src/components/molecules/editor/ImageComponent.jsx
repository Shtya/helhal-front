
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { $isImageNode } from './ImageNode';
// : {
//   altText: string;
//   height: 'inherit' | number;
//   maxWidth: number;
//   nodeKey: NodeKey;
//   src: string;
//   width: 'inherit' | number;
// }
export default function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
}) {
  const [editor] = useLexicalComposerContext();
  const imageRef = useRef(null);

  // Hooks to handle selection state (focused/selected)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  const onDelete = useCallback(
    (payload) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey]
  );

  const onClick = useCallback(
    (event) => {
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }
      return false;
    },
    [isSelected, setSelected, clearSelection]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, onClick, onDelete]);

  return (
    <div
      style={{
        display: 'inline-block',
        position: 'relative',
        maxWidth: maxWidth,
      }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={altText}
        style={{
          width: width === 'inherit' ? '100%' : width,
          height: height === 'inherit' ? 'auto' : height,
          maxWidth: '100%',
          // Visual feedback for selection
          outline: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'pointer',
          borderRadius: '4px'
        }}
        draggable="false"
      />
    </div>
  );
}