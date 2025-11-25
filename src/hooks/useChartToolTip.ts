import { TooltipItem, TooltipModel } from "chart.js";
import { useState } from "react";


export default function useChartToolTip() {
    const [tooltipData, setTooltipData] = useState({
        dps: [],
        left: 0,
        top: 0,
        barLabel: ''
    });

    const [showTip, setShowTip] = useState(false);

    function handleTooltip(context: { tooltip: any }) {


        const tip = context.tooltip as TooltipModel<'line'>;

        // Get index of hovered bar
        const index = tip.dataPoints[0].dataIndex;

        // The actual bar label (from labels array)
        const barLabel = tip.chart.data.labels[index] as string;


        if (tip.opacity === 0 && showTip) {
            setShowTip(false);
            return;
        }

        // map ChartJS points → our TooltipDP
        const dps = tip.dataPoints!.map((pt: TooltipItem<'line'>) => ({
            label: pt.dataset.label || '',
            value: pt.formattedValue,
            color: pt.dataset.borderColor as string,
        }));

        if (tooltipData.left !== tip.caretX) {

            setTooltipData({
                dps,
                left: tip.caretX,
                top: tip.caretY,
                barLabel
            });
            setShowTip(true);
        }

    }

    return { tooltipData, showTip, handleTooltip, setShowTip };
}