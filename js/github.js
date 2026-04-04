/* ========================================
   GitPulse — GitHub API
   All API calls, data fetching, rate limit
   ======================================== */

const GitHubAPI = (() => {
  const BASE = 'https://api.github.com';
  let rateLimitRemaining = 60;
  let rateLimitReset = 0;

  function checkRateLimit(headers) {
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    if (remaining !== null) rateLimitRemaining = parseInt(remaining, 10);
    if (reset !== null) rateLimitReset = parseInt(reset, 10);

    if (rateLimitRemaining < 5 && rateLimitRemaining > 0) {
      const mins = Math.ceil((rateLimitReset * 1000 - Date.now()) / 60000);
      Toast.show(`GitHub API rate limit almost reached. Try again in ~${mins} min.`, 'warning');
    }
  }

  async function request(endpoint) {
    const res = await fetch(`${BASE}${endpoint}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    checkRateLimit(res.headers);

    if (res.status === 404) {
      throw new Error('User not found. Check the username and try again.');
    }

    if (res.status === 403) {
      const reset = res.headers.get('X-RateLimit-Reset');
      const mins = reset ? Math.ceil((parseInt(reset, 10) * 1000 - Date.now()) / 60000) : '?';
      throw new Error(`GitHub API rate limit exceeded. Resets in ~${mins} minutes.`);
    }

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status})`);
    }

    return res.json();
  }

  async function fetchUser(username) {
    return request(`/users/${username}`);
  }

  async function fetchRepos(username) {
    const repos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const batch = await request(`/users/${username}/repos?per_page=${perPage}&sort=stars&direction=desc&page=${page}`);
      repos.push(...batch);
      if (batch.length < perPage) break;
      page++;
      if (page > 5) break; // safety cap at 500 repos
    }

    return repos;
  }

  async function fetchEvents(username) {
    try {
      const events = await request(`/users/${username}/events/public?per_page=100`);
      return events;
    } catch {
      return [];
    }
  }

  async function fetchRepoLanguages(owner, repo) {
    try {
      return await request(`/repos/${owner}/${repo}/languages`);
    } catch {
      return {};
    }
  }

  async function fetchAll(username) {
    const [user, repos, events] = await Promise.all([
      fetchUser(username),
      fetchRepos(username),
      fetchEvents(username)
    ]);

    // Fetch detailed languages for top 10 repos by stars
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10);

    const langPromises = topRepos.map(r => fetchRepoLanguages(r.owner.login, r.name));
    const langResults = await Promise.all(langPromises);

    const detailedLanguages = {};
    langResults.forEach(langObj => {
      for (const [lang, bytes] of Object.entries(langObj)) {
        detailedLanguages[lang] = (detailedLanguages[lang] || 0) + bytes;
      }
    });

    return { user, repos, events, detailedLanguages };
  }

  return { fetchAll };
})();
