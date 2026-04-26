/**
 * State Management — All diagnostic answers and persistence
 */

const STORAGE_KEY = 'margin_diagnostic_current';
const LIBRARY_KEY = 'margin_diagnostic_library';
const SETTINGS_KEY = 'margin_diagnostic_settings';

/** Default state for a new diagnostic */
function createEmptyState() {
  return {
    companyName: '',
    answers: {},       // { question_id: option_id }
    notes: {},         // { question_id: text }
    freeText: {},      // { question_id: text }
    currentIndex: 0,   // current question index
    startedAt: null,
    completedAt: null,
  };
}

/** Current diagnostic state */
let state = createEmptyState();

/** Settings */
let settings = {
  teachingMode: true,  // true = learning panels expanded by default
  completedCount: 0,
};

// --- Initialization ---

export function initState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      state = createEmptyState();
    }
  }

  const savedSettings = localStorage.getItem(SETTINGS_KEY);
  if (savedSettings) {
    try {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    } catch (e) { /* use defaults */ }
  }

  // Auto-set teaching mode based on completed count
  if (settings.completedCount >= 3) {
    settings.teachingMode = false;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Getters ---

export function getState() {
  return state;
}

export function getCompanyName() {
  return state.companyName;
}

export function getAnswer(questionId) {
  return state.answers[questionId] || null;
}

export function getFreeText(questionId) {
  return state.freeText[questionId] || '';
}

export function getNote(questionId) {
  return state.notes[questionId] || '';
}

export function getCurrentIndex() {
  return state.currentIndex;
}

export function getAllAnswers() {
  return { ...state.answers };
}

export function getAllFreeText() {
  return { ...state.freeText };
}

export function isTeachingMode() {
  return settings.teachingMode;
}

export function getCompletedCount() {
  return settings.completedCount;
}

export function hasActiveDiagnostic() {
  return state.companyName && state.startedAt;
}

// --- Setters ---

export function setCompanyName(name) {
  state.companyName = name;
  state.startedAt = state.startedAt || new Date().toISOString();
  saveState();
}

export function setAnswer(questionId, optionId) {
  state.answers[questionId] = optionId;
  saveState();
}

export function setFreeText(questionId, text) {
  state.freeText[questionId] = text;
  saveState();
}

export function setNote(questionId, text) {
  state.notes[questionId] = text;
  saveState();
}

export function setCurrentIndex(index) {
  state.currentIndex = index;
  saveState();
}

export function setTeachingMode(mode) {
  settings.teachingMode = mode;
  saveSettings();
}

export function toggleTeachingMode() {
  settings.teachingMode = !settings.teachingMode;
  saveSettings();
  return settings.teachingMode;
}

// --- Diagnostic Lifecycle ---

export function startNewDiagnostic(companyName) {
  state = createEmptyState();
  state.companyName = companyName;
  state.startedAt = new Date().toISOString();
  saveState();
}

export function completeDiagnostic() {
  state.completedAt = new Date().toISOString();
  saveState();

  // Save to library
  const library = getLibrary();
  library.push({
    id: Date.now().toString(),
    companyName: state.companyName,
    answers: { ...state.answers },
    freeText: { ...state.freeText },
    notes: { ...state.notes },
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  });
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));

  // Increment completed count
  settings.completedCount += 1;
  saveSettings();
}

export function resetDiagnostic() {
  state = createEmptyState();
  localStorage.removeItem(STORAGE_KEY);
}

// --- Library ---

export function getLibrary() {
  const saved = localStorage.getItem(LIBRARY_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function getLibraryItem(id) {
  return getLibrary().find(item => item.id === id) || null;
}

export function deleteLibraryItem(id) {
  const library = getLibrary().filter(item => item.id !== id);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}
