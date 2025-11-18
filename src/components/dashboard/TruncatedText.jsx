import React from "react";


export default function TruncatedText({
    text = "—",
    maxLength = 200,
    className = "block truncate max-w-[200px]"
}) {
    const truncated =
        text.length > maxLength ? text.slice(0, maxLength) + "…" : text;

    return (
        <span title={text} className={className}>
            {truncated}
        </span>
    );
}
