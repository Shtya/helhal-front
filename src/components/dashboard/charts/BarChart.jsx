'use client';

import useChartToolTip from '@/hooks/useChartToolTip';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,

} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartTooltip from './ChartTooltip';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export function BarChart({
    labels,
    label,
    data,
    barColors = ['#009966', '#005BF1'],
}) {

    const { handleTooltip, tooltipData, showTip } = useChartToolTip();
    const chartData = {
        labels,
        datasets: [
            {
                label,
                data,
                borderRadius: 8, // 👈 Rounded bar ends
                backgroundColor: barColors,
                hoverBackgroundColor: barColors,
                borderSkipped: false, // 👈 Apply radius to all sides
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: false,
                external: (context) => handleTooltip(context),
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: {
                        size: 12,
                    },
                },
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.05)', lineWidth: 1.5 },
                ticks: {
                    font: {
                        size: 12,
                    },
                },
            },
        },
    };

    return (
        <div style={{ position: "relative", width: 'auto', height: 400 }}>
            <Bar data={chartData} options={options} />
            <ChartTooltip tooltipData={tooltipData} visible={showTip} />
        </div>
    );
}
