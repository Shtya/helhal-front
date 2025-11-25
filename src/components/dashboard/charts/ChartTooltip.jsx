import { useLayoutEffect, useRef, useState } from "react";


export default function ChartTooltip({ tooltipData, visible, tooltiTitle }) {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        if (ref.current) {
            setWidth(ref.current.getBoundingClientRect().width);

        }
    }, [tooltipData.left, visible]);


    // Default position
    let left = tooltipData.left + 10;

    // If tooltip would overflow right edge, flip to left side
    if (left + width + 30 > window.innerWidth) {
        left = tooltipData.left - width - 10;
    }

    return <div
        className="text-nowrap"
        ref={ref}
        style={{
            position: 'absolute',
            left,
            top: tooltipData.top + 10,
            pointerEvents: 'none',
            zIndex: 1000,
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',

            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.8)',
            transition: 'opacity 120ms ease-out, transform 120ms ease-out',
        }}
    >
        {/* Title bar */}
        <div
            style={{
                background: '#f3f4f6',
                padding: '4px 8px',
                fontFamily: "'DIN Next LT Arabic','Poppins',sans-serif",
                fontSize: 14,
                fontWeight: 600,
                borderBottom: '1px solid #e5e7eb',
            }}
        >
            {tooltiTitle ? tooltiTitle : tooltipData.barLabel}

        </div>

        {/* Body: white background */}
        <div
            style={{
                background: '#fff',
                padding: '6px 8px',
                fontFamily: "'DIN Next LT Arabic','Poppins',sans-serif",
                fontSize: 13,
            }}
        >
            {tooltipData.dps.map((pt, i) => (
                <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    {/* colored “O” */}
                    <span
                        style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: pt.color,
                        }}
                    />
                    <span>{pt.label}: {pt.value}</span>
                </div>
            ))}
        </div>
    </div>
}