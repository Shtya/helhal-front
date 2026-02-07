import {
    $applyNodeReplacement,
    DecoratorNode,
} from 'lexical';
import * as React from 'react';

// Lazy load the component to avoid circular dependencies
const ImageComponent = React.lazy(() => import('./ImageComponent'));

// export interface ImagePayload {
//     altText: string;
//     height?: number;
//     key?: NodeKey;
//     maxWidth?: number;
//     src: string;
//     width?: number;
// }

// export type SerializedImageNode = Spread<
//     {
//         altText: string;
//         height?: number;
//         maxWidth: number;
//         src: string;
//         width?: number;
//     },
//     SerializedLexicalNode
// >;

export class ImageNode extends DecoratorNode {
    __src;
    __altText;
    __width;
    __height;
    __maxWidth;

    static getType() {
        return 'image';
    }

    static clone(node) {
        return new ImageNode(
            node.__src,
            node.__altText,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__key,
        );
    }

    static importJSON(serializedNode) {
        const { altText, height, width, maxWidth, src } = serializedNode;
        return $createImageNode({
            altText,
            height,
            maxWidth,
            src,
            width,
        });
    }

    exportDOM() {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('alt', this.__altText);
        element.setAttribute('width', this.__width.toString());
        element.setAttribute('height', this.__height.toString());
        return { element };
    }

    static importDOM() {
        return {
            img: () => ({
                conversion: convertImageElement,
                priority: 0,
            }),
        };
    }

    constructor(
        src,
        altText,
        maxWidth,
        width,
        height,
        key,
    ) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width || 'inherit';
        this.__height = height || 'inherit';
    }

    exportJSON() {
        return {
            type: 'image',
            version: 1,
            src: this.__src,
            altText: this.__altText,
            height: this.__height === 'inherit' ? 0 : this.__height,
            width: this.__width === 'inherit' ? 0 : this.__width,
            maxWidth: this.__maxWidth,
        };
    }

    setWidthAndHeight(
        width,
        height,
    ) {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    // View
    createDOM(config) {
        const span = document.createElement('span');
        const theme = config.theme;
        const className = theme.image;
        if (className !== undefined) {
            span.className = className;
        }
        return span;
    }

    updateDOM() {
        return false;
    }

    decorate() {
        return (
            <React.Suspense fallback={null}>
                <ImageComponent
                    src={this.__src}
                    altText={this.__altText}
                    width={this.__width}
                    height={this.__height}
                    maxWidth={this.__maxWidth}
                    nodeKey={this.getKey()}
                />
            </React.Suspense>
        );
    }
}

function convertImageElement(domNode) {
    if (domNode instanceof HTMLImageElement) {
        const { alt: altText, src, width, height } = domNode;
        const node = $createImageNode({ altText, height, src, width });
        return { node };
    }
    return null;
}

export function $createImageNode({
    altText,
    height,
    maxWidth = 500,
    src,
    width,
    key,
}) {
    return $applyNodeReplacement(
        new ImageNode(
            src,
            altText,
            maxWidth,
            width,
            height,
            key,
        ),
    );
}

export function $isImageNode(
    node,
) {
    return node instanceof ImageNode;
}