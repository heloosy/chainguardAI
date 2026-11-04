/**
 * ChainGuard AI - Chart Helpers using Chart.js (Clean White / Light Theme)
 */
const ChartManager = {
  instances: {},

  renderModelComparison(canvasId, comparisonData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    const chainguard = comparisonData.chainguard_ai;
    const baseline = comparisonData.naive_baseline;

    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Lead Time MAE (Days - Lower is Better)", "Brier Calibration Loss (Lower is Better)"],
        datasets: [
          {
            label: "ChainGuard AI (Trained Calibrated)",
            data: [chainguard.lead_time_mae_days, chainguard.delay_brier_score * 10],
            backgroundColor: "rgba(37, 99, 235, 0.85)",
            borderColor: "rgba(37, 99, 235, 1)",
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: "Naive Historical Baseline (ERP Default)",
            data: [baseline.lead_time_mae_days, baseline.delay_brier_score * 10],
            backgroundColor: "rgba(148, 163, 184, 0.75)",
            borderColor: "rgba(100, 116, 139, 1)",
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#1e293b", font: { family: "Inter", size: 12, weight: 600 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw;
                if (ctx.dataIndex === 1) {
                  return `${ctx.dataset.label}: ${(val / 10).toFixed(4)} (Brier Score)`;
                }
                return `${ctx.dataset.label}: ${val.toFixed(2)} days error`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: "#475569", font: { weight: 500 } }, grid: { display: false } },
          y: { ticks: { color: "#475569" }, grid: { color: "rgba(226, 232, 240, 0.8)" } }
        }
      }
    });
  },

  renderQuantileInterval(canvasId, p10, p50, p90, agreedLt) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Lead Time Distribution (Days)"],
        datasets: [
          {
            label: "Agreed Baseline Lead Time",
            data: [agreedLt],
            backgroundColor: "rgba(148, 163, 184, 0.5)",
            borderWidth: 1
          },
          {
            label: "P10 (Optimistic 10th Percentile)",
            data: [p10],
            backgroundColor: "rgba(16, 185, 129, 0.85)",
            borderRadius: 4
          },
          {
            label: "P50 (Predicted Median)",
            data: [p50],
            backgroundColor: "rgba(249, 115, 22, 0.9)",
            borderRadius: 4
          },
          {
            label: "P90 (Pessimistic 90th Percentile)",
            data: [p90],
            backgroundColor: "rgba(239, 68, 68, 0.85)",
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#1e293b", font: { weight: 600 } } }
        },
        scales: {
          x: {
            title: { display: true, text: "Days from Order Date", color: "#64748b" },
            ticks: { color: "#475569" },
            grid: { color: "rgba(226, 232, 240, 0.8)" }
          },
          y: { ticks: { display: false }, grid: { display: false } }
        }
      }
    });
  }
};
