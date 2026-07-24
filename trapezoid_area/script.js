const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let trapType = 'isosceles';
let topBase = 3, bottomBase = 6, heightLen = 4;
let cx, cy, unit;
let isPlaying = true;
let progress = 0;

const playPauseBtn = document.getElementById('playPauseBtn');
const progressSlider = document.getElementById('progressSlider');
const formulaLine1 = document.getElementById('formulaLine1');
const formulaLine2 = document.getElementById('formulaLine2');
const formulaLine3 = document.getElementById('formulaLine3');

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function easeInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
function lerp(a, b, t) { return a + (b - a) * t; }
function getPhase(p, start, end) {
    if (end <= start) return p >= start ? 1 : 0;
    return clamp((p - start) / (end - start), 0, 1);
}

function getTrapezoidVertices() {
    const aPx = topBase * unit;
    const bPx = bottomBase * unit;
    const hPx = heightLen * unit;
    const centerX = cx;
    const bottomY = cy + hPx * 0.4;
    const topY = bottomY - hPx;
    let blx, tlx, trx, brx;
    switch (trapType) {
        case 'isosceles':
            blx = centerX - bPx / 2; brx = centerX + bPx / 2;
            tlx = centerX - aPx / 2; trx = centerX + aPx / 2;
            break;
        case 'right':
            blx = centerX - bPx * 0.3; brx = blx + bPx;
            tlx = blx; trx = tlx + aPx;
            break;
        case 'general':
            blx = centerX - bPx * 0.4; brx = blx + bPx;
            tlx = centerX - aPx * 0.2; trx = tlx + aPx;
            break;
    }
    // BL, BR, TR, TL
    return [
        { x: blx, y: bottomY },
        { x: brx, y: bottomY },
        { x: trx, y: topY },
        { x: tlx, y: topY }
    ];
}

function calculateDimensions() {
    const dpr = window.devicePixelRatio || 1;
    cx = canvas.width / dpr / 2;
    cy = canvas.height / dpr * 0.5;
    const maxDim = Math.min(canvas.width / dpr, canvas.height / dpr) * 0.45;
    unit = maxDim / Math.max(bottomBase, heightLen);
}

function renderFormulas() {
    const a = topBase, b = bottomBase, h = heightLen;
    katex.render('S_1 = \\frac{1}{2} \\times ' + b + ' \\times ' + h + ' = ' + (b * h / 2), formulaLine1, { throwOnError: false });
    katex.render('S_2 = \\frac{1}{2} \\times ' + a + ' \\times ' + h + ' = ' + (a * h / 2), formulaLine2, { throwOnError: false });
    katex.render('S = S_1 + S_2 = \\frac{(' + a + '+' + b + ') \\times ' + h + '}{2} = ' + ((a + b) * h / 2), formulaLine3, { throwOnError: false });
}

function updateFormulaHudOpacity() {
    const f = getPhase(progress, 0.80, 1.00);
    formulaLine1.style.opacity = clamp((f - 0.0) / 0.30, 0, 1);
    formulaLine2.style.opacity = clamp((f - 0.25) / 0.30, 0, 1);
    formulaLine3.style.opacity = clamp((f - 0.55) / 0.35, 0, 1);
}

function updateSummarySteps() {
    const p1 = getPhase(progress, 0.00, 0.15);
    const p2 = getPhase(progress, 0.15, 0.35);
    const p3 = getPhase(progress, 0.35, 0.50);
    const p4 = getPhase(progress, 0.50, 0.70);
    const f = getPhase(progress, 0.80, 1.00);
    const el = (id) => document.getElementById(id);
    el('step1')?.classList.toggle('active', p1 > 0.5);
    el('step2')?.classList.toggle('active', p2 > 0.3);
    el('step3')?.classList.toggle('active', p3 > 0.3);
    el('step4')?.classList.toggle('active', p4 > 0.3);
}

renderFormulas();

function updateSize() {
    const ca = document.getElementById('canvasArea');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = ca.clientWidth * dpr;
    canvas.height = ca.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    calculateDimensions();
}
window.addEventListener('resize', updateSize);
updateSize();

playPauseBtn.addEventListener('click', () => {
    if (progress >= 1) { progress = 0; progressSlider.value = 0; isPlaying = true; playPauseBtn.textContent = '暂停'; return; }
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '暂停' : '播放';
});

progressSlider.addEventListener('input', (e) => {
    progress = e.target.value / 1000;
    isPlaying = false;
    playPauseBtn.textContent = '播放';
});

document.querySelectorAll('.typeBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.typeBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        trapType = btn.dataset.type;
        calculateDimensions();
        renderFormulas();
        progress = 0; progressSlider.value = 0;
        isPlaying = true; playPauseBtn.textContent = '暂停';
    });
});

