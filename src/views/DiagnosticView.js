/**
 * DiagnosticView — Question-by-question flow
 */

import { navigate } from '../router.js';
import {
  allQuestions, layers, getQuestionByIndex, getLayerForIndex, totalQuestions, getWeightClass
} from '../content/schema.js';
import {
  getCurrentIndex, setCurrentIndex, getAnswer, setAnswer,
  getFreeText, setFreeText, getNote, setNote, getCompanyName,
  isTeachingMode, completeDiagnostic, hasActiveDiagnostic
} from '../state.js';

/** Format force name for display */
function formatForceName(force) {
  if (!force) return '';
  return force.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Render progress bar */
function renderProgressBar(currentLayer) {
  return `
    <div class="progress-bar">
      ${layers.map(layer => {
        let stateClass = 'progress-segment--upcoming';
        if (layer.id < currentLayer) stateClass = 'progress-segment--completed';
        if (layer.id === currentLayer) stateClass = 'progress-segment--current';
        return `
          <div class="progress-segment ${stateClass}">
            <div class="progress-segment__bar"></div>
            <span class="progress-segment__label">${layer.shortName}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/** Render a single question */
function renderQuestion(question, currentIdx) {
  const currentAnswer = question.question_type === 'free_text'
    ? getFreeText(question.question_id)
    : getAnswer(question.question_id);
  const currentNote = getNote(question.question_id);
  const teachingMode = isTeachingMode();
  const panelOpen = teachingMode;

  // Options or free text
  let inputArea = '';
  if (question.question_type === 'free_text') {
    inputArea = `
      <div class="free-text-container">
        <textarea
          class="free-text-input"
          id="free-text-input"
          placeholder="${question.placeholder || 'Enter your response...'}"
        >${currentAnswer || ''}</textarea>
      </div>
    `;
  } else {
    inputArea = `
      <ul class="options-list" id="options-list">
        ${question.options.map(opt => {
          const isSelected = currentAnswer === opt.id;
          const weightClass = getWeightClass(opt.verdict_weight);
          return `
            <li class="option-item ${isSelected ? 'option-item--selected' : ''}" data-option-id="${opt.id}">
              <div class="option-radio">
                <div class="option-radio__dot"></div>
              </div>
              <span class="option-label">
                ${opt.label}
                <span class="option-weight-hint option-weight-hint--${opt.verdict_weight}"></span>
              </span>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  // Learning panel
  const hasLearningContent = question.why_this_matters || (question.worked_examples && question.worked_examples.length > 0);
  let learningPanel = '';
  if (hasLearningContent) {
    learningPanel = `
      <div class="learning-panel ${panelOpen ? 'learning-panel--open' : ''}" id="learning-panel">
        <button class="learning-panel__toggle" id="learning-toggle">
          <span class="learning-panel__toggle-icon">▸</span>
          Why this matters · Worked examples
        </button>
        <div class="learning-panel__body">
          ${question.why_this_matters ? `
            <div class="learning-section">
              <div class="learning-section__title">Why this matters</div>
              <p class="learning-section__text">${question.why_this_matters}</p>
            </div>
          ` : ''}

          ${question.worked_examples && question.worked_examples.length > 0 ? `
            <div class="learning-section">
              <div class="learning-section__title">Worked examples</div>
              <div class="worked-examples">
                ${question.worked_examples.map(ex => {
                  // Determine card border color by the answer it illustrates
                  const illustratedOption = question.options.find(o => o.id === ex.answer_illustrated);
                  const cardClass = illustratedOption ? getWeightClass(illustratedOption.verdict_weight) : 'neutral';
                  return `
                    <div class="worked-example-card worked-example-card--${cardClass}">
                      <div class="worked-example__company">${ex.company}</div>
                      <p class="worked-example__situation">${ex.situation}</p>
                      <p class="worked-example__outcome">${ex.outcome}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          ${question.diagnostic_logic ? `
            <p class="diagnostic-logic">${question.diagnostic_logic}</p>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Show prior hypothesis in Layer 6
  let priorSection = '';
  if (question.show_prior) {
    const priorText = getFreeText('L0_prior_hypothesis') || 'No prior hypothesis was recorded.';
    priorSection = `
      <div style="margin-bottom: var(--spacing-2xl); padding: var(--spacing-lg); background: var(--c-bg-card); border-left: 3px solid var(--c-neutral-accent);">
        <div style="font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-tertiary); margin-bottom: var(--spacing-sm);">Your initial hypothesis</div>
        <p style="font-size: var(--fs-base); color: var(--c-text); font-style: italic; margin: 0;">${priorText}</p>
      </div>
    `;
  }

  // Navigation
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === totalQuestions - 1;
  const hasAnswer = question.question_type === 'free_text'
    ? true  // free text is always navigable (can be empty for optional fields)
    : !!currentAnswer;

  // Determine if this free text is required (fragility scenarios)
  const isRequiredFreeText = question.question_id.startsWith('L5_fragility');

  return `
    <div class="question-screen fade-enter" id="question-screen">
      <div class="question-meta">
        <span class="question-layer-badge">Layer ${question.layer} — ${question.layer_name}</span>
        ${question.force ? `<span class="question-force-badge">${formatForceName(question.force)}</span>` : ''}
      </div>

      <h2 class="question-text">${question.question_text}</h2>

      ${priorSection}
      ${inputArea}

      <!-- Optional notes -->
      ${question.question_type !== 'free_text' ? `
        <div>
          <button class="notes-toggle ${currentNote ? 'notes-toggle--open' : ''}" id="notes-toggle">
            <span class="notes-toggle__icon">▸</span> Add notes
          </button>
          <div id="notes-container" style="display: ${currentNote ? 'block' : 'none'};">
            <textarea class="notes-field" id="notes-field" placeholder="Optional personal notes...">${currentNote || ''}</textarea>
          </div>
        </div>
      ` : ''}

      ${learningPanel}

      <div class="nav-controls">
        <button class="nav-btn" id="nav-back" ${isFirst ? 'disabled' : ''}>← Back</button>
        <span class="nav-question-counter">${currentIdx + 1} of ${totalQuestions}</span>
        ${isLast
          ? `<button class="nav-btn nav-btn--complete" id="nav-complete" ${!hasAnswer ? 'disabled' : ''}>Complete Diagnostic</button>`
          : `<button class="nav-btn nav-btn--primary" id="nav-next" ${!hasAnswer ? 'disabled' : ''}>Next →</button>`
        }
      </div>
    </div>
  `;
}

/** Main render function */
export function renderDiagnosticView(containerEl) {
  if (!hasActiveDiagnostic()) {
    navigate('/');
    return;
  }

  const currentIdx = getCurrentIndex();
  const question = getQuestionByIndex(currentIdx);
  if (!question) {
    navigate('/');
    return;
  }

  const currentLayer = getLayerForIndex(currentIdx);
  const companyName = getCompanyName();

  containerEl.innerHTML = `
    ${renderProgressBar(currentLayer)}
    <div class="page">
      <div class="page-content">
        ${renderQuestion(question, currentIdx)}
      </div>
    </div>
  `;

  // Trigger fade-in animation
  requestAnimationFrame(() => {
    const screen = document.getElementById('question-screen');
    if (screen) {
      screen.classList.remove('fade-enter');
      screen.classList.add('fade-active');
    }
  });

  // Bind event handlers
  bindEventHandlers(question, currentIdx, containerEl);
}

/** Bind all event handlers for the current question */
function bindEventHandlers(question, currentIdx, containerEl) {
  // Option selection
  if (question.question_type !== 'free_text') {
    const optionsList = document.getElementById('options-list');
    if (optionsList) {
      optionsList.addEventListener('click', (e) => {
        const item = e.target.closest('.option-item');
        if (!item) return;

        const optionId = item.dataset.optionId;
        setAnswer(question.question_id, optionId);

        // Update UI
        document.querySelectorAll('.option-item').forEach(el => {
          el.classList.remove('option-item--selected');
        });
        item.classList.add('option-item--selected');

        // Enable next button
        const nextBtn = document.getElementById('nav-next');
        const completeBtn = document.getElementById('nav-complete');
        if (nextBtn) nextBtn.disabled = false;
        if (completeBtn) completeBtn.disabled = false;
      });
    }
  }

  // Free text input
  if (question.question_type === 'free_text') {
    const textInput = document.getElementById('free-text-input');
    if (textInput) {
      let debounceTimer;
      textInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setFreeText(question.question_id, textInput.value);
        }, 300);
      });
    }
  }

  // Notes toggle
  const notesToggle = document.getElementById('notes-toggle');
  if (notesToggle) {
    notesToggle.addEventListener('click', () => {
      const container = document.getElementById('notes-container');
      const isOpen = container.style.display !== 'none';
      container.style.display = isOpen ? 'none' : 'block';
      notesToggle.classList.toggle('notes-toggle--open', !isOpen);
      if (!isOpen) {
        document.getElementById('notes-field').focus();
      }
    });
  }

  // Notes input
  const notesField = document.getElementById('notes-field');
  if (notesField) {
    let debounceTimer;
    notesField.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setNote(question.question_id, notesField.value);
      }, 300);
    });
  }

  // Learning panel toggle
  const learningToggle = document.getElementById('learning-toggle');
  if (learningToggle) {
    learningToggle.addEventListener('click', () => {
      const panel = document.getElementById('learning-panel');
      panel.classList.toggle('learning-panel--open');
    });
  }

  // Navigation
  const backBtn = document.getElementById('nav-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (currentIdx > 0) {
        setCurrentIndex(currentIdx - 1);
        renderDiagnosticView(containerEl);
      }
    });
  }

  const nextBtn = document.getElementById('nav-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIdx < totalQuestions - 1) {
        setCurrentIndex(currentIdx + 1);
        renderDiagnosticView(containerEl);
      }
    });
  }

  const completeBtn = document.getElementById('nav-complete');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      completeDiagnostic();
      navigate('/synthesis');
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', handleKeydown);
  function handleKeydown(e) {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    if (e.key === 'ArrowLeft' && currentIdx > 0) {
      e.preventDefault();
      document.removeEventListener('keydown', handleKeydown);
      setCurrentIndex(currentIdx - 1);
      renderDiagnosticView(containerEl);
    } else if (e.key === 'ArrowRight' && currentIdx < totalQuestions - 1) {
      const hasAnswer = question.question_type === 'free_text' || getAnswer(question.question_id);
      if (hasAnswer) {
        e.preventDefault();
        document.removeEventListener('keydown', handleKeydown);
        setCurrentIndex(currentIdx + 1);
        renderDiagnosticView(containerEl);
      }
    }
  }
}
