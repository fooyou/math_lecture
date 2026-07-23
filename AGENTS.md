# AGENTS.md

## Repo layout

Static HTML/CSS/JS project. No build system, no tests, no linter. Each top-level directory is an independent animated math lecture:

```
<topic>/
├── index.html
├── style.css
├── script.js
└── docs/          # design docs, not loaded at runtime
```

Run by opening `index.html` directly in a browser. No server needed.

## UI conventions (shared across all lectures)

- **Theme**: dark background `#010204`, cyan accent `#00ffff`, gold formula text `#ffcc00`.
- **Controls** (`#playPauseBtn` + `#progressSlider`): always positioned top-right (`top: 16px; right: 16px`), transparent background, no panel/border.
- **Slider**: flat 3px track, 10×10 square thumb, width 180px.
- **Title** (`#title`): top-left, cyan with glow.
- **Canvas**: fullscreen, `position: absolute`, `z-index: 1`.
- **Formula overlay** (`.formula-hud`): centered horizontally via `translateX(-50%)`, positioned by JS.

## Tech notes

- KaTeX loaded via CDN (`0.16.11`). Only include the CSS + JS `<link>`/`<script>` tags in `index.html` if the lecture uses formulas.
- All animation state lives in `script.js` globals: `isPlaying`, `progress` (0–1), `playPauseBtn`, `progressSlider`.
- Canvas resizes on `window.resize`; recalculate layout vars inside the handler.
- UI text is in Chinese.
