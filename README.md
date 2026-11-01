# jobs-feed-mfe

JobRadar micro frontend (React, Vite Module Federation, port 3001). Exposes `jobsFeed/JobsFeed`: matched jobs with score breakdown, reasons, matched skills and gaps, filters (status, minimum score, search), infinite loading, Save / Ignore.

The shell passes an authenticated HTTP client as a prop; UI components come from `shell/ui`. `npm run dev` opens a standalone harness with its own login.

```bash
npm ci && npm run build && npm run preview
```
