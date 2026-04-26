/**
 * Margin Diagnostic Engine — Main Entry Point
 */

import './styles/base.css';
import './styles/layout.css';
import './styles/question.css';
import './styles/synthesis.css';
import './styles/charts.css';
import './styles/print.css';

import { route, initRouter, navigate } from './router.js';
import { initState } from './state.js';
import { renderHomeView } from './views/HomeView.js';
import { renderDiagnosticView } from './views/DiagnosticView.js';
import { renderSynthesisView } from './views/SynthesisView.js';
import { renderLibraryView } from './views/LibraryView.js';

// Initialize state from localStorage
initState();

// Get the app container
const app = document.getElementById('app');

/** Render header + main container */
function renderShell() {
  app.innerHTML = `
    <header class="site-header">
      <a href="#/" class="site-title">Margin Diagnostic</a>
      <nav class="site-nav">
        <a href="#/library">Library</a>
      </nav>
    </header>
    <main id="main-content"></main>
    <footer class="site-footer">
      A structured reasoning engine for competitive analysis.
    </footer>
  `;
}

renderShell();

const main = document.getElementById('main-content');

// Register routes
route('/', () => {
  renderHomeView(main);
});

route('/diagnostic', () => {
  renderDiagnosticView(main);
});

route('/synthesis', () => {
  renderSynthesisView(main);
});

route('/synthesis/:id', (params) => {
  renderSynthesisView(main, params.id);
});

route('/library', () => {
  renderLibraryView(main);
});

// Start router
initRouter();
