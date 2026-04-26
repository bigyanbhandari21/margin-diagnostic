/**
 * ProfitPoolBar — Horizontal rent-intensity bar visualization
 */

const VALUE_CHAIN_SEGMENTS = [
  { id: 'raw_materials', label: 'Raw Materials', rentIntensity: 0.2 },
  { id: 'component', label: 'Components', rentIntensity: 0.4 },
  { id: 'assembly', label: 'Assembly', rentIntensity: 0.15 },
  { id: 'brand_ip', label: 'Brand / IP', rentIntensity: 0.8 },
  { id: 'distribution', label: 'Distribution', rentIntensity: 0.35 },
  { id: 'platform', label: 'Platform', rentIntensity: 0.75 },
];

export function renderProfitPoolBar(valueChainPosition, rentConcentration, containerEl) {
  const width = 700;
  const height = 120;
  const barY = 30;
  const barHeight = 50;
  const segmentCount = VALUE_CHAIN_SEGMENTS.length;
  const segmentWidth = width / segmentCount;

  let svgContent = '';

  VALUE_CHAIN_SEGMENTS.forEach((segment, i) => {
    const x = i * segmentWidth;
    const isHighlighted = segment.id === valueChainPosition;

    // Calculate opacity based on rent intensity
    const opacity = 0.15 + segment.rentIntensity * 0.6;
    const fillColor = isHighlighted ? '#1a1a1a' : `rgba(107, 107, 107, ${opacity})`;

    const strokeClass = isHighlighted ? 'profit-pool__segment--highlighted' : 'profit-pool__segment';

    svgContent += `<rect x="${x + 1}" y="${barY}" width="${segmentWidth - 2}" height="${barHeight}" fill="${fillColor}" class="${strokeClass}" rx="1" />`;

    // Label below
    const labelClass = isHighlighted ? 'profit-pool__highlight-label' : 'profit-pool__label';
    svgContent += `<text x="${x + segmentWidth / 2}" y="${barY + barHeight + 18}" class="${labelClass}">${segment.label}</text>`;

    // "You are here" indicator
    if (isHighlighted) {
      svgContent += `<text x="${x + segmentWidth / 2}" y="${barY - 8}" fill="#1a1a1a" font-size="10" font-weight="600" text-anchor="middle" font-family="Inter, sans-serif">▼ Company Position</text>`;
    }
  });

  // Rent intensity legend
  svgContent += `<text x="0" y="${height - 2}" fill="#999" font-size="9" font-family="Inter, sans-serif">Darker = higher rent intensity</text>`;

  const svg = `
    <svg class="profit-pool-bar" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgContent}
    </svg>
  `;

  containerEl.innerHTML = `<div class="profit-pool-container">${svg}</div>`;
}
