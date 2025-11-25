'use client';

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export function DoughnutChart({
    data,
    labels,
    colors
}) {
    const baseColors =
        colors?.length === data.length
            ? colors
            : [
                'rgba(255, 99, 132, 0.9)',
                'rgba(54, 162, 235, 0.9)',
                'rgba(255, 206, 86, 0.9)',
                'rgba(75, 192, 192, 0.9)',
            ];

    const chartData = {
        labels,
        datasets: [
            {
                data,
                backgroundColor: baseColors,
                borderWidth: 0,
                borderRadius: 0,
            },
        ],
    };

    // const options = {
    //     maintainAspectRatio: false,
    //     cutout: '70%', // full pie
    //     animation: {
    //         animateRotate: true,
    //         animateScale: false,
    //         duration: 1500,
    //         easing: 'easeOutCubic',
    //     },
    //     plugins: {
    //         legend: { display: false },

    //         tooltip: {
    //             enabled: true,
    //             displayColors: false,
    //             borderColor: 'rgba(0,0,0,0.1)',
    //             borderWidth: 1,
    //             // scriptable background to match slice
    //             backgroundColor: (ctx) => {
    //                 const idx = ctx?.tooltip?.dataPoints?.[0].dataIndex;
    //                 return baseColors[idx];
    //             },
    //             titleFont: {
    //                 family: "'DIN Next LT Arabic', 'Poppins', sans-serif",
    //                 size: 16,
    //                 weight: 'normal',
    //             },
    //             titleColor: '#fff',
    //             bodyFont: {
    //                 family: 'Tajawal, sans-serif',
    //                 size: 14,
    //             },
    //             bodyColor: '#fff',
    //             callbacks: {
    //                 title: (items) => '',
    //                 // raw value
    //                 label: (ctx) => {
    //                     const value = ctx.formattedValue;
    //                     const sliceLabel = ctx.label;
    //                     return `${sliceLabel}: ${value}`;
    //                 },
    //             },
    //         },
    //     },

    //     elements: {
    //         arc: {
    //             borderRadius: 0,
    //         },
    //     },
    // };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] lg:w-[180px] lg:h-[180px]">
                <Doughnut
                    data={chartData}
                    options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        cutout: '60%',
                    }}
                />
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {labels.map((label, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <span
                            className="block w-3 h-3 shrink-0 rounded-full"
                            style={{ backgroundColor: colors[i] }}
                        />
                        <span className="text-xs text-slate-700">{label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}