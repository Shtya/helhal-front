import React from "react";


export default function TruncatedText({
    text = "—",
    maxLength = 200,
    className = "block truncate"
}) {
    const truncated =
        text.length > maxLength ? text.slice(0, maxLength) + "…" : text;

    return (
        <span title={text} className={className} style={{ maxWidth: maxLength }}>
            {truncated}
        </span>
    );
}
