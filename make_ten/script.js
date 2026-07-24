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
function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
function easeOutBack(x) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
function easeInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function getPhase(p, s, e) { return e <= s ? (p >= s ? 1 : 0) : clamp((p - s) / (e - s), 0, 1); }
function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBezier(p0, p1, p2, p3, t) { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; }

const examples = [
    { a: 8, b: 7, need: 2, left: 5 },
    { a: 9, b: 6, need: 1, left: 5 },
    { a: 7, b: 6, need: 3, left: 3 },
    { a: 8, b: 5, need: 2, left: 3 },
    { a: 9, b: 4, need: 1, left: 3 },
    { a: 8, b: 4, need: 2, left: 2 },
    { a: 7, b: 5, need: 3, left: 2 },
    { a: 6, b: 5, need: 4, left: 1 },
];

function E() { return examples[exIdx]; }

let cx, cy, cellSz, tfX, tfY, dotR;
function calcLayout() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr, h = canvas.height / dpr;
    cx = w / 2;
    cy = h / 2;
    const maxFrameW = w * 0.48, maxFrameH = h * 0.46;
    cellSz = Math.min(maxFrameW / 5.8, maxFrameH / 2.8);
    dotR = cellSz * 0.3;
    tfX = cx - cellSz * 3.2;
    tfY = cy - cellSz * 1.6;
}

function renderFormulas() {
    const { a, b, need, left } = E();
    katex.render(a + ' + ' + b, formulaLine1, { throwOnError: false });
    katex.render('= ' + a + ' + (' + need + ' + ' + left + ')', formulaLine2, { throwOnError: false });
    katex.render('= (' + a + ' + ' + need + ') + ' + left + ' = 10 + ' + left, formulaLine3, { throwOnError: false });
    katex.render('= ' + (a + b), formulaLine4, { throwOnError: false });
}

function updateFormulaHud() {
    const f = getPhase(progress, 0.78, 1);
    formulaLine1.style.opacity = clamp((f - 0) / 0.2, 0, 1);
    formulaLine2.style.opacity = clamp((f - 0.2) / 0.25, 0, 1);
    formulaLine3.style.opacity = clamp((f - 0.45) / 0.25, 0, 1);
    formulaLine4.style.opacity = clamp((f - 0.7) / 0.3, 0, 1);
}

