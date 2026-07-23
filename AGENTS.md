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
- **Formula overlay** (`.formula-hud`): centered horizontally via `translateX(-50%)`, positioned by JS using `bottom: 60px`.

## Tech notes

- KaTeX loaded via CDN (`0.16.11`). Only include the CSS + JS `<link>`/`<script>` tags in `index.html` if the lecture uses formulas.
- All animation state lives in `script.js` globals: `isPlaying`, `progress` (0–1), `playPauseBtn`, `progressSlider`.
- Canvas resizes on `window.resize`; recalculate layout vars inside the handler.
- UI text is in Chinese.

## Animation patterns (existing lectures)

### circle_to_triangle — Morphing (几何形变)
- Multi-phase single morph: concentric circles sequentially flatten from outer to inner into horizontal line segments, forming a triangle silhouette.
- **Progress timeline**: 0→1 continuous morph. Each circle gets its own sub-slot (`startThreshold = idx / CIRCLE_COUNT`).
- **Easing**: `easeInOutQuad` per circle.
- **Formula HUD**: 2 lines, fades in at progress > 0.78.
- **Extra flourishes**: energy core pulse, corner crosshairs, glow layers.
- **Draw order**: background grid → energy core → morphing circles → annotations → triangle outline → formula HUD.

### gauss_sum — Staircase + Mirror (阶梯拼接)
- Phase-based using `getPhaseProgress(progress, start, end)`:
  - `0.00–0.20`: staircase builds column by column (left→right, `easeOutQuad` per column).
  - `0.28–0.60`: mirrored staircase slides in from above (`easeInOutQuad`) to form a rectangle.
  - `0.60–0.72`: rectangle annotation (dashed border, "宽 = n", "高 = n+1").
  - `0.72–1.00`: formula crossfade — line 1 (sum) → line 2 (area) → line 3 (final).
- **Formula HUD**: 3 lines with crossfade opacity. All use `katex.render()` at init + on n-change.
- **Interactive selector**: `#nSelector` buttons (10/20/50/100) recalculate dimensions, re-render formulas, reset progress.
- **Draw order**: background grid → original staircase → mirror staircase → annotations → formula HUD.

### Common patterns
- `drawBackgroundGrid()`: 40px grid, low-opacity cyan strokes.
- Dimensions recalculated on every `updateSize()` via a `calculateDimensions()` or equivalent function.
- `requestAnimationFrame(draw)` loop: clear → update progress → draw layers.
- Play button toggles `isPlaying`; on completion (`progress ≥ 1`) sets `isPlaying = false`.
- Slider input sets `progress` and pauses.
- DOM element refs declared at top of script (before `updateSize()` call to avoid temporal dead zone).
