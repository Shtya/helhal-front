import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
    $createParagraphNode,
    $createRangeSelection,
    $getSelection,
    $insertNodes,
    $isNodeSelection,
    $isRootOrShadowRoot,
    $setSelection,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_LOW,
    createCommand,
    DRAGOVER_COMMAND,
    DRAGSTART_COMMAND,
    DROP_COMMAND,
    LexicalCommand,
    LexicalEditor,
    isHTMLElement,
    getDOMSelectionFromTarget,
} from 'lexical';
import { useEffect, useState } from 'react';
import * as React from 'react';

// Ensure these imports match your file structure
import {
    $createImageNode,
    $isImageNode,
    ImageNode,
    ImagePayload,
} from './ImageNode';
import { MdCheck, MdClose, MdCloudUpload, MdImage, MdLink } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { Popup } from '../Popup';
import { Modal } from '@/components/dashboard/Ui';

// export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND =
    createCommand('INSERT_IMAGE_COMMAND');

export default function ImagesPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([ImageNode])) {
            throw new Error('ImagesPlugin: ImageNode not registered on editor');
        }

        return mergeRegister(
            editor.registerCommand(
                INSERT_IMAGE_COMMAND,
                (payload) => {
                    const imageNode = $createImageNode(payload);
                    $insertNodes([imageNode]);
                    if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                        $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
                    }
                    return true;
                },
                COMMAND_PRIORITY_EDITOR,
            ),
            editor.registerCommand(
                DRAGSTART_COMMAND,
                (event) => {
                    return $onDragStart(event);
                },
                COMMAND_PRIORITY_HIGH,
            ),
            editor.registerCommand(
                DRAGOVER_COMMAND,
                (event) => {
                    return $onDragover(event);
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                DROP_COMMAND,
                (event) => {
                    return $onDrop(event, editor);
                },
                COMMAND_PRIORITY_HIGH,
            ),
        );
    }, [editor]);

    return null;
}

// -----------------------------------------------------------------------------
// DRAG & DROP HELPERS
// -----------------------------------------------------------------------------

const TRANSPARENT_IMAGE =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// const img = document.createElement('img');
// img.src = TRANSPARENT_IMAGE;

function $onDragStart(event) {
    const node = $getImageNodeInSelection();
    if (!node) {
        return false;
    }
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) {
        return false;
    }
    const dragImg = new Image();
    dragImg.src = TRANSPARENT_IMAGE;

    dataTransfer.setData('text/plain', '_');
    dataTransfer.setDragImage(dragImg, 0, 0);
    dataTransfer.setData(
        'application/x-lexical-drag',
        JSON.stringify({
            data: {
                altText: node.__altText,
                key: node.getKey(),
                maxWidth: node.__maxWidth,
                src: node.__src,
                width: node.__width,
                height: node.__height,
            },
            type: 'image',
        }),
    );

    return true;
}

function $onDragover(event) {
    const node = $getImageNodeInSelection();
    if (!node) {
        return false;
    }
    if (!canDropImage(event)) {
        event.preventDefault();
    }
    return false;
}

function $onDrop(event, editor) {
    const node = $getImageNodeInSelection();
    if (!node) {
        return false;
    }
    const data = getDragImageData(event);
    if (!data) {
        return false;
    }
    event.preventDefault();
    if (canDropImage(event)) {
        const range = getDragSelection(event);
        node.remove();
        const rangeSelection = $createRangeSelection();
        if (range !== null && range !== undefined) {
            rangeSelection.applyDOMRange(range);
        }
        $setSelection(rangeSelection);
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
    }
    return true;
}

function $getImageNodeInSelection() {
    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
        return null;
    }
    const nodes = selection.getNodes();
    const node = nodes[0];
    return $isImageNode(node) ? node : null;
}

function getDragImageData(event) {
    const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
    if (!dragData) {
        return null;
    }
    const { type, data } = JSON.parse(dragData);
    if (type !== 'image') {
        return null;
    }
    return data;
}

// declare global {
//     interface DragEvent {
//         rangeOffset?: number;
//         rangeParent?: Node;
//     }
// }

function canDropImage(event) {
    const target = event.target;
    return !!(
        isHTMLElement(target) &&
        !target.closest('code, span.editor-image') &&
        isHTMLElement(target.parentElement) &&
        target.parentElement.closest('div.ContentEditable__root')
    );
}

function getDragSelection(event) {
    let range;
    const domSelection = getDOMSelectionFromTarget(event.target);
    if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(event.clientX, event.clientY);
    } else if (event.rangeParent && domSelection !== null) {
        domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
        range = domSelection.getRangeAt(0);
    } else {
        throw Error(`Cannot get the selection when dragging`);
    }
    return range;
}

export function InsertImageDialog({
    activeEditor,
    onClose,
}
    // {
    //     activeEditor: LexicalEditor;
    //     onClose: () => void;
    // }
) {
    const t = useTranslations('common');
    const [mode, setMode] = useState('file');
    const [src, setSrc] = useState('');
    const [altText, setAltText] = useState('');
    const [width, setWidth] = useState(500);

    const isDisabled = src === '';

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function () {
                if (typeof reader.result === 'string') {
                    setSrc(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const insertImage = () => {
        if (!src) return;
        activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            altText,
            src,
            width,
        });
        onClose();
    };

    return (
        <Modal
            open={true} // Logic should control this, but following your code
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 flex-1">
                    <div className="p-1.5 bg-secondary/10 rounded-lg text-secondary">
                        <MdImage size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                        {t('image_dialog.title')}
                    </h2>
                </div>
            }
        >
            {/* Tabs */}
            <div className="flex p-1 m-4 bg-gray-100 rounded-lg">
                <button
                    onClick={() => setMode('file')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'file'
                        ? 'bg-white text-main-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MdCloudUpload /> {t('upload')}
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'url'
                        ? 'bg-white text-main-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MdLink /> {t('image_dialog.url_label')}
                </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
                {/* Input Area */}
                {mode === 'file' ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <MdCloudUpload size={32} className="text-gray-300" />
                            <span className="text-sm">{t('image_dialog.upload_text')}</span>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Image URL</label>
                        <input
                            type="text"
                            placeholder="https://example.com/image.jpg"
                            value={src}
                            onChange={(e) => setSrc(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-main-600 text-sm"
                        />
                    </div>
                )}

                {/* Preview */}
                {src && (
                    <div className="relative h-32 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img src={src} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                )}

                {/* Meta Data */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{t('image_dialog.alt_text_label')}</label>
                        <input
                            type="text"
                            placeholder={t('image_dialog.placeholders.alt_text')}
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-main-600 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{t('image_dialog.width_label')}</label>
                        <input
                            type="number"
                            value={width}
                            placeholder={t('image_dialog.placeholders.url')}
                            onChange={(e) => setWidth(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-main-600 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                    {t('cancel')}
                </button>
                <button
                    disabled={isDisabled}
                    onClick={insertImage}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-main-600 to-main-800 text-white text-sm font-semibold hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <MdCheck size={16} /> {t('insert')}
                </button>
            </div>
        </Modal>
    );
}