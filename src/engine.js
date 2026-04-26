/**
 * Scoring Engine — Pure functions that compute synthesis from answers
 */

import { questionById, fiveForces, allQuestions } from './content/schema.js';

/** Weight values for verdict weights */
const WEIGHT_VALUES = {
  'very_favorable': 2,
  'favorable': 1,
  'neutral': 0,
  'unfavorable': -1,
  'very_unfavorable': -2,
};

/**
 * Get the numeric score for a given answer
 */
function getAnswerScore(questionId, answerId) {
  const question = questionById[questionId];
  if (!question || !answerId) return 0;
  const option = question.options.find(o => o.id === answerId);
  return option ? (WEIGHT_VALUES[option.verdict_weight] || 0) : 0;
}

/**
 * Get the verdict weight string for a given answer
 */
function getAnswerWeight(questionId, answerId) {
  const question = questionById[questionId];
  if (!question || !answerId) return 'neutral';
  const option = question.options.find(o => o.id === answerId);
  return option ? option.verdict_weight : 'neutral';
}

/**
 * Compute Five Forces scores (Layer 2)
 * Returns { force_id: { score: number, max: number, normalized: number, label: string } }
 */
export function computeForceScores(answers) {
  const scores = {};

  fiveForces.forEach(force => {
    const forceQuestions = allQuestions.filter(
      q => q.layer === 2 && q.force === force.id
    );

    let totalScore = 0;
    let maxPossible = 0;
    let answeredCount = 0;

    forceQuestions.forEach(q => {
      if (answers[q.question_id]) {
        totalScore += getAnswerScore(q.question_id, answers[q.question_id]);
        answeredCount++;
      }
      // Max possible is 2 per question (very_favorable)
      maxPossible += 2;
    });

    // Normalize to 0-1 range where 0 = worst, 1 = best
    const minPossible = -2 * forceQuestions.length;
    const normalized = answeredCount > 0
      ? (totalScore - minPossible) / (maxPossible - minPossible)
      : 0.5;

    // Label based on normalized score
    let label = 'Neutral';
    if (normalized >= 0.7) label = 'Favorable';
    else if (normalized <= 0.3) label = 'Unfavorable';

    scores[force.id] = {
      score: totalScore,
      max: maxPossible,
      normalized: Math.max(0, Math.min(1, normalized)),
      label,
      name: force.label,
    };
  });

  return scores;
}

/**
 * Compute overall competitive position score
 */
export function computeOverallScore(forceScores) {
  const values = Object.values(forceScores);
  if (values.length === 0) return 0.5;
  const avg = values.reduce((sum, f) => sum + f.normalized, 0) / values.length;
  return avg;
}

/**
 * Identify moat type from Layer 3 answers
 */
export function identifyMoat(answers) {
  const moatAnswer = answers['L3_dorsey_moat'];
  const moatMap = {
    'intangible_asset': { type: 'Intangible Asset', description: 'Brand, patent, or regulatory license creates a barrier competitors cannot replicate easily.' },
    'switching_cost': { type: 'Switching Cost', description: 'Customers remain because the cost of changing exceeds the benefit of alternatives.' },
    'network_effect': { type: 'Network Effect', description: 'Each additional user makes the product more valuable for all users.' },
    'cost_advantage': { type: 'Cost Advantage', description: 'Structurally lower costs allow sustainable pricing below competitors\' break-even.' },
    'multiple': { type: 'Multiple Moats', description: 'Two or more moat types reinforce each other, creating compounding competitive advantage.' },
    'none': { type: 'None Identified', description: 'No clear structural advantage. Margins are earned through execution, not position.' },
  };
  return moatMap[moatAnswer] || { type: 'Not assessed', description: '' };
}

/**
 * Get Greenwald source
 */
export function identifyGreenwaldSource(answers) {
  const sourceAnswer = answers['L3_greenwald_source'];
  const sourceMap = {
    'customer_captivity': 'Customer captivity',
    'production_advantage': 'Production advantage',
    'local_scale': 'Local scale economy',
    'none': 'No structural advantage',
  };
  return sourceMap[sourceAnswer] || 'Not assessed';
}

/**
 * Get Christensen job type
 */
export function identifyJobType(answers) {
  const jobAnswer = answers['L3_christensen_job'];
  const jobMap = {
    'functional_only': 'Functional / utility',
    'emotional_social': 'Emotional / identity',
    'reinforcing': 'Mutually reinforcing (functional + emotional)',
    'job_redefined': 'Job being redefined',
  };
  return jobMap[jobAnswer] || 'Not assessed';
}

