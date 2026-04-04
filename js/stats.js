/* ========================================
   GitPulse — Stats Calculator
   Derived stats from raw API data
   ======================================== */

const Stats = (() => {

  function calculate(data) {
    const { user, repos, events, detailedLanguages } = data;

    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
    const accountAge = getAccountAge(user.created_at);
    const memberSince = new Date(user.created_at).getFullYear();

    // Language breakdown from detailed fetch
    const languages = processLanguages(detailedLanguages, repos);

    // Top repos by stars
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6);

    // Repos per year
    const repoTimeline = getRepoTimeline(repos);

    // Heatmap from events
    const heatmapData = getHeatmapData(events);

    // Recent activity
    const recentActivity = getRecentActivity(events);

    // Most starred repo
    const mostStarred = repos.length > 0 ? repos[0] : null;

    // Average stars
    const avgStars = repos.length > 0 ? (totalStars / repos.length).toFixed(1) : 0;

    // Fork rate
    const forkedRepos = repos.filter(r => r.forks_count > 0).length;
    const forkRate = repos.length > 0 ? ((forkedRepos / repos.length) * 100).toFixed(0) : 0;

    // Most used language
    const topLang = languages.length > 0 ? languages[0] : null;

    // Language diversity
    const langDiversity = languages.length;

    // Profile score
    const score = calculateScore(user, repos, totalStars, langDiversity, events, accountAge);

    return {
      user,
      repos,
      totalStars,
      totalForks,
      accountAge,
      memberSince,
      languages,
      topRepos,
      repoTimeline,
      heatmapData,
      recentActivity,
      mostStarred,
      avgStars,
      forkRate,
      topLang,
      langDiversity,
      score
    };
  }

  function getAccountAge(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const years = now.getFullYear() - created.getFullYear();
    const months = now.getMonth() - created.getMonth();
    if (years === 0) return months <= 1 ? '< 1 month' : `${months} months`;
    return years === 1 ? '1 year' : `${years} years`;
  }

  function processLanguages(detailedLanguages, repos) {
    let langMap = {};

    if (Object.keys(detailedLanguages).length > 0) {
      langMap = { ...detailedLanguages };
    } else {
      // Fallback: use primary language from each repo
      repos.forEach(r => {
        if (r.language) {
          langMap[r.language] = (langMap[r.language] || 0) + (r.size || 1);
        }
      });
    }

    const total = Object.values(langMap).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: ((bytes / total) * 100).toFixed(1),
        color: getLanguageColor(name)
      }));
  }

  function getRepoTimeline(repos) {
    const years = {};
    repos.forEach(r => {
      const year = new Date(r.created_at).getFullYear();
      years[year] = (years[year] || 0) + 1;
    });

    const sortedYears = Object.keys(years).sort();
    if (sortedYears.length === 0) return { labels: [], data: [] };

    // Fill gaps
    const start = parseInt(sortedYears[0]);
    const end = parseInt(sortedYears[sortedYears.length - 1]);
    const labels = [];
    const data = [];
    for (let y = start; y <= end; y++) {
      labels.push(y.toString());
      data.push(years[y] || 0);
    }

    return { labels, data };
  }

  function getHeatmapData(events) {
    const now = new Date();
    const days = {};

    // Initialize 91 days
    for (let i = 90; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = 0;
    }

    events.forEach(e => {
      const date = e.created_at.split('T')[0];
      if (days.hasOwnProperty(date)) {
        days[date]++;
      }
    });

    return days;
  }

  function getRecentActivity(events) {
    const eventMap = {
      PushEvent: { icon: '\u2191', label: 'Pushed to' },
      CreateEvent: { icon: '+', label: 'Created' },
      WatchEvent: { icon: '\u2605', label: 'Starred' },
      ForkEvent: { icon: '\u2442', label: 'Forked' },
      PullRequestEvent: { icon: '\u21AE', label: 'PR on' },
      IssuesEvent: { icon: '!', label: 'Issue on' },
      IssueCommentEvent: { icon: '\u{1F4AC}', label: 'Commented on' },
      DeleteEvent: { icon: '-', label: 'Deleted from' },
      ReleaseEvent: { icon: '\u{1F3F7}', label: 'Released' }
    };

    return events.slice(0, 5).map(e => {
      const mapped = eventMap[e.type] || { icon: '\u25CF', label: e.type.replace('Event', '') };
      const repo = e.repo ? e.repo.name : '';
      let detail = '';

      if (e.type === 'PushEvent') {
        const count = e.payload?.commits?.length || 0;
        detail = `${count} commit${count !== 1 ? 's' : ''} to ${repo}`;
      } else if (e.type === 'CreateEvent') {
        detail = `${e.payload?.ref_type || 'repo'} ${e.payload?.ref ? e.payload.ref + ' in ' : ''}${repo}`;
      } else if (e.type === 'WatchEvent') {
        detail = repo;
      } else if (e.type === 'ForkEvent') {
        detail = repo;
      } else if (e.type === 'PullRequestEvent') {
        detail = `${e.payload?.action || ''} in ${repo}`;
      } else {
        detail = repo;
      }

      return {
        icon: mapped.icon,
        label: mapped.label,
        detail,
        time: timeAgo(e.created_at)
      };
    });
  }

  function timeAgo(dateStr) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  function calculateScore(user, repos, totalStars, langDiversity, events, accountAge) {
    let score = 0;

    // Repos (up to 15)
    score += Math.min(repos.length / 4, 15);

    // Stars (up to 20)
    score += Math.min(totalStars / 25, 20);

    // Account age (up to 10)
    const years = parseInt(accountAge) || 0;
    score += Math.min(years * 2, 10);

    // Bio (5 points)
    if (user.bio) score += 5;

    // Popular repos (up to 15)
    const popularCount = repos.filter(r => r.stargazers_count >= 10).length;
    score += Math.min(popularCount * 3, 15);

    // Language diversity (up to 10)
    score += Math.min(langDiversity * 1.5, 10);

    // Recent activity (up to 15)
    score += Math.min(events.length / 7, 15);

    // Followers (up to 10)
    score += Math.min(user.followers / 10, 10);

    return Math.min(Math.round(score), 100);
  }

  function getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#6366f1';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  function getScoreVerdict(score) {
    if (score >= 80) return 'Active open source contributor';
    if (score >= 60) return 'Established developer';
    if (score >= 40) return 'Growing developer';
    if (score >= 20) return 'Getting started';
    return 'New to open source';
  }

  return { calculate, getScoreColor, getScoreVerdict };
})();
