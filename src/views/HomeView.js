/**
 * HomeView — Landing page with company name input
 */

import { navigate } from '../router.js';
import { startNewDiagnostic, hasActiveDiagnostic, getCompanyName, isTeachingMode, toggleTeachingMode, resetDiagnostic } from '../state.js';

export function renderHomeView(containerEl) {
  const hasActive = hasActiveDiagnostic();
  const currentCompany = getCompanyName();
  const teachingMode = isTeachingMode();

  containerEl.innerHTML = `
    <div class="page">
      <div class="page-content home">
        <h1 class="home__tagline">Understand margins.<br>Not just measure them.</h1>
        <p class="home__subtitle">
          A structured diagnostic that teaches competitive analysis frameworks through use.
          Walk through 7 layers of analysis — from industry structure to margin durability.
        </p>

        ${hasActive ? `
          <div class="home__resume" style="margin-bottom: var(--spacing-2xl); text-align: center;">
            <p style="font-size: var(--fs-sm); color: var(--c-text-secondary); margin-bottom: var(--spacing-md);">
              You have an active diagnostic for <strong>${currentCompany}</strong>
            </p>
            <div style="display: flex; gap: var(--spacing-md); justify-content: center;">
              <button class="nav-btn nav-btn--primary" id="resume-btn">Resume Diagnostic</button>
              <button class="nav-btn" id="reset-btn">Start New</button>
            </div>
          </div>
        ` : ''}

        <form class="home__form" id="home-form">
          <input
            type="text"
            class="home__input"
            id="company-input"
            placeholder="Enter company name"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="submit" class="home__start-btn" id="start-btn" disabled>
            Begin Diagnostic
          </button>
          <div class="home__mode-row">
            <span class="home__mode-label">Learning panels:</span>
            <button type="button" class="mode-toggle ${teachingMode ? 'mode-toggle--active' : ''}" id="mode-toggle">
              ${teachingMode ? 'Teaching' : 'Power User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Event handlers
  const input = document.getElementById('company-input');
  const startBtn = document.getElementById('start-btn');
  const form = document.getElementById('home-form');
  const modeToggle = document.getElementById('mode-toggle');

  input.addEventListener('input', () => {
    startBtn.disabled = !input.value.trim();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (name) {
      startNewDiagnostic(name);
      navigate('/diagnostic');
    }
  });

  modeToggle.addEventListener('click', () => {
    const newMode = toggleTeachingMode();
    modeToggle.textContent = newMode ? 'Teaching' : 'Power User';
    modeToggle.classList.toggle('mode-toggle--active', newMode);
  });

  // Resume / Reset handlers
  if (hasActive) {
    document.getElementById('resume-btn').addEventListener('click', () => {
      navigate('/diagnostic');
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      resetDiagnostic();
      renderHomeView(containerEl);
    });
  }

  // Focus the input
  setTimeout(() => input.focus(), 100);
}