/**
 * Get Buffett pricing power assessment
 */
export function assessPricingPower(answers) {
  const ppAnswer = answers['L3_buffett_pricing_power'];
  const ppMap = {
    'demonstrated_yes': { label: 'Demonstrated', strength: 'very_favorable' },
    'probably_yes': { label: 'Probable', strength: 'favorable' },
    'uncertain': { label: 'Uncertain', strength: 'neutral' },
    'demonstrated_no': { label: 'Absent', strength: 'very_unfavorable' },
  };
  return ppMap[ppAnswer] || { label: 'Not assessed', strength: 'neutral' };
}

/**
 * Compute cascade data from Layer 4
 */
export function computeCascade(answers) {
  const grossMarginAnswer = answers['L0_gross_margin_band'];
  const sgaShare = answers['L4_sga_rd_share'];
  const sgaNature = answers['L4_sga_nature'];
  const rdNature = answers['L4_rd_nature'];
  const interestBurden = answers['L4_interest_burden'];
  const workingCapital = answers['L4_working_capital'];

  // Approximate midpoints for gross margin bands
  const grossMarginMap = {
    'under_20': 15, '20_40': 30, '40_60': 50, '60_80': 70, 'over_80': 85,
  };
  const grossMargin = grossMarginMap[grossMarginAnswer] || 50;

  // SG&A consumption rates
  const sgaConsumptionMap = {
    'under_25': 0.20, '25_50': 0.375, '50_75': 0.625, 'over_75': 0.80,
  };
  const sgaRate = sgaConsumptionMap[sgaShare] || 0.5;

  // Interest burden
  const interestMap = {
    'under_10': 0.05, '10_25': 0.175, '25_50': 0.375, 'over_50': 0.60,
  };
  const interestRate = interestMap[interestBurden] || 0.1;

  // Working capital adjustment
  const wcMap = {
    'negative_wc': 1.10, 'neutral': 1.0, 'mild_consumer': 0.90, 'heavy_consumer': 0.75,
  };
  const wcFactor = wcMap[workingCapital] || 1.0;

  // Compute cascade
  const operatingMargin = grossMargin * (1 - sgaRate);
  const netMargin = operatingMargin * (1 - interestRate);
  const fcfConversion = netMargin * wcFactor;

  // Nature labels
  const sgaNatureMap = {
    'moat_maintenance': 'Moat maintenance', 'growth_investment': 'Growth investment',
    'overhead': 'Overhead', 'mix': 'Mixed',
  };
  const rdNatureMap = {
    'pure_expense': 'Expense', 'mostly_investment': 'Investment',
    'not_material': 'Not material', 'cannot_determine': 'Unclear',
  };

  return {
    grossMargin,
    sgaConsumption: grossMargin * sgaRate,
    operatingMargin,
    interestExpense: operatingMargin * interestRate,
    netMargin,
    wcAdjustment: netMargin * (wcFactor - 1),
    fcfConversion,
    sgaNature: sgaNatureMap[sgaNature] || 'Not specified',
    rdNature: rdNatureMap[rdNature] || 'Not specified',
    steps: [
      { label: 'Gross Margin', value: grossMargin, type: 'total' },
      { label: 'SG&A + R&D', value: -(grossMargin * sgaRate), type: 'negative', annotation: sgaNatureMap[sgaNature] || '' },
      { label: 'Operating Margin', value: operatingMargin, type: 'total' },
      { label: 'Interest', value: -(operatingMargin * interestRate), type: 'negative' },
      { label: 'Net Margin', value: netMargin, type: 'total' },
      { label: 'Working Capital', value: netMargin * (wcFactor - 1), type: wcFactor >= 1 ? 'positive' : 'negative' },
      { label: 'FCF Conversion', value: fcfConversion, type: 'total' },
    ],
  };
}

/**
 * Compute durability assessment from Layer 5
 */
