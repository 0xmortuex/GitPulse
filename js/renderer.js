/* ========================================
   GitPulse — Renderer
   Render profile card, charts, heatmap
   ======================================== */

const Renderer = (() => {
  let langChart = null;
  let timelineChart = null;
  let heatmapTooltip = null;

  function render(stats) {
    hideSkeleton();
    renderHeader(stats);
    renderLanguages(stats);
    renderTopRepos(stats);
    renderHeatmap(stats);
    renderTimeline(stats);
    renderInsights(stats);
    renderRecentActivity(stats);
    renderScore(stats);
    animateCards();
    animateCounters();
  }

  // Skeleton loader is tied to the real fetch lifecycle: app.js calls
  // showSkeleton() the moment the GitHub API requests kick off, and
  // render() (called only once every request has actually resolved) hides
  // it again and reveals the populated card.
  function showSkeleton() {
    const skeleton = document.getElementById('profile-skeleton');
    const main = document.getElementById('profile-main');
    if (skeleton) skeleton.hidden = false;
    if (main) main.hidden = true;
  }

  function hideSkeleton() {
    const skeleton = document.getElementById('profile-skeleton');
    const main = document.getElementById('profile-main');
    if (main) main.hidden = false;
    if (skeleton) skeleton.hidden = true;
  }

  function renderHeader(stats) {
    const { user, totalStars, totalForks, memberSince } = stats;

    document.getElementById('profile-avatar').src = user.avatar_url;
    document.getElementById('profile-avatar').alt = `${user.login} avatar`;
    document.getElementById('profile-username').textContent = user.login;
    document.getElementById('profile-name').textContent = user.name || '';
    document.getElementById('profile-bio').textContent = user.bio || '';

    // Meta — all fields below (location, blog, company) are arbitrary
    // user-controlled text from the GitHub profile and must be escaped.
    const metaEl = document.getElementById('profile-meta');
    const metas = [];
    if (user.location) {
      metas.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(user.location)}</span>`);
    }
    if (user.blog) {
      const url = safeHttpUrl(user.blog);
      if (url) {
        metas.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(user.blog)}</a></span>`);
      } else {
        metas.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>${escapeHtml(user.blog)}</span>`);
      }
    }
    if (user.company) {
      metas.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v.01M12 14v.01M16 14v.01M8 18v.01M12 18v.01M16 18v.01"/></svg>${escapeHtml(user.company)}</span>`);
    }
    metaEl.innerHTML = metas.join('');

    // Stats
    const statsEl = document.getElementById('profile-stats');
    statsEl.innerHTML = `
      <div class="stat-mini">
        <div class="stat-mini-value counter" data-target="${user.public_repos}">0</div>
        <div class="stat-mini-label">Repos</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value counter" data-target="${totalStars}">0</div>
        <div class="stat-mini-label">Stars</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value counter" data-target="${totalForks}">0</div>
        <div class="stat-mini-label">Forks</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value counter" data-target="${user.followers}">0</div>
        <div class="stat-mini-label">Followers</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value counter" data-target="${user.following}">0</div>
        <div class="stat-mini-label">Following</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value">${memberSince}</div>
        <div class="stat-mini-label">Since</div>
      </div>
    `;
  }

  function renderLanguages(stats) {
    const container = document.getElementById('languages-content');

    if (stats.languages.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No language data available.</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="languages-wrapper">
        <div class="lang-chart-container">
          <canvas id="lang-chart"></canvas>
        </div>
        <div class="lang-legend">
          ${stats.languages.map(l => `
            <div class="lang-item">
              <span class="lang-dot" style="background:${l.color}"></span>
              <span class="lang-name">${escapeHtml(l.name)}</span>
              <span class="lang-pct">${l.percentage}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (langChart) langChart.destroy();

    const ctx = document.getElementById('lang-chart').getContext('2d');
    langChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: stats.languages.map(l => l.name),
        datasets: [{
          data: stats.languages.map(l => parseFloat(l.percentage)),
          backgroundColor: stats.languages.map(l => l.color),
          borderColor: '#16161f',
          borderWidth: 2,
          hoverBorderColor: '#f1f5f9',
          hoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#12121a',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: '#1e293b',
            borderWidth: 1,
            padding: 8,
            displayColors: true,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed}%`
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: Motion.prefersReduced() ? 0 : 1000
        }
      }
    });
  }

  function renderTopRepos(stats) {
    const container = document.getElementById('repos-content');

    if (stats.topRepos.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No public repositories.</p></div>';
      return;
    }

    // Repo name/description/URL are arbitrary user-controlled text (any GitHub
    // repo owner can set them to anything) — always escape before injecting.
    container.innerHTML = `
      <div class="repo-list">
        ${stats.topRepos.map((r, i) => `
          <div class="repo-item repo-item-reveal" style="animation-delay:${i * 60}ms">
            <div class="repo-info">
              <a class="repo-name" href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>
              <div class="repo-desc">${r.description ? escapeHtml(truncate(r.description, 60)) : '<span style="color:var(--text-muted);font-style:italic">No description</span>'}</div>
              <div class="repo-meta">
                ${r.language ? `<span class="repo-lang"><span class="repo-lang-dot" style="background:${getLanguageColor(r.language)}"></span>${escapeHtml(r.language)}</span>` : ''}
                <span class="repo-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${formatNum(r.stargazers_count)}</span>
                <span class="repo-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7V3M17 7V3M7 7h10M7 7a4 4 0 00-4 4v0a4 4 0 004 4h0M17 7a4 4 0 014 4v0a4 4 0 01-4 4h0M7 15v4a2 2 0 002 2h6a2 2 0 002-2v-4"/></svg>${formatNum(r.forks_count)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderHeatmap(stats) {
    const container = document.getElementById('heatmap-content');
    const days = stats.heatmapData;
    const dates = Object.keys(days).sort();

    if (dates.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No activity data available.</p></div>';
      return;
    }

    // Find the start day of week (0=Sun)
    const startDate = new Date(dates[0]);
    const startDay = startDate.getDay();

    // Build weeks
    const weeks = [];
    let currentWeek = [];

    // Pad first week
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }

    dates.forEach(date => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ date, count: days[date] });
    });

    // Pad last week
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);

    // Month labels
    const months = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay) {
        const m = new Date(firstDay.date).getMonth();
        if (m !== lastMonth) {
          months.push({ index: i, name: new Date(firstDay.date).toLocaleDateString('en', { month: 'short' }) });
          lastMonth = m;
        }
      }
    });

    const cellSize = 12;
    const gap = 2;
    const weekWidth = cellSize + gap;

    container.innerHTML = `
      <div class="heatmap-wrapper">
        <div class="heatmap-container">
          <div class="heatmap-months" style="padding-left:32px">
            ${months.map(m => `<span class="heatmap-month-label" style="position:relative;left:${m.index * weekWidth}px">${m.name}</span>`).join('')}
          </div>
          <div class="heatmap-body">
            <div class="heatmap-days-labels">
              <span class="heatmap-day-label">&nbsp;</span>
              <span class="heatmap-day-label">Mon</span>
              <span class="heatmap-day-label">&nbsp;</span>
              <span class="heatmap-day-label">Wed</span>
              <span class="heatmap-day-label">&nbsp;</span>
              <span class="heatmap-day-label">Fri</span>
              <span class="heatmap-day-label">&nbsp;</span>
            </div>
            <div class="heatmap-grid">
              ${weeks.map((week, wi) => `
                <div class="heatmap-week">
                  ${week.map((day, di) => {
                    if (!day) return `<div class="heatmap-cell heatmap-0" style="visibility:hidden"></div>`;
                    const level = getHeatLevel(day.count);
                    const dateStr = formatDate(day.date);
                    // Diagonal wave: cells on the same (week + day) diagonal
                    // fade in together, so the wave sweeps across the grid
                    // instead of a flat left-to-right scan.
                    const waveDelay = (wi + di) * 18;
                    return `<div class="heatmap-cell heatmap-${level} heatmap-cell-reveal"
                      data-date="${dateStr}"
                      data-count="${day.count}"
                      style="animation-delay:${waveDelay}ms"
                    ></div>`;
                  }).join('')}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Tooltip
    setupHeatmapTooltip(container);
    // Reveal wave is pure CSS (.heatmap-cell-reveal + animation-delay above);
    // prefers-reduced-motion is handled globally by the CSS media query,
    // which collapses the animation to effectively instant.
  }

  function setupHeatmapTooltip(container) {
    if (heatmapTooltip) heatmapTooltip.remove();
    heatmapTooltip = document.createElement('div');
    heatmapTooltip.className = 'heatmap-tooltip';
    heatmapTooltip.style.display = 'none';
    document.body.appendChild(heatmapTooltip);

    container.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.heatmap-cell[data-date]');
      if (!cell) return;
      const count = cell.dataset.count;
      const date = cell.dataset.date;
      heatmapTooltip.textContent = `${count} event${count !== '1' ? 's' : ''} on ${date}`;
      heatmapTooltip.style.display = 'block';
    });

    container.addEventListener('mousemove', (e) => {
      if (heatmapTooltip.style.display === 'block') {
        heatmapTooltip.style.left = (e.clientX + 12) + 'px';
        heatmapTooltip.style.top = (e.clientY - 8) + 'px';
      }
    });

    container.addEventListener('mouseout', (e) => {
      if (!e.target.closest('.heatmap-cell[data-date]')) {
        heatmapTooltip.style.display = 'none';
      }
    });
  }

  function renderTimeline(stats) {
    const { labels, data } = stats.repoTimeline;

    if (labels.length === 0) {
      document.getElementById('card-timeline').querySelector('.card-body').innerHTML =
        '<div class="empty-state"><p>No repository timeline data.</p></div>';
      return;
    }

    if (timelineChart) timelineChart.destroy();

    const ctx = document.getElementById('timeline-chart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(99,102,241,0.8)');
    gradient.addColorStop(1, 'rgba(99,102,241,0.2)');

    timelineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: gradient,
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: '#818cf8'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#12121a',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: '#1e293b',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} repo${ctx.parsed.y !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { family: 'JetBrains Mono', size: 10 }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(30,41,59,0.3)' },
            ticks: {
              color: '#64748b',
              font: { family: 'JetBrains Mono', size: 10 },
              stepSize: 1
            }
          }
        },
        animation: {
          duration: Motion.prefersReduced() ? 0 : 800,
          easing: 'easeOutQuart',
          // Stagger each bar so the timeline visibly "draws in" left to right.
          delay: (ctx) => {
            if (Motion.prefersReduced()) return 0;
            return ctx.type === 'data' ? ctx.dataIndex * 70 : 0;
          }
        }
      }
    });
  }

  function renderInsights(stats) {
    const container = document.getElementById('insights-content');
    const items = [];

    if (stats.topLang) {
      items.push(`
        <div class="insight-item">
          <span class="insight-label">Most Used Language</span>
          <span class="insight-value">
            <span class="lang-dot" style="background:${stats.topLang.color};width:8px;height:8px"></span>
            ${escapeHtml(stats.topLang.name)}
          </span>
        </div>
      `);
    }

    items.push(`
      <div class="insight-item">
        <span class="insight-label">Avg Stars / Repo</span>
        <span class="insight-value">${stats.avgStars}</span>
      </div>
    `);

    if (stats.mostStarred) {
      items.push(`
        <div class="insight-item">
          <span class="insight-label">Most Starred Repo</span>
          <span class="insight-value">${escapeHtml(truncate(stats.mostStarred.name, 16))} (${formatNum(stats.mostStarred.stargazers_count)} \u2605)</span>
        </div>
      `);
    }

    items.push(`
      <div class="insight-item">
        <span class="insight-label">Fork Rate</span>
        <span class="insight-value">${stats.forkRate}%</span>
      </div>
    `);

    items.push(`
      <div class="insight-item">
        <span class="insight-label">Language Diversity</span>
        <span class="insight-value">${stats.langDiversity} languages</span>
      </div>
    `);

    container.innerHTML = `<div class="insight-list">${items.join('')}</div>`;
  }

  function renderRecentActivity(stats) {
    const container = document.getElementById('activity-content');

    if (stats.recentActivity.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No recent public activity.</p></div>';
      return;
    }

    // a.detail embeds repo names pulled straight from GitHub events (user-controlled).
    container.innerHTML = `
      <div class="activity-list">
        ${stats.recentActivity.map(a => `
          <div class="activity-item">
            <div class="activity-icon">${escapeHtml(a.icon)}</div>
            <div class="activity-text">
              <div class="activity-desc"><strong>${escapeHtml(a.label)}</strong> ${escapeHtml(truncate(a.detail, 40))}</div>
              <div class="activity-time">${escapeHtml(a.time)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderScore(stats) {
    const container = document.getElementById('score-content');
    const score = stats.score;
    const color = Stats.getScoreColor(score);
    const verdict = Stats.getScoreVerdict(score);

    const circumference = 2 * Math.PI * 56;
    const offset = circumference - (score / 100) * circumference;

    container.innerHTML = `
      <div class="score-wrapper">
        <div class="score-ring-container">
          <svg class="score-ring" viewBox="0 0 128 128">
            <circle class="score-ring-bg" cx="64" cy="64" r="56"/>
            <circle class="score-ring-fill" cx="64" cy="64" r="56"
              stroke="${color}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference}"
              data-target-offset="${offset}"
            />
          </svg>
          <div class="score-number" style="color:${color}">
            <span class="counter" data-target="${score}">0</span>
          </div>
        </div>
        <p class="score-verdict">${verdict}</p>
      </div>
    `;

    // Animate ring (arc fills from 0 -> score). Skip the transition entirely
    // under prefers-reduced-motion and just snap to the final value.
    const ring = container.querySelector('.score-ring-fill');
    if (ring) {
      if (Motion.prefersReduced()) {
        ring.style.strokeDashoffset = offset;
      } else {
        requestAnimationFrame(() => {
          setTimeout(() => {
            ring.style.transition = 'stroke-dashoffset 1.5s ease';
            ring.style.strokeDashoffset = offset;
          }, 300);
        });
      }
    }
  }

  function animateCards() {
    const cards = Array.from(document.querySelectorAll('.animate-card'));
    Motion.staggerReveal(cards, { baseDelay: 100, className: 'visible' });
  }

  function animateCounters() {
    const reduced = Motion.prefersReduced();
    const counters = document.querySelectorAll('.counter');

    if (reduced) {
      counters.forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        if (!isNaN(target)) el.textContent = formatNum(target);
      });
      return;
    }

    setTimeout(() => {
      counters.forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;
        const duration = 1000;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = formatNum(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
      });
    }, 200);
  }

  function cleanup() {
    if (langChart) { langChart.destroy(); langChart = null; }
    if (timelineChart) { timelineChart.destroy(); timelineChart = null; }
    if (heatmapTooltip) { heatmapTooltip.remove(); heatmapTooltip = null; }
    // Reset card animations
    document.querySelectorAll('.animate-card').forEach(c => c.classList.remove('visible'));
  }

  // Helpers
  function getHeatLevel(count) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 7) return 3;
    return 4;
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '\u2026' : str;
  }

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  return { render, cleanup, showSkeleton };
})();