function drawBackgroundGrid() {
    const d = window.devicePixelRatio || 1;
    const w = canvas.width / d, h = canvas.height / d;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

/* ---------- drawing helpers ---------- */

function fillPoly(pts, color, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function strokePoly(pts, color, width, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawLabel(text, x, y, color, fontSize, alpha, baseline) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = 'bold ' + fontSize + 'px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = baseline || 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
}

/* ---------- main draw ---------- */

function draw() {
    const d = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / d, canvas.height / d);

    if (isPlaying) {
        progress = Math.min(1, progress + 0.0015);
        progressSlider.value = progress * 1000;
        if (progress >= 1) { isPlaying = false; playPauseBtn.textContent = '播放'; }
    }

    drawBackgroundGrid();

    const pts = getTrapezoidVertices();
    const BL = pts[0], BR = pts[1], TR = pts[2], TL = pts[3];

    const p1 = getPhase(progress, 0.00, 0.15);  // trapezoid fade in
    const p2 = getPhase(progress, 0.15, 0.35);  // edge labels
    const p3 = getPhase(progress, 0.35, 0.50);  // diagonal draws
    const p4 = getPhase(progress, 0.50, 0.65);  // triangle 1 highlight
    const p5 = getPhase(progress, 0.55, 0.70);  // triangle 2 highlight
    const p6 = getPhase(progress, 0.65, 0.80);  // area labels
    const f  = getPhase(progress, 0.80, 1.00);  // formula

    // --- trapezoid fill + outline ---
    fillPoly(pts, 'rgba(0, 255, 255, 0.12)', easeOutQuad(p1));
    strokePoly(pts, 'rgba(0, 255, 255, 0.7)', 2, easeOutQuad(p1));

    // --- edge labels ---
    const topMid = { x: (TL.x + TR.x) / 2, y: TL.y };
    const botMid = { x: (BL.x + BR.x) / 2, y: BL.y };
    const hFoot  = { x: TL.x, y: BL.y };

    if (p2 > 0) {
        const aP = clamp((p2 - 0.0) / 0.4, 0, 1);
        drawLabel('a = ' + topBase, topMid.x, topMid.y - 12, '#ff44aa', 15, aP, 'bottom');
        // highlight top edge
        ctx.save(); ctx.globalAlpha = aP * 0.8;
        ctx.strokeStyle = '#ff44aa'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y); ctx.stroke();
        ctx.restore();

        const bP = clamp((p2 - 0.25) / 0.4, 0, 1);
        drawLabel('b = ' + bottomBase, botMid.x, botMid.y + 14, '#00ffff', 15, bP, 'top');
        ctx.save(); ctx.globalAlpha = bP * 0.8;
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(BL.x, BL.y); ctx.lineTo(BR.x, BR.y); ctx.stroke();
        ctx.restore();

        const hP = clamp((p2 - 0.5) / 0.35, 0, 1);
        ctx.save(); ctx.globalAlpha = hP;
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(TL.x, TL.y); ctx.lineTo(hFoot.x, hFoot.y); ctx.stroke();
        ctx.setLineDash([]);
        drawLabel('h = ' + heightLen, TL.x + 14, (TL.y + hFoot.y) / 2, '#ffffff', 13, hP, 'middle');
        ctx.restore();
    }

    // --- diagonal (animated draw) ---
    if (p3 > 0) {
        const diagLen = Math.hypot(TR.x - BL.x, TR.y - BL.y);
        const diagEndX = BL.x + (TR.x - BL.x) * easeOutQuad(p3);
        const diagEndY = BL.y + (TR.y - BL.y) * easeOutQuad(p3);
        ctx.save();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.moveTo(BL.x, BL.y);
        ctx.lineTo(diagEndX, diagEndY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        if (p3 > 0.6) {
            drawLabel('对角线', (BL.x + TR.x) / 2 - 20, (BL.y + TR.y) / 2 - 12, '#ffcc00', 12, clamp((p3 - 0.6) / 0.4, 0, 1), 'middle');
        }
    }

    // --- triangle 1 highlight (bottom, base=b) ---
    if (p4 > 0) {
        const t1 = [BL, BR, TR];
        fillPoly(t1, 'rgba(255, 80, 80, 0.18)', easeOutQuad(p4) * 0.9);
        strokePoly(t1, 'rgba(255, 80, 80, 0.6)', 1.5, easeOutQuad(p4));

        if (p6 > 0) {
            const cx1 = (BL.x + BR.x + TR.x) / 3;
            const cy1 = (BL.y + BR.y + TR.y) / 3;
            drawLabel('S\u2081', cx1, cy1, '#ff5050', 16, easeOutQuad(p6), 'middle');
        }
    }

    // --- triangle 2 highlight (top, base=a) ---
    if (p5 > 0) {
        const t2 = [BL, TR, TL];
        fillPoly(t2, 'rgba(80, 200, 255, 0.18)', easeOutQuad(p5) * 0.9);
        strokePoly(t2, 'rgba(80, 200, 255, 0.6)', 1.5, easeOutQuad(p5));

        if (p6 > 0) {
            const cx2 = (BL.x + TR.x + TL.x) / 3;
            const cy2 = (BL.y + TR.y + TL.y) / 3;
            drawLabel('S\u2082', cx2, cy2, '#50c8ff', 16, easeOutQuad(p6), 'middle');
        }
    }

    // --- area labels on the right panel (drawn on canvas for positioning) ---
    if (p6 > 0) {
        const labelX = cx + (bottomBase * unit) / 2 + 40;
        const labelY1 = cy + heightLen * unit * 0.15;
        const labelY2 = cy - heightLen * unit * 0.15;

        drawLabel('S\u2081 = \u00bd \u00d7 ' + bottomBase + ' \u00d7 ' + heightLen + ' = ' + (bottomBase * heightLen / 2), labelX, labelY1, '#ff5050', 13, easeOutQuad(p6), 'middle');
        drawLabel('S\u2082 = \u00bd \u00d7 ' + topBase + ' \u00d7 ' + heightLen + ' = ' + (topBase * heightLen / 2), labelX, labelY2, '#50c8ff', 13, easeOutQuad(p6), 'middle');
    }

    updateFormulaHudOpacity();
    updateSummarySteps();
    requestAnimationFrame(draw);
}

draw();