export function computeDurability(answers, freeText) {
  const halfLife = answers['L5_margin_half_life'];
  const primaryRisk = answers['L5_primary_compression_risk'];
  const cliff = answers['L5_regulatory_tech_cliff'];
  const fragileElement = answers['L5_fragile_moat_element'];

  const halfLifeMap = {
    'under_3y': 'Under 3 years',
    '3_7y': '3–7 years',
    '7_15y': '7–15 years',
    'over_15y': 'Over 15 years',
    'perpetual': 'Effectively perpetual',
  };

  const riskMap = {
    'supplier': 'Supplier power',
    'buyer': 'Buyer power',
    'entrant': 'New entrant',
    'substitute': 'Substitute',
    'rivalry': 'Competitive rivalry',
    'internal': 'Internal execution',
  };

  const cliffMap = {
    'dated': 'Yes — dated',
    'undated_plausible': 'Yes — undated but plausible',
    'possible_distant': 'Possible but distant',
    'none_visible': 'None visible',
  };

  const fragileMap = {
    'brand_erosion': 'Brand erosion',
    'patent_expiry': 'Patent expiry',
    'network_unraveling': 'Network unraveling',
    'cost_erosion': 'Cost advantage erosion',
    'switching_reduction': 'Switching cost reduction',
    'multiple': 'Multiple elements',
  };

  // Determine severity
  let severity = 'neutral';
  if (halfLife === 'perpetual' || halfLife === 'over_15y') severity = 'favorable';
  else if (halfLife === 'under_3y' || halfLife === '3_7y') severity = 'unfavorable';

  const scenarios = [
    freeText['L5_fragility_scenario_1'] || '',
    freeText['L5_fragility_scenario_2'] || '',
    freeText['L5_fragility_scenario_3'] || '',
  ].filter(s => s.trim());

  return {
    halfLife: halfLifeMap[halfLife] || 'Not assessed',
    halfLifeRaw: halfLife,
    primaryRisk: riskMap[primaryRisk] || 'Not assessed',
    primaryRiskRaw: primaryRisk,
    cliff: cliffMap[cliff] || 'Not assessed',
    fragileElement: fragileMap[fragileElement] || 'Not assessed',
    severity,
    scenarios,
  };
}

/**
 * Get product type label
 */
export function getProductType(answers) {
  const typeMap = {
    'b2b_critical': 'B2B Critical Input',
    'b2b_discretionary': 'B2B Discretionary',
    'b2c_necessity': 'B2C Necessity',
    'b2c_discretionary': 'B2C Discretionary',
    'b2c_luxury': 'B2C Luxury',
    'platform': 'Platform / Marketplace',
  };
  return typeMap[answers['L0_product_type']] || 'Not specified';
}

/**
 * Get gross margin band label
 */
export function getGrossMarginBand(answers) {
  const bandMap = {
    'under_20': 'Under 20%',
    '20_40': '20–40%',
    '40_60': '40–60%',
    '60_80': '60–80%',
    'over_80': 'Over 80%',
  };
  return bandMap[answers['L0_gross_margin_band']] || 'Not specified';
}

/**
 * Get margin trend label
 */
export function getMarginTrend(answers) {
  const trendMap = {
    'expanding': 'Expanding',
    'stable': 'Stable',
    'compressing': 'Compressing',
    'volatile': 'Volatile',
    'insufficient_data': 'Insufficient data',
  };
  return trendMap[answers['L0_margin_trend']] || 'Not specified';
}

/**
 * Get value chain position
 */
export function getValueChainPosition(answers) {
  const posMap = {
    'raw_materials': 'Raw Materials',
    'component': 'Component / Sub-assembly',
    'assembly': 'Assembly / Manufacturing',
    'brand_ip': 'Brand / Design / IP',
    'distribution': 'Distribution / Retail',
    'platform': 'Platform / Network',
  };
  return posMap[answers['L1_value_chain_position']] || 'Not specified';
}

/**
 * Compute the full synthesis object from all answers
 */
export function computeSynthesis(answers, freeText) {
  const forceScores = computeForceScores(answers);
  const overallScore = computeOverallScore(forceScores);
  const moat = identifyMoat(answers);
  const greenwaldSource = identifyGreenwaldSource(answers);
  const jobType = identifyJobType(answers);
  const pricingPower = assessPricingPower(answers);
  const cascade = computeCascade(answers);
  const durability = computeDurability(answers, freeText);

  return {
    productType: getProductType(answers),
    grossMarginBand: getGrossMarginBand(answers),
    marginTrend: getMarginTrend(answers),
    valueChainPosition: getValueChainPosition(answers),
    forceScores,
    overallScore,
    moat,
    greenwaldSource,
    jobType,
    pricingPower,
    cascade,
    durability,
    priorHypothesis: freeText['L0_prior_hypothesis'] || '',
    priorConfirmation: answers['L6_prior_confirmation'] || '',
  };
}
