import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../hooks/useTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ChartProps ={
   labels: string[],
   series: number[],
   reverse? : boolean,
   noMaxLimit?: boolean
}

const Chart = ({ labels, series, reverse = true, noMaxLimit = false }:ChartProps) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const tickColor = isDark ? '#9aa3b5' : '#64748b';
   const gridColor = isDark ? '#2a3142' : '#e9ebff';

   const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
         x: {
            ticks: { color: tickColor },
            grid: { color: gridColor },
         },
         y: {
            reverse,
            min: 1,
            max: !noMaxLimit && reverse ? 100 : undefined,
            ticks: { color: tickColor },
            grid: { color: gridColor },
         },
      },
      plugins: {
         legend: {
             display: false,
         },
     },
   };

   return <Line
            datasetIdKey='XXX'
            options={options}
            data={{
            labels,
            datasets: [
               {
                  fill: 'start',
                  data: series,
                  borderColor: 'rgb(31, 205, 176)',
                  backgroundColor: 'rgba(31, 205, 176, 0.5)',
               },
            ],
            }}
         />;
};

export default Chart;
