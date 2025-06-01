import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function BarChart() {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    const chart = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels: [
          "IT Contractor",
          "Project Manager",
          "Management Consultant",
          "Strategy Consultant",
          "Programme Director",
          "Clarity. Base",
          "Clarity. Plus",
          "Clarity. Partner"
        ],
        datasets: [
          {
            label: "Daily Rate (£)",
            data: [505, 525, 575, 778, 925, 227, 455, 545],
            backgroundColor: [
              "#808080", "#808080", "#808080", "#808080", "#808080",
              "#EF5974", "#E1539D", "#D1D146"
            ],
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `£${ctx.parsed.y}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `£${val}`
            }
          }
        }
      }
    });

    return () => chart.destroy();
  }, []);

  return (
    <div className="relative h-[400px] w-full">
      <canvas ref={chartRef} />
    </div>
  );
}
