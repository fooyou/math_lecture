const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let exIdx = 0;
let isPlaying = true;
let progress = 0;

const playPauseBtn = document.getElementById('playPauseBtn');
const progressSlider = document.getElementById('progressSlider');
const formulaLine1 = document.getElementById('formulaLine1');
const formulaLine2 = document.getElementById('formulaLine2');
const formulaLine3 = document.getElementById('formulaLine3');
const formulaLine4 = document.getElementById('formulaLine4');

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function easeInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
function easeOutBack(x) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
function getPhase(p, s, e) { return e <= s ? (p >= s ? 1 : 0) : clamp((p - s) / (e - s), 0, 1); }
function lerp(a, b, t) { return a + (b - a) * t; }

const examples = [
    { a: 103, b: 84, k: 4, result: 19 },
    { a: 91, b: 37, k: 7, result: 54 },
    { a: 81, b: 53, k: 3, result: 28 },
    { a: 62, b: 48, k: 8, result: 14 },
];

function E() { return examples[exIdx]; }

let cx, cy, lineY, xLo, xHi, valLo, valHi, vScale;
function calcLayout() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr, h = canvas.height / dpr;
    cx = w / 2;
    cy = h / 2;
    const { a, b, k } = E();
    const a1 = a - k, b1 = b - k;
    valLo = Math.min(b1, b) - 5;
    valHi = Math.max(a, a1) + 5;
    const span = valHi - valLo;
    const availW = Math.min(w * 0.82, 720);
    xLo = cx - availW / 2;
    xHi = cx + availW / 2;
    vScale = availW / span;
    lineY = cy + 10;
}
function vToX(v) { return xLo + (v - valLo) * vScale; }

function renderFormulas() {
    const { a, b, k, result } = E();
    const a1 = a - k, b1 = b - k;
    katex.render(a + ' - ' + b, formulaLine1, { throwOnError: false });
    katex.render('= (' + a + ' - ' + k + ') - (' + b + ' - ' + k + ')', formulaLine2, { throwOnError: false });
    katex.render('= ' + a1 + ' - ' + b1, formulaLine3, { throwOnError: false });
    katex.render('= ' + result, formulaLine4, { throwOnError: false });
    const r = document.getElementById('formulaResult');
    if (r) r.textContent = result;
}

function updateFormulaHud() {
    const f = getPhase(progress, 0.80, 1.00);
    formulaLine1.style.opacity = clamp((f - 0) / 0.2, 0, 1);
    formulaLine2.style.opacity = clamp((f - 0.2) / 0.25, 0, 1);
    formulaLine3.style.opacity = clamp((f - 0.45) / 0.25, 0, 1);
    formulaLine4.style.opacity = clamp((f - 0.7) / 0.3, 0, 1);
}

function updateSteps() {
    const { k, result } = E();
    const pC = getPhase(progress, 0.22, 0.30);
    const pS = getPhase(progress, 0.30, 0.50);
    const pN = getPhase(progress, 0.50, 0.62);
    const f = getPhase(progress, 0.80, 1.00);
    document.getElementById('step1')?.classList.toggle('active', pC > 0.3);
    document.getElementById('step2')?.classList.toggle('active', pS > 0.3);
    document.getElementById('step3')?.classList.toggle('active', pN > 0.4);
    document.getElementById('step4')?.classList.toggle('active', f > 0.1);
}

renderFormulas();

function updateSize() {
    const ca = document.getElementById('canvasArea');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = ca.clientWidth * dpr;
    canvas.height = ca.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    calcLayout();
}
window.addEventListener('resize', updateSize);
updateSize();

playPauseBtn.addEventListener('click', () => {
    if (progress >= 1) { progress = 0; progressSlider.value = 0; isPlaying = true; playPauseBtn.textContent = '暂停'; return; }
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '暂停' : '播放';
});

progressSlider.addEventListener('input', e => {
    progress = e.target.value / 1000;
    isPlaying = false;
    playPauseBtn.textContent = '播放';
});

