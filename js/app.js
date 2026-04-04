/* ========================================
   GitPulse — App Controller
   Events, view switching, state
   ======================================== */

const Toast = (() => {
  function show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }

  return { show };
})();

const App = (() => {
  const inputView = document.getElementById('input-view');
  const profileView = document.getElementById('profile-view');
  const usernameInput = document.getElementById('username-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const searchBar = document.getElementById('search-bar');
  const loadingOverlay = document.getElementById('loading-overlay');
  const chipsContainer = document.getElementById('example-chips');

  let currentStats = null;

  function init() {
    renderChips();
    bindEvents();
  }

  function renderChips() {
    chipsContainer.innerHTML = SAMPLE_USERNAMES.map((name, i) =>
      `<button class="chip fade-slide-up" style="animation-delay:${0.3 + i * 0.05}s" data-username="${name}">${name}</button>`
    ).join('');
  }

  function bindEvents() {
    analyzeBtn.addEventListener('click', handleAnalyze);

    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleAnalyze();
      } else if (e.key === 'Enter') {
        handleAnalyze();
      }
    });

    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      usernameInput.value = chip.dataset.username;
      handleAnalyze();
    });

    document.getElementById('back-to-input').addEventListener('click', (e) => {
      e.preventDefault();
      showInputView();
    });

    document.getElementById('new-search-btn').addEventListener('click', showInputView);

    document.getElementById('export-btn').addEventListener('click', () => ExportCard.open());
    document.getElementById('modal-close').addEventListener('click', () => ExportCard.close());
    document.getElementById('download-png-btn').addEventListener('click', () => ExportCard.downloadPNG());
    document.getElementById('copy-clipboard-btn').addEventListener('click', () => ExportCard.copyToClipboard());

    document.getElementById('export-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) ExportCard.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') ExportCard.close();
    });
  }

  async function handleAnalyze() {
    const username = usernameInput.value.trim();
    if (!username) {
      Toast.show('Please enter a GitHub username.', 'warning');
      usernameInput.focus();
      return;
    }

    setLoading(true);

    try {
      const data = await GitHubAPI.fetchAll(username);
      currentStats = Stats.calculate(data);
      ExportCard.setStats(currentStats);
      showProfileView();
      Renderer.render(currentStats);
    } catch (err) {
      Toast.show(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    loadingOverlay.hidden = !loading;
    searchBar.classList.toggle('loading', loading);
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = analyzeBtn.querySelector('.btn-loader');
    btnText.hidden = loading;
    btnLoader.hidden = !loading;
    analyzeBtn.disabled = loading;
    usernameInput.disabled = loading;
  }

  function showInputView() {
    Renderer.cleanup();
    inputView.classList.add('active');
    profileView.classList.remove('active');
    usernameInput.value = '';
    usernameInput.focus();
  }

  function showProfileView() {
    inputView.classList.remove('active');
    profileView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