function updateSteps() {
    const p2 = getPhase(progress, 0.12, 0.28);
    const p4 = getPhase(progress, 0.40, 0.65);
    const f = getPhase(progress, 0.78, 1);
    document.getElementById('step1')?.classList.toggle('active', p2 > 0.3);
    document.getElementById('step2')?.classList.toggle('active', p4 > 0.3);
    document.getElementById('step3')?.classList.toggle('active', f > 0);
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

function drawDot(cx2, cy2, r, color, alpha) {
    if (alpha <= 0 || r <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawTenFrame(count, fillP) {
    const alpha = easeOutQuad(clamp(fillP, 0, 1));
    if (alpha <= 0) return;

    // Grid cells
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 5; c++) {
            const x = tfX + c * cellSz, y = tfY + r * cellSz;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(x, y, cellSz, cellSz, 4);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Dots
    const visible = Math.floor(count * easeOutBack(clamp(fillP, 0, 1)));
    for (let i = 0; i < visible; i++) {
        const r = Math.floor(i / 5), c = i % 5;
        const dx = tfX + c * cellSz + cellSz / 2;
        const dy = tfY + r * cellSz + cellSz / 2;
        drawDot(dx, dy, dotR, '#00ffff', alpha);
    }
}

function drawTenFrameGlow(glowP) {
    if (glowP <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(glowP, 0, 1) * 0.25;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = cellSz * 0.8;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    const pad = 6;
    ctx.beginPath();
    ctx.roundRect(tfX - pad, tfY - pad, cellSz * 5 + pad * 2, cellSz * 2 + pad * 2, 8);
    ctx.stroke();
    ctx.restore();
}

function drawTransferDots(count, phase) {
    if (phase <= 0) return;

    for (let i = 0; i < count; i++) {
        const ep = clamp((phase - i * 0.15) / 0.55, 0, 1);
        if (ep <= 0) continue;

        const slotI = E().a + i;
        const tr = Math.floor(slotI / 5), tc = slotI % 5;
        const ex = tfX + tc * cellSz + cellSz / 2;
        const ey = tfY + tr * cellSz + cellSz / 2;
        const sx = ex + cellSz * 2.5;
        const sy = ey - cellSz * 2;

        const c1x = lerp(sx, ex, 0.3), c1y = lerp(sy, ey, 0.3) - cellSz * 1.5;
        const c2x = lerp(sx, ex, 0.7), c2y = lerp(sy, ey, 0.7) - cellSz * 0.5;

        // Trail arc
        const trailAlpha = clamp(1 - (ep - 0.7) / 0.3, 0, 1);
        if (trailAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = trailAlpha * 0.5;
            ctx.strokeStyle = 'rgba(255,204,0,0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
            ctx.stroke();
            ctx.restore();
        }

        const ease = easeOutBack(ep);
        const tx = cubicBezier(sx, c1x, c2x, ex, ease);
        const ty = cubicBezier(sy, c1y, c2y, ey, ease);
        const dr = dotR * (ep > 0.85 ? 1 : easeOutBack(clamp(ep * 1.2, 0, 1)));

        drawDot(tx, ty, dr, '#ffcc00', 1);
    }
}

function drawRemainderDots(count, phase) {
    if (phase <= 0 || !count) return;
    const startX = tfX + cellSz * 6.2;
    const startY = tfY + cellSz * 0.5;

    for (let i = 0; i < count; i++) {
        const ep = easeOutBack(clamp((phase - i * 0.08) / 0.5, 0, 1));
        if (ep <= 0) continue;
        drawDot(startX + i * cellSz, startY, dotR * ep, 'rgba(255,255,255,0.7)', 1);
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

    const { a, b, need, left } = E();
    const p2 = getPhase(progress, 0.12, 0.28);
    const p3 = getPhase(progress, 0.28, 0.40);
    const p4 = getPhase(progress, 0.40, 0.65);
    const p5 = getPhase(progress, 0.65, 0.78);
    const f = getPhase(progress, 0.78, 1.00);

    // Equation
    const eqAlpha = easeOutQuad(getPhase(progress, 0.00, 0.06));
    drawLabel(a + ' + ' + b + ' = ?', cx, tfY - cellSz * 1.5, '#ffffff', 24, eqAlpha);

    // Ten frame + dots
    drawTenFrame(a, p2);

    // Glow when frame fills up
    if (p4 > 0.8) drawTenFrameGlow(clamp((p4 - 0.8) / 0.2, 0, 1));

    // Transfer dots flying in
    drawTransferDots(need, p4);

    // Remainder dots
    drawRemainderDots(left, p5);

    // Split hint
    if (p3 > 0) {
        const sx = tfX + cellSz * 6.2;
        const sy = tfY - cellSz * 1;
        drawLabel(b + ' \u2192 ' + need + ' + ' + left, sx + cellSz * 1.5, sy, '#ffffff', 16, easeOutQuad(p3));
        drawLabel('\u51d1\u5341 ' + need, sx + cellSz * 1.5, sy + 24, '#ffcc00', 13, easeOutQuad(clamp((p3 - 0.3) / 0.7, 0, 1)));
    }

    // Remainder label
    if (p5 > 0.3) {
        const rx = tfX + cellSz * 6.2 + left * cellSz / 2;
        const ry = tfY + cellSz * 0.5 + cellSz;
        drawLabel('\u5269\u4f59 ' + left, rx, ry, 'rgba(255,255,255,0.6)', 13, easeOutQuad(clamp((p5 - 0.3) / 0.5, 0, 1)));
    }

    // Transfer label
    if (p4 > 0.5) {
        const tx = tfX + cellSz * 6.2 + cellSz;
        const ty = tfY + cellSz * 2.5;
        drawLabel('+' + need + ' \u2192 \u51d1\u621010', tx, ty, '#ffcc00', 14, easeOutQuad(clamp((p4 - 0.5) / 0.4, 0, 1)));
    }

    // Final result
    if (f > 0.5) {
        drawLabel('= ' + (a + b), cx, tfY + cellSz * 3.2, '#00ffff', 28, easeOutQuad(clamp((f - 0.5) / 0.5, 0, 1)));
    }

    updateFormulaHud();
    updateSteps();
    requestAnimationFrame(draw);
}

draw();