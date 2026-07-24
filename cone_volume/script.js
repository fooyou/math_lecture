const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let cx, cy, coneW, coneH, cylW, cylH;
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

const ELLIPSE_RATIO = 0.35;

function calculateDimensions() {
    const dpr = window.devicePixelRatio || 1;
    cx = canvas.width / dpr / 2;
    cy = canvas.height / dpr * 0.5;
    const maxDim = Math.min(canvas.width / dpr, canvas.height / dpr);
    coneW = maxDim * 0.25;
    coneH = maxDim * 0.4;
    cylW = maxDim * 0.2;
    cylH = coneH;
}

function renderFormulas() {
    katex.render('V_{\\text{圆柱}} = S \\times h', formulaLine1, { throwOnError: false });
    katex.render('V_{\\text{圆锥}} = \\frac{1}{3} \\times S \\times h', formulaLine2, { throwOnError: false });
    katex.render('\\therefore V_{\\text{圆锥}} = \\frac{1}{3} V_{\\text{圆柱}}', formulaLine3, { throwOnError: false });
}

function updateFormulaHudOpacity() {
    const f = getPhase(progress, 0.80, 1.00);
    formulaLine1.style.opacity = clamp((f - 0.0) / 0.25, 0, 1);
    formulaLine2.style.opacity = clamp((f - 0.35) / 0.30, 0, 1);
    formulaLine3.style.opacity = clamp((f - 0.65) / 0.30, 0, 1);
}

function updateSummarySteps() {
    const p1 = getPhase(progress, 0.00, 0.20);
    const p2 = getPhase(progress, 0.20, 0.40);
    const p3 = getPhase(progress, 0.40, 0.60);
    const p4 = getPhase(progress, 0.60, 0.80);
    const el = (id) => document.getElementById(id);
    el('step1')?.classList.toggle('active', p1 > 0.3);
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
    if (progress >= 1) {
        progress = 0;
        progressSlider.value = 0;
        isPlaying = true;
        playPauseBtn.textContent = '暂停';
        return;
    }
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '暂停' : '播放';
});

progressSlider.addEventListener('input', (e) => {
    progress = e.target.value / 1000;
    isPlaying = false;
    playPauseBtn.textContent = '播放';
});

function drawBackgroundGrid() {
    const d = window.devicePixelRatio || 1;
    const w = canvas.width / d, h = canvas.height / d;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

/* ---------- pseudo-3D shapes ---------- */

function fillWaterEllipse(cx, cy, rx, ry, color, strokeCol) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function fillHalfEllipse(cx, cy, rx, ry, front, color, strokeCol) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = front ? 2 : 1.5;
    if (!front) ctx.setLineDash([4, 4]);
    ctx.stroke();
    if (!front) ctx.setLineDash([]);
}

function drawCylinder(cx, cy, w, h, waterLevel, alpha) {
    if (alpha <= 0) return;
    const top = cy - h / 2;
    const bottom = cy + h / 2;
    const rx = w / 2;
    const ry = rx * ELLIPSE_RATIO;
    const hasWater = waterLevel > 0;
    const isFull = waterLevel >= 0.99;

    const wireColor = 'rgba(255, 255, 255, 0.7)';
    const waterFill = 'rgba(0, 110, 255, 0.8)';
    const waterEdge = 'rgba(0, 190, 255, 0.7)';

    ctx.save();
    ctx.globalAlpha = alpha;

    // water body
    if (hasWater) {
        const waterTop = bottom - waterLevel * h;
        ctx.fillStyle = waterFill;
        ctx.fillRect(cx - rx, waterTop, rx * 2, bottom - waterTop);
    }

    // side walls
    ctx.strokeStyle = wireColor;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - rx, top); ctx.lineTo(cx - rx, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rx, top); ctx.lineTo(cx + rx, bottom); ctx.stroke();

    // top ellipse
    ctx.beginPath();
    ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = isFull ? waterFill : 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = isFull ? waterEdge : wireColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // bottom ellipse back half (dashed)
    fillHalfEllipse(cx, bottom, rx, ry, false, hasWater ? waterFill : 'transparent', hasWater ? waterEdge : wireColor);
    // bottom ellipse front half (solid)
    fillHalfEllipse(cx, bottom, rx, ry, true, hasWater ? waterFill : 'transparent', hasWater ? waterEdge : wireColor);

    // water surface ellipse (when not full)
    if (hasWater && !isFull) {
        fillWaterEllipse(cx, bottom - waterLevel * h, rx, ry, waterFill, waterEdge);
    }

    ctx.restore();
}

