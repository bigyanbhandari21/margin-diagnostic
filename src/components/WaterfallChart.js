/**
 * WaterfallChart — Cascade waterfall visualization
 */

export function renderWaterfallChart(cascadeData, containerEl) {
  const steps = cascadeData.steps;
  if (!steps || steps.length === 0) return;

  const width = 720;
  const height = 340;
  const marginTop = 40;
  const marginBottom = 70;
  const marginLeft = 10;
  const marginRight = 10;
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;

  const barCount = steps.length;
  const barWidth = Math.min(55, chartWidth / barCount - 20);
  const gap = (chartWidth - barWidth * barCount) / (barCount + 1);

  // Find max value for scaling
  const maxVal = Math.max(...steps.map(s => Math.abs(s.value)), cascadeData.grossMargin);
  const scale = chartHeight / (maxVal * 1.1);

  const baseline = marginTop + chartHeight; // y = 0 line

  let svgContent = '';
  let runningTotal = 0;
  const barPositions = [];

  steps.forEach((step, i) => {
    const x = marginLeft + gap + i * (barWidth + gap);

    if (step.type === 'total') {
      // Total bars start from baseline
      const barH = Math.abs(step.value) * scale;
      const y = baseline - barH;
      svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" class="waterfall-chart__bar--total" rx="1" />`;

      // Value label
      svgContent += `<text x="${x + barWidth / 2}" y="${y - 8}" class="waterfall-chart__value">${step.value.toFixed(1)}%</text>`;

      runningTotal = step.value;
      barPositions.push({ x, y, bottom: baseline, value: step.value });
    } else {
      // Delta bars: positive go up from running total, negative go down
      const prevTotal = barPositions.length > 0 ? barPositions[barPositions.length - 1] : null;
      const startY = prevTotal ? prevTotal.y : baseline;
      const barH = Math.abs(step.value) * scale;

      let y;
      if (step.type === 'negative') {
        y = startY;
        svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" class="waterfall-chart__bar--negative" rx="1" />`;
        // Value label
        svgContent += `<text x="${x + barWidth / 2}" y="${y + barH + 16}" class="waterfall-chart__value" fill="#8b3a3a">${step.value.toFixed(1)}%</text>`;
        barPositions.push({ x, y: y, bottom: y + barH, value: step.value });
      } else {
        y = startY - barH;
        svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" class="waterfall-chart__bar--positive" rx="1" />`;
        // Value label
        svgContent += `<text x="${x + barWidth / 2}" y="${y - 8}" class="waterfall-chart__value" fill="#2d5016">+${step.value.toFixed(1)}%</text>`;
        barPositions.push({ x, y: y, bottom: y + barH, value: step.value });
      }

      // Connector line from previous bar
      if (prevTotal) {
        svgContent += `<line x1="${prevTotal.x + barWidth}" y1="${startY}" x2="${x}" y2="${startY}" class="waterfall-chart__connector" />`;
      }
    }

    // Bar label
    svgContent += `<text x="${x + barWidth / 2}" y="${baseline + 20}" class="waterfall-chart__label">${step.label}</text>`;

    // Annotation
    if (step.annotation) {
      svgContent += `<text x="${x + barWidth / 2}" y="${baseline + 34}" class="waterfall-chart__annotation">${step.annotation}</text>`;
    }
  });

  // Baseline
  svgContent += `<line x1="${marginLeft}" y1="${baseline}" x2="${width - marginRight}" y2="${baseline}" stroke="#d9d3cc" stroke-width="1" />`;

  const svg = `
    <svg class="waterfall-chart" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgContent}
    </svg>
  `;

  containerEl.innerHTML = `<div class="waterfall-chart-container">${svg}</div>`;
}
