/**
 * RadarChart — Five Forces radar visualization
 */

export function renderRadarChart(forceScores, containerEl) {
  const forces = Object.entries(forceScores);
  const n = forces.length;
  if (n === 0) return;

  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 140;
  const labelOffset = 35;

  // Calculate angle for each axis (starting from top, going clockwise)
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // Start from top

  function polarToCartesian(angle, r) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  // Build reference pentagons (at 25%, 50%, 75%, 100%)
  const refLevels = [0.25, 0.5, 0.75, 1.0];
  let refPolygons = '';
  refLevels.forEach(level => {
    const points = [];
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      const p = polarToCartesian(angle, radius * level);
      points.push(`${p.x},${p.y}`);
    }
    const dash = level === 0.5 ? 'stroke-dasharray="4 4"' : 'stroke-dasharray="2 4"';
    refPolygons += `<polygon points="${points.join(' ')}" fill="none" stroke="#d9d3cc" stroke-width="0.75" ${dash} />`;
  });

  // Build axis lines
  let axisLines = '';
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const end = polarToCartesian(angle, radius);
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" class="radar-chart__axis" />`;
  }

  // Build data polygon
  const dataPoints = [];
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const value = forces[i][1].normalized;
    const p = polarToCartesian(angle, radius * value);
    dataPoints.push({ ...p, value });
  }
  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Build point dots
  let dots = '';
  dataPoints.forEach(p => {
    dots += `<circle cx="${p.x}" cy="${p.y}" r="4" class="radar-chart__point" />`;
  });

  // Build labels
  let labels = '';
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const p = polarToCartesian(angle, radius + labelOffset);

    // Adjust text anchor based on position
    let anchor = 'middle';
    if (Math.cos(angle) > 0.3) anchor = 'start';
    if (Math.cos(angle) < -0.3) anchor = 'end';

    const forceLabel = forces[i][1].name;
    const scoreLabel = forces[i][1].label;
    const scoreColor = scoreLabel === 'Favorable' ? '#2d5016' :
                       scoreLabel === 'Unfavorable' ? '#8b3a3a' : '#6b6b6b';

    labels += `<text x="${p.x}" y="${p.y}" class="radar-chart__label" text-anchor="${anchor}" dominant-baseline="middle">${forceLabel}</text>`;
    labels += `<text x="${p.x}" y="${p.y + 14}" class="radar-chart__score-label" text-anchor="${anchor}" dominant-baseline="middle" fill="${scoreColor}">${scoreLabel}</text>`;
  }

  const svg = `
    <svg class="radar-chart" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${refPolygons}
      ${axisLines}
      <polygon points="${dataPolygonPoints}" class="radar-chart__polygon" />
      ${dots}
      ${labels}
    </svg>
  `;

  containerEl.innerHTML = `<div class="radar-chart-container">${svg}</div>`;
}