function drawCone(cx, cy, w, h, waterLevel, alpha) {
    if (alpha <= 0) return;
    const apexY = cy - h / 2;
    const bottom = cy + h / 2;
    const rx = w / 2;
    const ry = rx * ELLIPSE_RATIO;
    const hasWater = waterLevel > 0;

    const wireColor = 'rgba(0, 255, 255, 0.7)';
    const waterFill = 'rgba(0, 110, 255, 0.8)';
    const waterEdge = 'rgba(0, 190, 255, 0.7)';

    ctx.save();
    ctx.globalAlpha = alpha;

    // water body (clipped to cone triangle)
    if (hasWater) {
        const waterTop = bottom - waterLevel * h;
        const frac = (waterTop - apexY) / (bottom - apexY);
        const wRx = rx * frac;
        const wRy = wRx * ELLIPSE_RATIO;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - rx, bottom);
        ctx.lineTo(cx, apexY);
        ctx.lineTo(cx + rx, bottom);
        ctx.closePath();
        ctx.clip();

        ctx.fillStyle = waterFill;
        ctx.fillRect(cx - rx, waterTop, rx * 2, bottom - waterTop);
        fillWaterEllipse(cx, waterTop, wRx, wRy, waterFill, waterEdge);

        ctx.restore();
    }

    // side walls
    ctx.strokeStyle = wireColor;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - rx, bottom); ctx.lineTo(cx, apexY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rx, bottom); ctx.lineTo(cx, apexY); ctx.stroke();

    // bottom ellipse back half (dashed)
    fillHalfEllipse(cx, bottom, rx, ry, false, hasWater ? waterFill : 'transparent', hasWater ? waterEdge : wireColor);
    // bottom ellipse front half (solid)
    fillHalfEllipse(cx, bottom, rx, ry, true, hasWater ? waterFill : 'transparent', hasWater ? waterEdge : wireColor);

    // apex dot
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(cx, apexY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawLabels(alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const coneCx = cx - coneW * 1.2;
    const cylCx = cx + coneW * 1.2;
    const top = cy - coneH / 2;
    const ry = (coneW / 2) * ELLIPSE_RATIO;
    ctx.fillText('圆锥', coneCx, top - ry - 8);
    ctx.fillText('圆柱', cylCx, top - ry - 8);
    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.font = '14px Consolas, Monaco, monospace';
    ctx.fillText('等底等高', cx, top - ry - 8);
    ctx.restore();
}

function drawWaterFlow(fromCx, fromCy, toCx, toCy, flowProgress, alpha) {
    if (alpha <= 0 || flowProgress <= 0) return;
    const q = easeInOutQuad(flowProgress);
    const startX = fromCx, startY = fromCy - coneH * 0.2;
    const endX = toCx, endY = toCy - cylH * 0.3;
    const cpX = (startX + endX) / 2;
    const cpY = Math.min(startY, endY) - coneH * 0.4;
    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cpX, cpY, lerp(startX, endX, q), lerp(startY, endY, q));
    ctx.stroke();
    const dropX = lerp(startX, endX, q), dropY = lerp(startY, endY, q);
    ctx.fillStyle = 'rgba(0, 150, 255, 0.9)';
    ctx.beginPath(); ctx.arc(dropX, dropY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawPourCount(count, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 18px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('第' + count + '次倒入', cx, cy + coneH / 2 + 20);
    ctx.restore();
}

/* ---------- main loop ---------- */

function draw() {
    const d = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / d, canvas.height / d);

    if (isPlaying) {
        progress = Math.min(1, progress + 0.0012);
        progressSlider.value = progress * 1000;
        if (progress >= 1) { isPlaying = false; playPauseBtn.textContent = '播放'; }
    }

    drawBackgroundGrid();

    const p1 = getPhase(progress, 0.00, 0.20);
    const p2 = getPhase(progress, 0.20, 0.40);
    const p3 = getPhase(progress, 0.40, 0.60);
    const p4 = getPhase(progress, 0.60, 0.80);

    const coneCx = cx - coneW * 1.2;
    const cylCx = cx + coneW * 1.2;

    let coneWater = 1, cylWater = 0;
    if (p2 > 0) { coneWater = 1 - easeOutQuad(p2); cylWater = easeOutQuad(p2) / 3; }
    if (p3 > 0) { coneWater = 1 - easeOutQuad(p3); cylWater = 1 / 3 + easeOutQuad(p3) / 3; }
    if (p4 > 0) { coneWater = 1 - easeOutQuad(p4); cylWater = 2 / 3 + easeOutQuad(p4) / 3; }

    const fadeIn = clamp(p1 * 3, 0, 1);
    drawCone(coneCx, cy, coneW, coneH, coneWater, fadeIn);
    drawCylinder(cylCx, cy, cylW, cylH, cylWater, fadeIn);
    drawLabels(fadeIn);

    if (p2 > 0 && p2 < 1) drawWaterFlow(coneCx, cy, cylCx, cy, p2, 1);
    if (p3 > 0 && p3 < 1) drawWaterFlow(coneCx, cy, cylCx, cy, p3, 1);
    if (p4 > 0 && p4 < 1) drawWaterFlow(coneCx, cy, cylCx, cy, p4, 1);

    if (p2 > 0 && p2 < 1) drawPourCount(1, 1);
    else if (p3 > 0 && p3 < 1) drawPourCount(2, 1);
    else if (p4 > 0 && p4 < 1) drawPourCount(3, 1);

    updateFormulaHudOpacity();
    updateSummarySteps();
    requestAnimationFrame(draw);
}

draw();