document.querySelectorAll('.exBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.exBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        exIdx = parseInt(btn.dataset.i);
        calcLayout();
        renderFormulas();
        progress = 0;
        progressSlider.value = 0;
        isPlaying = true;
        playPauseBtn.textContent = '暂停';
    });
});

/* ========== Pure Canvas2D drawing ========== */

function drawBackgroundGrid() {
    const d = window.devicePixelRatio || 1;
    const w = canvas.width / d, h = canvas.height / d;
    ctx.strokeStyle = 'rgba(0,255,255,0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

function drawLabel(text, x, y, color, size, alpha, align, baseline) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = 'bold ' + size + 'px Consolas, Monaco, monospace';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = baseline || 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawNumberLine(alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xLo, lineY);
    ctx.lineTo(xHi, lineY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xHi, lineY);
    ctx.lineTo(xHi - 10, lineY - 5);
    ctx.moveTo(xHi, lineY);
    ctx.lineTo(xHi - 10, lineY + 5);
    ctx.stroke();

    const lo = Math.ceil(valLo / 5) * 5;
    for (let v = lo; v <= valHi; v += 5) {
        const x = vToX(v);
        const major = v % 10 === 0;
        ctx.strokeStyle = 'rgba(255,255,255,' + (major ? 0.55 : 0.3) + ')';
        ctx.lineWidth = major ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x, lineY + (major ? 12 : 7));
        ctx.stroke();
        if (major) {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '12px Consolas, Monaco, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(v, x, lineY + 16);
        }
    }
    ctx.restore();
}

function drawMarkerShape(x, color, alpha, ghost) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x - 10, lineY - 14);
    ctx.lineTo(x + 10, lineY - 14);
    ctx.closePath();
    if (ghost) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}

function drawValueLabel(x, text, color, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = 'bold 24px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, x, lineY - 20);
    ctx.restore();
}

function drawChip(x, y, k, color, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10,14,22,0.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    const w = 34, hgt = 22;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - hgt / 2, w, hgt, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2212' + k, x, y + 1);
    ctx.restore();
}

function drawRemovedSeg(x1, x2, k, alpha) {
    if (alpha <= 0 || x2 <= x1) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255,90,90,0.9)';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(255,80,80,0.7)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x1, lineY);
    ctx.lineTo(x2, lineY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,130,130,1)';
    ctx.font = 'bold 14px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('\u2212' + k, (x1 + x2) / 2, lineY + 22);
    ctx.restore();
}

function drawGapBracket(x1, x2, label, alpha, color, dashed, glow) {
    if (alpha <= 0 || x2 <= x1) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
    if (dashed) ctx.setLineDash([6, 5]);
    const yb = lineY + 34;
    ctx.beginPath();
    ctx.moveTo(x1, lineY + 4);
    ctx.lineTo(x1, yb + 5);
    ctx.moveTo(x2, lineY + 4);
    ctx.lineTo(x2, yb + 5);
    ctx.moveTo(x1, yb + 5);
    ctx.lineTo(x2, yb + 5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = 'bold 20px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, (x1 + x2) / 2, yb + 12);
    ctx.restore();
}

function drawTopTexts() {
    const { a, b, k, result } = E();
    const a1 = a - k, b1 = b - k;
    const pTitle = getPhase(progress, 0.00, 0.08);
    const pC = getPhase(progress, 0.22, 0.30);
    const pS = getPhase(progress, 0.30, 0.50);
    const pR = getPhase(progress, 0.62, 0.80);

    const s = easeInOutQuad(pS);
    const oldAlpha = easeOutQuad(pTitle) * (1 - s);
    const newAlpha = easeOutQuad(pTitle) * s;
    const resAlpha = clamp((pR - 0.25) / 0.5, 0, 1) * s;
    const ey = cy - 118;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.font = 'bold 30px Consolas, Monaco, monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    if (oldAlpha > 0) {
        ctx.globalAlpha = oldAlpha;
        ctx.fillStyle = '#00ffff';
        ctx.fillText(a, cx - 105, ey);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('\u2212', cx - 42, ey);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(b, cx + 22, ey);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('= ?', cx + 128, ey);
    }
    if (newAlpha > 0) {
        ctx.globalAlpha = newAlpha;
        ctx.fillStyle = '#00ffff';
        ctx.fillText(a1, cx - 105, ey);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('\u2212', cx - 42, ey);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(b1, cx + 22, ey);
    }
    if (resAlpha > 0) {
        ctx.globalAlpha = resAlpha;
        ctx.fillStyle = '#00ffff';
        ctx.fillText('= ' + result, cx + 128, ey);
    }
    ctx.restore();

    const hy = cy - 66;
    const hintA = easeOutQuad(getPhase(progress, 0.20, 0.28)) * (1 - s);
    if (hintA > 0) {
        drawLabel('\u540c\u65f6\u51cf ' + k + ' \u2192 \u5dee\u4e0d\u53d8', cx, hy, 'rgba(255,255,255,0.85)', 16, hintA);
    }
    if (pR > 0.3 && s >= 1) {
        const badgeA = clamp((pR - 0.3) / 0.5, 0, 1);
        drawLabel('\u2713 \u5dee\u4e0d\u53d8', cx, lineY + 90, '#ffcc00', 18, badgeA);
    }
}

