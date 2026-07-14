/* ========================================
   GitPulse — Sample Usernames
   ======================================== */

const SAMPLE_USERNAMES = [
  'torvalds',
  'sindresorhus',
  'tj',
  'antirez',
  '0xmortuex'
];

const LANGUAGE_COLORS = {
  'JavaScript': '#f1e05a',
  'Python': '#3572A5',
  'TypeScript': '#3178c6',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'Ruby': '#701516',
  'PHP': '#4F5D95',
  'Swift': '#F05138',
  'Kotlin': '#A97BFF',
  'Dart': '#00B4AB',
  'Shell': '#89e051',
  'Lua': '#000080',
  'R': '#198CE7',
  'Scala': '#c22d40',
  'Perl': '#0298c3',
  'Haskell': '#5e5086',
  'Elixir': '#6e4a7e',
  'Clojure': '#db5855',
  'Vue': '#41b883',
  'Svelte': '#ff3e00',
  'SCSS': '#c6538c',
  'Dockerfile': '#384d54',
  'Makefile': '#427819',
  'Jupyter Notebook': '#DA5B0B',
  'C': '#555555',
  'Objective-C': '#438eff',
  'Vim Script': '#199f4b',
  'PowerShell': '#012456',
  'TeX': '#3D6117',
  'Emacs Lisp': '#c065db',
  'CoffeeScript': '#244776',
  'OCaml': '#3be133',
  'Zig': '#ec915c',
  'Nix': '#7e7eff',
  'V': '#4f87c4'
};

function getLanguageColor(lang) {
  return LANGUAGE_COLORS[lang] || '#8b949e';
}

/**
 * Escape a value for safe interpolation into innerHTML.
 * GitHub profile/repo fields (bio, description, location, blog, company,
 * repo names, event payload text, etc.) are arbitrary user-controlled
 * strings and must never be inserted into innerHTML unescaped.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate/normalize a user-supplied URL (e.g. profile "blog" field) so it
 * can only ever be http(s). Returns null if the value isn't a safe link,
 * so callers can skip rendering it as a clickable href instead of risking
 * a javascript: or data: URI.
 */
function safeHttpUrl(raw) {
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.href;
  } catch {
    return null;
  }
}
