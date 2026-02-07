'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ImageNode } from './ImageNode';
import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/utils/helper';


// The minimal valid state to prevent the "root node empty" error
export const EMPTY_LEXICAL_STATE = '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';
const DefaultSkeleton = () => (
    <div className="space-y-4 animate-pulse w-full">
        <div className="h-8 bg-gray-100 rounded-xl w-1/3" />
        <div className="space-y-2">
            <div className="h-4 bg-gray-50 rounded-lg w-full" />
            <div className="h-4 bg-gray-50 rounded-lg w-5/6" />
            <div className="h-4 bg-gray-50 rounded-lg w-4/6" />
        </div>
    </div>
);
//: { content: any; className?: string; loader?: ReactNode }
export default function RichTextRenderer({ content, className, loader = <DefaultSkeleton /> }) {
    const [isMounted, setIsMounted] = useState(false);

    // This ensures Lexical only starts rendering once we are on the client
    useEffect(() => {
        setIsMounted(true);
    }, []);
    if (!content) return null;

    const initialConfig = {
        namespace: 'RichTextRenderer',
        // Matches your editor's initialization logic
        editorState: content ? (typeof content === 'object' ? JSON.stringify(content) : content) : EMPTY_LEXICAL_STATE,
        editable: false,
        nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            AutoLinkNode,
            LinkNode,
            ImageNode
        ],
        theme: {
            paragraph: 'mb-2',
            quote: 'border-l-4 border-main-600 pl-4 italic my-4 text-dark/80',
            heading: {
                h1: 'text-3xl font-bold mb-4 text-dark',
                h2: 'text-2xl font-bold mb-3 text-dark',
                h3: 'text-xl font-semibold mb-2 text-dark',
            },
            list: {
                ul: 'list-disc list-inside mb-2',
                ol: 'list-decimal list-inside mb-2',
            },
            text: {
                bold: 'font-bold',
                italic: 'italic',
                underline: 'underline',
                strikethrough: 'line-through',
                code: 'bg-gray/10 px-1 py-0.5 rounded text-sm font-mono',
            },
            image: 'editor-image', // Matches your CSS class
        },
        onError: (error) => console.error(error),
    };

    // While waiting for client-side mounting, return the loader
    if (!isMounted) {
        return <>{loader}</>; // Wrapped in fragment to fix the type error
    }
    return (
        <div className={cn("w-full", className)}>
            <LexicalComposer initialConfig={initialConfig}>
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className={cn(
                                "focus:outline-none text-sm font-medium text-dark",
                                "prose prose-sm max-w-none",
                                // These must match your editor's ContentEditable classes exactly
                                "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4",
                                "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3",
                                "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2",
                                "[&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-2",
                                "[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-2",
                                "[&_blockquote]:border-l-4 [&_blockquote]:border-main-600 [&_blockquote]:pl-4 [&_blockquote]:italic",
                                "[&_code]:bg-gray/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono"
                            )}
                        />
                    }
                    placeholder={null}
                    ErrorBoundary={LexicalErrorBoundary}
                />
            </LexicalComposer>
        </div>
    );
}