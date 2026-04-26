/**
 * LibraryView — List of completed diagnostics
 */

import { navigate } from '../router.js';
import { getLibrary, deleteLibraryItem } from '../state.js';

export function renderLibraryView(containerEl) {
  const library = getLibrary();

  containerEl.innerHTML = `
    <div class="page">
      <div class="page-content library">
        <h2 class="library__title">Diagnostic Library</h2>
        <p class="library__subtitle">${library.length} completed diagnostic${library.length !== 1 ? 's' : ''}</p>

        ${library.length === 0 ? `
          <div class="library__empty">
            <p class="library__empty-text">No diagnostics completed yet.</p>
            <button class="nav-btn nav-btn--primary" id="start-first">Begin Your First Diagnostic</button>
          </div>
        ` : `
          <div class="library-list">
            ${library.slice().reverse().map(item => {
              const date = new Date(item.completedAt);
              const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              // Get summary data
              const marginBand = getMarginLabel(item.answers['L0_gross_margin_band']);
              const moat = getMoatLabel(item.answers['L3_dorsey_moat']);

              return `
                <div class="library-item" data-id="${item.id}">
                  <div class="library-item__info">
                    <div class="library-item__company">${item.companyName}</div>
                    <div class="library-item__meta">
                      <span>${dateStr}</span>
                      <span>${marginBand}</span>
                      <span>${moat}</span>
                    </div>
                  </div>
                  <div class="library-item__actions">
                    <button class="library-item__delete" data-delete-id="${item.id}">Delete</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  // Event handlers
  if (library.length === 0) {
    document.getElementById('start-first')?.addEventListener('click', () => navigate('/'));
  }

  // Click to view
  document.querySelectorAll('.library-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.library-item__delete')) return;
      const id = el.dataset.id;
      navigate(`/synthesis/${id}`);
    });
  });

  // Delete
  document.querySelectorAll('.library-item__delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteId;
      if (confirm('Delete this diagnostic?')) {
        deleteLibraryItem(id);
        renderLibraryView(containerEl);
      }
    });
  });
}

function getMarginLabel(answer) {
  const map = {
    'under_20': '<20%', '20_40': '20-40%', '40_60': '40-60%',
    '60_80': '60-80%', 'over_80': '>80%',
  };
  return map[answer] || 'N/A';
}

function getMoatLabel(answer) {
  const map = {
    'intangible_asset': 'Intangible', 'switching_cost': 'Switching Cost',
    'network_effect': 'Network', 'cost_advantage': 'Cost', 'multiple': 'Multiple',
    'none': 'None',
  };
  return map[answer] || 'N/A';
}
