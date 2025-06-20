
import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Chart2DProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
}

export const Chart2D = ({ data, xAxis, yAxis, chartType }: Chart2DProps) => {
  const chartRef = useRef(null);

  const processData = () => {
    const labels = data.map(item => item[xAxis]);
    const values = data.map(item => item[yAxis]);

    const backgroundColors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(147, 51, 234, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(251, 146, 60, 0.8)',
      'rgba(14, 165, 233, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(244, 63, 94, 0.8)',
    ];

    const borderColors = [
      'rgba(59, 130, 246, 1)',
      'rgba(147, 51, 234, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(34, 197, 94, 1)',
      'rgba(251, 146, 60, 1)',
      'rgba(14, 165, 233, 1)',
      'rgba(168, 85, 247, 1)',
      'rgba(244, 63, 94, 1)',
    ];

    if (chartType === 'scatter') {
      return {
        datasets: [
          {
            label: `${yAxis} vs ${xAxis}`,
            data: data.map(item => ({
              x: item[xAxis],
              y: item[yAxis]
            })),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: yAxis,
          data: values,
          backgroundColor: chartType === 'pie' 
            ? backgroundColors.slice(0, labels.length)
            : chartType === 'area'
            ? 'rgba(59, 130, 246, 0.4)'
            : 'rgba(59, 130, 246, 0.8)',
          borderColor: chartType === 'pie'
            ? borderColors.slice(0, labels.length)
            : 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: chartType === 'area' ? true : chartType === 'line' ? false : true,
          tension: chartType === 'line' || chartType === 'area' ? 0.4 : 0,
        },
      ],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${yAxis} by ${xAxis}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: chartType !== 'pie' ? {
      x: {
        title: {
          display: true,
          text: xAxis,
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        title: {
          display: true,
          text: yAxis,
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    } : {},
  };

  const chartData = processData();

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <Bar ref={chartRef} data={chartData} options={options} />;
      case 'line':
      case 'area':
        return <Line ref={chartRef} data={chartData} options={options} />;
      case 'pie':
        return <Pie ref={chartRef} data={chartData} options={options} />;
      case 'scatter':
        return <Scatter ref={chartRef} data={chartData} options={options} />;
      default:
        return <Bar ref={chartRef} data={chartData} options={options} />;
    }
  };

  return (
    <div className="w-full h-64 sm:h-80 lg:h-96">
      {renderChart()}
    </div>
  );
};
