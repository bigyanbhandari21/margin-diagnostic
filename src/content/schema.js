/**
 * Content Schema — Loads and indexes all question content
 */

import layer0 from './layer0-setup.json';
import layer1 from './layer1-profit-pool.json';
import layer2 from './layer2-five-forces.json';
import layer3 from './layer3-mental-models.json';
import layer4 from './layer4-cascade.json';
import layer5 from './layer5-durability.json';
import layer6 from './layer6-synthesis.json';

/** All questions in order */
export const allQuestions = [
  ...layer0,
  ...layer1,
  ...layer2,
  ...layer3,
  ...layer4,
  ...layer5,
  ...layer6,
];

/** Questions indexed by ID */
export const questionById = {};
allQuestions.forEach(q => {
  questionById[q.question_id] = q;
});

/** Questions grouped by layer */
export const questionsByLayer = {};
allQuestions.forEach(q => {
  if (!questionsByLayer[q.layer]) questionsByLayer[q.layer] = [];
  questionsByLayer[q.layer].push(q);
});

/** Layer metadata */
export const layers = [
  { id: 0, name: 'Setup', shortName: 'Setup' },
  { id: 1, name: 'Profit Pool', shortName: 'Pool' },
  { id: 2, name: 'Five Forces', shortName: 'Forces' },
  { id: 3, name: 'Mental Models', shortName: 'Models' },
  { id: 4, name: 'The Cascade', shortName: 'Cascade' },
  { id: 5, name: 'Durability', shortName: 'Durability' },
  { id: 6, name: 'Synthesis', shortName: 'Synthesis' },
];

/** Get the total number of questions */
export const totalQuestions = allQuestions.length;

/** Get question index (0-based) from question_id */
export function getQuestionIndex(questionId) {
  return allQuestions.findIndex(q => q.question_id === questionId);
}

/** Get question by its position index */
export function getQuestionByIndex(index) {
  return allQuestions[index] || null;
}

/** Get the layer for a given question index */
export function getLayerForIndex(index) {
  const question = allQuestions[index];
  return question ? question.layer : -1;
}

/** Get forces within Layer 2 */
export const fiveForces = [
  { id: 'supplier_power', label: 'Supplier Power' },
  { id: 'buyer_power', label: 'Buyer Power' },
  { id: 'threat_of_entrants', label: 'Threat of New Entrants' },
  { id: 'threat_of_substitutes', label: 'Threat of Substitutes' },
  { id: 'competitive_rivalry', label: 'Competitive Rivalry' },
];

/** Get the verdict weight color class for an option */
export function getWeightClass(verdictWeight) {
  const map = {
    'very_favorable': 'favorable',
    'favorable': 'favorable',
    'neutral': 'neutral',
    'unfavorable': 'unfavorable',
    'very_unfavorable': 'unfavorable',
  };
  return map[verdictWeight] || 'neutral';
}
