import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function BarChart() {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    const labels = [
      "IT Contractor",
      "Project Manager",
      "Management Consultant",
      "Strategy Consultant",
      "Programme Director",
      "Clarity. Base",
      "Clarity. Plus",
      "Clarity. Partner"
    ];

    const data = [505, 525, 575, 778, 925, 273, 455, 682];

    const marketBenchmark = {
      "Clarity. Base": 505,
      "Clarity. Plus": 575,
      "Clarity. Partner": 778
    };    

    const lightColours = [
      "#808080", "#808080", "#808080", "#808080", "#808080", // market greys
      "#A7D5F2", // Base
      "#75C1E8", // Plus
      "#429EDB"  // Partner
    ];

    const darkColours = [
      "#666666", "#666666", "#666666", "#666666", "#666666", // darker greys
      "#5AA6D6", // Base - softened for dark
      "#429EDB", // Plus - main pastel
      "#1F78C1"  // Partner - bold and legible
    ];

    const isDark = document.documentElement.classList.contains("dark");
    const colours = isDark ? darkColours : lightColours;

    const chart = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Approx. Daily Rate (£)",
            data,
            backgroundColor: colours,
            borderRadius: 6,
            borderSkipped: false
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
              label: (ctx) => {
                const label = ctx.label;
                const value = ctx.parsed.y;
                if (label.startsWith("Clarity.")) {
                  const benchmark = marketBenchmark[label];
                  if (benchmark) {
                    const saving = benchmark - value;
                    return [`£${value.toFixed(0)} per day`, `Saves you £${saving} vs average`];
                  }
                }
                return `£${value.toFixed(0)} per day`;
              },
              title: (ctx) => ctx[0].label
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `£${val}`
            },
            grid: {
              display: false, // 🚫 Removes Y-axis grid lines
              drawTicks: false
            },
            border: {
              display: false // Optional: hide axis line
            }
          },
          x: {
            grid: {
              display: false, // 🚫 Removes X-axis grid lines
              drawTicks: false
            },
            border: {
              display: false
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
