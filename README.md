# GBG Colorado 2029 Dashboard — Vite Setup

## What's in this folder

This is a complete Vite + React project configured to build your dashboard and deploy to GitHub Pages.

**Files included:**
- `package.json` — Dependencies and build scripts
- `vite.config.js` — Build configuration (outputs to `docs/` folder)
- `.gitignore` — Ignores `node_modules/` and `docs/`
- `public/index.html` — HTML template
- `src/main.jsx` — React entry point
- `src/App.jsx` — **Your full dashboard (all the charts, tables, player popups)**
- `src/index.css` — Base styles

## Setup Steps (run these in Terminal)

### 1. Replace your repo files
Copy all files from this folder into your local repo folder (`~/documents/gbg-2029-summer26-dashboard/`):
- Copy everything EXCEPT `node_modules/` (doesn't exist yet) and `docs/` (will be generated)

### 2. Install dependencies
```bash
cd ~/documents/gbg-2029-summer26-dashboard
npm install
```

This creates a `node_modules/` folder (ignore in git — already in `.gitignore`).

### 3. Test locally (optional)
```bash
npm run dev
```

Opens a local dev server at `http://localhost:5173`. You can edit `src/App.jsx` and see changes instantly. Press Ctrl+C to stop.

### 4. Build for GitHub Pages
```bash
npm run build
```

This creates a `docs/` folder with the compiled HTML/CSS/JS. This is what GitHub Pages will serve.

### 5. Commit and push
```bash
git add -A
git commit -m "Convert to Vite build pipeline — full dashboard with charts"
git push origin main
```

### 6. Enable GitHub Pages (one-time setup)
1. Go to GitHub: https://github.com/douglasadamwatkins-ux/gbg-2029-summer26-dashboard/settings/pages
2. Under "Source", set:
   - Branch: `main`
   - Folder: `/docs`
3. Click Save

GitHub will build and deploy automatically. Your site goes live at:
**https://douglasadamwatkins-ux.github.io/gbg-2029-summer26-dashboard/**

---

## From here on out

**Every time you update the dashboard:**

1. Edit `src/App.jsx` locally
2. Run `npm run build` (generates new `docs/` folder)
3. `git add -A && git commit -m "Update dashboard" && git push`
4. Refresh GitHub Pages URL — done!

---

## Troubleshooting

**"command not found: npm"**
→ Node.js isn't installed or not in PATH. Reinstall from https://nodejs.org/

**"docs folder is empty or missing"**
→ Run `npm run build` again. It should create `docs/` with HTML/JS.

**Page is blank after deploy**
→ Check GitHub Pages settings (step 6 above). Make sure it's serving from `/docs` on `main` branch.

**Want to test the build locally?**
→ Run `npm run preview` (serves the `docs/` folder, not dev server)

