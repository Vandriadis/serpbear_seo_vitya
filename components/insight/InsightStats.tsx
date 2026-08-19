import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formattedNum } from '../../utils/client/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type InsightStatsProps = {
   stats: SearchAnalyticsStat[],
   totalKeywords: number,
   totalCountries: number,
   totalPages: number,
   prevStats?: SearchAnalyticsStat[],
}

const computeTotals = (data: SearchAnalyticsStat[]) => {
   const totals = data.reduce((acc, item) => ({
      impressions: item.impressions + acc.impressions,
      clicks: item.clicks + acc.clicks,
      positionWeighted: (item.position * item.impressions) + acc.positionWeighted,
   }), { impressions: 0, clicks: 0, positionWeighted: 0 });
   return {
      impressions: totals.impressions,
      clicks: totals.clicks,
      position: totals.impressions > 0 ? totals.positionWeighted / totals.impressions : 0,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
   };
};

const calcDelta = (current: number, previous: number): number | null => {
   if (previous === 0) return current > 0 ? 100 : null;
   return ((current - previous) / previous) * 100;
};

type DeltaBadgeProps = {
   delta: number | null,
   inverted?: boolean, // true for position where lower = better
}

const DeltaBadge = ({ delta, inverted = false }: DeltaBadgeProps) => {
   if (delta === null) return null;
   const isPositive = inverted ? delta < 0 : delta > 0;
   const isNegative = inverted ? delta > 0 : delta < 0;
   const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400';
   const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
   const formatted = `${arrow} ${Math.abs(Math.round(delta))}%`;
   return <span className={`block text-xs font-normal mt-1 ${color}`}>{formatted}</span>;
};

const compact = (n: number) => new Intl.NumberFormat('en-US', {
   notation: 'compact', compactDisplay: 'short',
}).format(n || 0).replace('T', 'K');

const InsightStats = ({ stats = [], totalKeywords = 0, totalPages = 0, prevStats }:InsightStatsProps) => {
    const totalStat = useMemo(() => computeTotals(stats), [stats]);
    const prevTotalStat = useMemo(
       () => (prevStats && prevStats.length > 0 ? computeTotals(prevStats) : null),
       [prevStats],
    );

   const chartData = useMemo(() => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartSeries: {[key:string]: number[]} = { clicks: [], impressions: [], position: [], ctr: [] };
      stats.forEach((item) => {
         chartSeries.clicks.push(item.clicks);
         chartSeries.impressions.push(item.impressions);
         chartSeries.position.push(item.position);
         chartSeries.ctr.push(item.ctr);
      });
      return {
         labels: stats && stats.length > 0 ? stats.map((item) => `${new Date(item.date).getDate()}-${months[new Date(item.date).getMonth()]}`) : [],
         series: chartSeries };
   }, [stats]);

   const renderChart = () => {
      // Doc: https://www.chartjs.org/docs/latest/samples/line/multi-axis.html
      const maxPosition = Math.max(...(chartData.series.position || [1]), 1);
      const chartOptions = {
         responsive: true,
         maintainAspectRatio: false,
         animation: false as const,
         interaction: {
            mode: 'index' as const,
            intersect: false,
          },
         scales: {
            x: {
               grid: {
                  drawOnChartArea: false,
                },
            },
            y1: {
               display: true,
               position: 'right' as const,
               grid: {
                 drawOnChartArea: false,
               },
             },
            y2: {
               display: true,
               position: 'right' as const,
               reverse: true,
               min: 1,
               max: Math.min(Math.ceil(maxPosition * 1.15), 100),
               grid: {
                 drawOnChartArea: false,
               },
               ticks: {
                  padding: 8,
               },
             },
         },
         plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
        },
      };
      const { clicks, impressions, position } = chartData.series || {};
      const dataSet = [
         { label: 'Visits', data: clicks, borderColor: 'rgb(117, 50, 205)', backgroundColor: 'rgba(117, 50, 205, 0.5)', yAxisID: 'y' },
         { label: 'Impressions', data: impressions, borderColor: 'rgb(31, 205, 176)', backgroundColor: 'rgba(31, 205, 176, 0.5)', yAxisID: 'y1' },
         {
            label: 'Avg Position',
            data: position,
            borderColor: 'rgb(234, 88, 12)',
            backgroundColor: 'rgba(234, 88, 12, 0.35)',
            borderDash: [6, 4],
            yAxisID: 'y2',
         },
      ];
      return <Line datasetIdKey={'xxx'} options={chartOptions} data={{ labels: chartData.labels, datasets: dataSet }} />;
   };

   return (
      <div className='p-6 lg:border-t lg:border-gray-200'>
         <div className=' flex font-bold flex-wrap lg:flex-nowrap'>
            <div
            className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-violet-700 mr-5'
            title={`${formattedNum(totalStat.clicks || 0)} Visits`}>
               <span className=' block text-sm font-normal text-gray-500'>Visits</span>
               {compact(totalStat.clicks)}
               {prevTotalStat && <DeltaBadge delta={calcDelta(totalStat.clicks, prevTotalStat.clicks)} />}
            </div>
            <div
            className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-[#1fcdb0] lg:mr-5'
            title={`${formattedNum(totalStat.impressions || 0)} Impressions`}>
               <span className=' block text-sm font-normal text-gray-500'>Impressions</span>
               {compact(totalStat.impressions)}
               {prevTotalStat && <DeltaBadge delta={calcDelta(totalStat.impressions, prevTotalStat.impressions)} />}
            </div>
            <div className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-gray-500 font-semibold mr-5'>
               <span className=' block text-sm font-normal text-gray-500'>Avg Position</span>
               {totalStat.position ? Math.round(totalStat.position * 10) / 10 : 0}
               {prevTotalStat && <DeltaBadge delta={calcDelta(totalStat.position, prevTotalStat.position)} inverted />}
            </div>
            <div className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-gray-500 font-semibold lg:mr-5'>
               <span className=' block text-sm font-normal text-gray-500'>Avg CTR</span>
               {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalStat.ctr || 0)}%
               {prevTotalStat && <DeltaBadge delta={calcDelta(totalStat.ctr, prevTotalStat.ctr)} />}
            </div>
            <div className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-gray-500 font-semibold mr-5'>
               <span className=' block text-sm font-normal text-gray-500'>Keywords</span>
               {formattedNum(totalKeywords)}
            </div>
            <div className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-gray-500 font-semibold'>
               <span className=' block text-sm font-normal text-gray-500'>Pages</span>
               {formattedNum(totalPages)}
            </div>
         </div>
         <div className='h-80'>
            {renderChart()}
         </div>
      </div>
   );
};

export default InsightStats;