/* ========== Main loop ========== */

function draw() {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    if (isPlaying) {
        progress = Math.min(1, progress + 0.0015);
        progressSlider.value = progress * 1000;
        if (progress >= 1) { isPlaying = false; playPauseBtn.textContent = '播放'; }
    }

    drawBackgroundGrid();

    const { a, b, k, result } = E();
    const a1 = a - k, b1 = b - k;

    const pLine = getPhase(progress, 0.08, 0.20);
    const pBracket = getPhase(progress, 0.14, 0.22);
    const pC = getPhase(progress, 0.22, 0.30);
    const pS = getPhase(progress, 0.30, 0.50);
    const pN = getPhase(progress, 0.50, 0.62);
    const pR = getPhase(progress, 0.62, 0.80);

    drawNumberLine(easeOutQuad(pLine));

    const xB0 = vToX(b), xA0 = vToX(a);
    const xB1 = vToX(b1), xA1 = vToX(a1);
    const s = easeInOutQuad(pS);
    const xB = lerp(xB0, xB1, s);
    const xA = lerp(xA0, xA1, s);

    const segA = clamp((pC - 0.1) / 0.6, 0, 1) * (1 - easeOutQuad(pN));
    drawRemovedSeg(xB1, xB0, k, segA);
    drawRemovedSeg(xA1, xA0, k, segA);

    const chipA = clamp((pC - 0.15) / 0.5, 0, 1) * (1 - s);
    drawChip(xA0, lineY - 48, k, '#00ffff', chipA);
    drawChip(xB0, lineY - 48, k, '#ffcc00', chipA);

    const ghostA = pC * lerp(0.9, 0.5, s);
    drawMarkerShape(xA0, '#00ffff', ghostA, true);
    drawMarkerShape(xB0, '#ffcc00', ghostA, true);
    drawValueLabel(xA0, a, '#00ffff', ghostA * 0.8);
    drawValueLabel(xB0, b, '#ffcc00', ghostA * 0.8);

    drawMarkerShape(xA, '#00ffff', 1, false);
    drawMarkerShape(xB, '#ffcc00', 1, false);
    drawValueLabel(xA, a, '#00ffff', 1 - s);
    drawValueLabel(xA, a1, '#00ffff', s);
    drawValueLabel(xB, b, '#ffcc00', 1 - s);
    drawValueLabel(xB, b1, '#ffcc00', s);

    const bracketA = easeOutQuad(pBracket);
    const brkDone = pR > 0;
    drawGapBracket(xB, xA, brkDone ? String(result) : '?', bracketA, brkDone ? '#ffcc00' : 'rgba(255,255,255,0.85)', false, brkDone);

    if (pC > 0) {
        const gA = pC * lerp(0.6, 0.38, s);
        drawGapBracket(xB0, xA0, String(result), gA, 'rgba(255,255,255,0.55)', true, false);
    }

    drawTopTexts();
    updateFormulaHud();
    updateSteps();
    requestAnimationFrame(draw);
}

draw();
