# GitPulse — Your GitHub Profile, Visualized

Enter any GitHub username, get a visual developer profile card with language breakdown, activity heatmap, repo stats, and a shareable profile card.

![GitPulse Screenshot](assets/screenshot.png)

## Features

- **Profile Overview** — Avatar, bio, quick stats (repos, stars, forks, followers)
- **Language Breakdown** — Doughnut chart with GitHub's actual language colors
- **Top Repositories** — Your most starred repos with descriptions and stats
- **Activity Heatmap** — GitHub-style 90-day contribution grid from public events
- **Repo Timeline** — Bar chart showing repos created per year
- **Developer Insights** — Most used language, average stars, fork rate
- **Recent Activity** — Latest public events with icons and timestamps
- **Profile Score** — 0-100 developer score based on repos, stars, activity, and more
- **Export Card** — Download a shareable 1200x630 PNG profile card for social media

## How to Use

1. Open `index.html` in your browser (or visit the live demo)
2. Enter any GitHub username
3. Click **Analyze** or press `Ctrl+Enter`
4. Explore the visual profile breakdown
5. Click **Export Card** to download a shareable PNG

## Tech Stack

- **Vanilla HTML, CSS, JavaScript** — No frameworks
- **[Chart.js](https://www.chartjs.org/)** — Doughnut and bar charts
- **[html2canvas](https://html2canvas.hertzen.com/)** — Screenshot/export feature
- **[GitHub REST API](https://docs.github.com/en/rest)** — Public data, no auth needed

## Rate Limits

The GitHub API allows **60 requests/hour** without authentication. Each profile analysis uses ~12-15 requests (user + repos + events + language details for top repos). You can analyze roughly 4-5 profiles per hour.

## Live Demo

[https://0xmortuex.github.io/GitPulse/](https://0xmortuex.github.io/GitPulse/)

## License

MIT
