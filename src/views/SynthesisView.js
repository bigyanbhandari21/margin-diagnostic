/**
 * SynthesisView — One-page diagnostic output
 */

import { navigate } from '../router.js';
import { getState, getAllAnswers, getAllFreeText, getCompanyName, resetDiagnostic, getLibrary, getLibraryItem } from '../state.js';
import { computeSynthesis } from '../engine.js';
import { renderRadarChart } from '../components/RadarChart.js';
import { renderWaterfallChart } from '../components/WaterfallChart.js';
import { renderProfitPoolBar } from '../components/ProfitPoolBar.js';

/** Render the synthesis view */
export function renderSynthesisView(containerEl, libraryId) {
  let answers, freeText, companyName;

  if (libraryId) {
    const item = getLibraryItem(libraryId);
    if (!item) {
      navigate('/library');
      return;
    }
    answers = item.answers;
    freeText = item.freeText || {};
    companyName = item.companyName;
  } else {
    const state = getState();
    answers = getAllAnswers();
    freeText = getAllFreeText();
    companyName = getCompanyName();
  }

  if (!companyName) {
    navigate('/');
    return;
  }

  const synthesis = computeSynthesis(answers, freeText);

  // Prior confirmation label
  const confirmationMap = {
    'confirmed': 'Confirmed',
    'refined': 'Refined',
    'overturned': 'Overturned',
    'inconclusive': 'Inconclusive',
  };

  containerEl.innerHTML = `
    <div class="page">
      <div class="page-content page-content--wide synthesis">

        <!-- Header -->
        <div class="synthesis-header">
          <h1 class="synthesis-header__company">${companyName}</h1>
          <div class="synthesis-header__meta">
            <div class="synthesis-header__meta-item">
              <span class="synthesis-header__meta-label">Industry Type</span>
              <span class="synthesis-header__meta-value">${synthesis.productType}</span>
            </div>
            <div class="synthesis-header__meta-item">
              <span class="synthesis-header__meta-label">Gross Margin</span>
              <span class="synthesis-header__meta-value">${synthesis.grossMarginBand}</span>
            </div>
            <div class="synthesis-header__meta-item">
              <span class="synthesis-header__meta-label">Trend</span>
              <span class="synthesis-header__meta-value">${synthesis.marginTrend}</span>
            </div>
          </div>
        </div>

        <!-- 1. Profit Pool Map -->
        <div class="synthesis-panel">
          <h3 class="synthesis-panel__title">Profit Pool Position</h3>
          <div id="profit-pool-chart"></div>
        </div>

        <!-- 2. Five Forces Radar -->
        <div class="synthesis-panel">
          <h3 class="synthesis-panel__title">Five Forces Assessment</h3>
          <div id="radar-chart"></div>
        </div>

        <!-- 3. Moat Taxonomy -->
        <div class="synthesis-panel">
          <h3 class="synthesis-panel__title">Moat Analysis</h3>
          <div class="moat-taxonomy">
            ${renderMoatItems(synthesis)}
          </div>
          <div style="margin-top: var(--spacing-lg);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
              <div style="padding: var(--spacing-md); background: var(--c-bg-card);">
                <div style="font-size: var(--fs-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-tertiary); margin-bottom: 4px;">Greenwald Source</div>
                <div style="font-size: var(--fs-base); font-weight: 500;">${synthesis.greenwaldSource}</div>
              </div>
              <div style="padding: var(--spacing-md); background: var(--c-bg-card);">
                <div style="font-size: var(--fs-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-tertiary); margin-bottom: 4px;">Christensen's Job</div>
                <div style="font-size: var(--fs-base); font-weight: 500;">${synthesis.jobType}</div>
              </div>
              <div style="padding: var(--spacing-md); background: var(--c-bg-card); grid-column: 1 / -1;">
                <div style="font-size: var(--fs-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-tertiary); margin-bottom: 4px;">Buffett's Pricing Power</div>
                <div style="font-size: var(--fs-base); font-weight: 500; color: ${getPricingPowerColor(synthesis.pricingPower.strength)}">${synthesis.pricingPower.label}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Cascade Waterfall -->
        <div class="synthesis-panel">
          <h3 class="synthesis-panel__title">Margin Cascade</h3>
          <div class="synthesis-panel__subtitle">Gross Margin → Free Cash Flow Conversion</div>
          <div id="waterfall-chart"></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); margin-top: var(--spacing-md);">
            <div style="padding: var(--spacing-sm) var(--spacing-md); background: var(--c-bg-card); font-size: var(--fs-sm);">
              <span style="color: var(--c-text-tertiary);">SG&A Nature:</span> ${synthesis.cascade.sgaNature}
            </div>
            <div style="padding: var(--spacing-sm) var(--spacing-md); background: var(--c-bg-card); font-size: var(--fs-sm);">
              <span style="color: var(--c-text-tertiary);">R&D Nature:</span> ${synthesis.cascade.rdNature}
            </div>
          </div>
        </div>

        <!-- 5. Durability Assessment -->
        <div class="synthesis-panel">
          <h3 class="synthesis-panel__title">Durability Assessment</h3>
          <div class="durability-grid">
            <div class="durability-metric">
              <div class="durability-metric__label">Margin Half-Life</div>
              <div class="durability-metric__value durability-metric__value--${synthesis.durability.severity}">${synthesis.durability.halfLife}</div>
            </div>
            <div class="durability-metric">
              <div class="durability-metric__label">Primary Compression Risk</div>
              <div class="durability-metric__value">${synthesis.durability.primaryRisk}</div>
            </div>
            <div class="durability-metric">
              <div class="durability-metric__label">Regulatory / Tech Cliff</div>
              <div class="durability-metric__value">${synthesis.durability.cliff}</div>
            </div>
            <div class="durability-metric">
              <div class="durability-metric__label">Most Fragile Moat Element</div>
              <div class="durability-metric__value">${synthesis.durability.fragileElement}</div>
            </div>
          </div>

          ${synthesis.durability.scenarios.length > 0 ? `
            <div class="synthesis-panel__subtitle" style="margin-top: var(--spacing-xl);">Fragility Scenarios</div>
            <div class="fragility-scenarios">
              ${synthesis.durability.scenarios.map((s, i) => `
                <div class="fragility-scenario">
                  <div class="fragility-scenario__number">Scenario ${i + 1}</div>
                  <p class="fragility-scenario__text">${s}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- 6. Prior vs Diagnostic -->
        <div class="synthesis-panel">
          <h3 class="synthesis-panel__title">Prior vs. Diagnostic</h3>
          <div class="prior-comparison">
            <div class="prior-comparison__panel">
              <div class="prior-comparison__label">Your initial hypothesis</div>
              <p class="prior-comparison__text">${synthesis.priorHypothesis || 'No prior hypothesis was recorded.'}</p>
            </div>
            <div class="prior-comparison__panel">
              <div class="prior-comparison__label">Diagnostic conclusion</div>
              <p class="prior-comparison__text">
                ${companyName} occupies the ${synthesis.valueChainPosition} layer with a ${synthesis.grossMarginBand} gross margin.
                The competitive position is ${getOverallLabel(synthesis.overallScore)}.
                ${synthesis.moat.type !== 'Not assessed' ? `Primary moat: ${synthesis.moat.type}.` : ''}
                ${synthesis.pricingPower.label !== 'Not assessed' ? `Pricing power: ${synthesis.pricingPower.label}.` : ''}
                Margin half-life: ${synthesis.durability.halfLife}.
              </p>
            </div>
            <div class="prior-comparison__verdict">
              Verdict: ${confirmationMap[synthesis.priorConfirmation] || 'Not assessed'}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="synthesis-actions">
          <button class="synthesis-btn" id="print-btn">Export PDF</button>
          ${!libraryId ? '<button class="synthesis-btn synthesis-btn--primary" id="new-diagnostic-btn">New Diagnostic</button>' : ''}
          <button class="synthesis-btn" id="back-to-library-btn">Library</button>
        </div>
      </div>
    </div>
  `;

  // Render SVG charts
  renderRadarChart(synthesis.forceScores, document.getElementById('radar-chart'));
  renderWaterfallChart(synthesis.cascade, document.getElementById('waterfall-chart'));
  renderProfitPoolBar(
    answers['L1_value_chain_position'],
    answers['L1_rent_concentration'],
    document.getElementById('profit-pool-chart')
  );

  // Event handlers
  document.getElementById('print-btn').addEventListener('click', () => {
    window.print();
  });

  if (!libraryId) {
    document.getElementById('new-diagnostic-btn').addEventListener('click', () => {
      resetDiagnostic();
      navigate('/');
    });
  }

  document.getElementById('back-to-library-btn').addEventListener('click', () => {
    navigate('/library');
  });
}

/** Render moat items */
function renderMoatItems(synthesis) {
  const moatTypes = [
    { key: 'intangible_asset', label: 'Intangible Asset', desc: 'Brand, patent, or regulatory license' },
    { key: 'switching_cost', label: 'Switching Cost', desc: 'Cost of changing exceeds benefit of alternatives' },
    { key: 'network_effect', label: 'Network Effect', desc: 'Value increases with each user' },
    { key: 'cost_advantage', label: 'Cost Advantage', desc: 'Structurally lower costs than competitors' },
  ];

  const identified = synthesis.moat.type;

  return moatTypes.map(mt => {
    const isActive = identified === mt.label ||
                     identified === 'Multiple Moats' ||
                     (identified === 'Multiple Moats');
    // For single moat, only highlight the matching one
    let active = false;
    if (identified === 'Multiple Moats') active = true;
    else if (identified === mt.label) active = true;

    return `
      <div class="moat-item ${active ? 'moat-item--active' : 'moat-item--inactive'}">
        <span class="moat-item__type">${mt.label}</span>
        <span class="moat-item__description">${mt.desc}</span>
      </div>
    `;
  }).join('');
}

/** Get overall competitive position label */
function getOverallLabel(score) {
  if (score >= 0.7) return 'strong — favorable forces';
  if (score >= 0.5) return 'moderate — mixed forces';
  return 'weak — unfavorable forces';
}

/** Get pricing power color */
function getPricingPowerColor(strength) {
  switch (strength) {
    case 'very_favorable': return 'var(--c-very-favorable)';
    case 'favorable': return 'var(--c-favorable)';
    case 'very_unfavorable': return 'var(--c-very-unfavorable)';
    default: return 'var(--c-text)';
  }
}
