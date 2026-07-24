const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let triType = 'right';
let baseLen = 6, heightLen = 4;
let cx, cy, unit;
let isPlaying = true;
let progress = 0;

const playPauseBtn = document.getElementById('playPauseBtn');
const progressSlider = document.getElementById('progressSlider');
const formulaLine1 = document.getElementById('formulaLine1');
const formulaLine2 = document.getElementById('formulaLine2');
const formulaLine3 = document.getElementById('formulaLine3');

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getPhase(p, start, end) {
    if (end <= start) return p >= start ? 1 : 0;
    return clamp((p - start) / (end - start), 0, 1);
}

function getTriVertices() {
    const bPx = baseLen * unit;
    const hPx = heightLen * unit;
    const left = cx - bPx * 0.5;
    const bottom = cy + hPx * 0.4;
    const top = bottom - hPx;

    switch (triType) {
        case 'right':
            return [
                { x: left, y: bottom },
                { x: left + bPx, y: bottom },
                { x: left, y: top }
            ];
        case 'acute':
            return [
                { x: left, y: bottom },
                { x: left + bPx, y: bottom },
                { x: left + bPx * 0.5, y: top }
            ];
        case 'obtuse':
            return [
                { x: left, y: bottom },
                { x: left + bPx, y: bottom },
                { x: left - bPx * 0.2, y: top }
            ];
    }
}

function rotatePoint180(p, center) {
    return {
        x: 2 * center.x - p.x,
        y: 2 * center.y - p.y
    };
}

function calculateDimensions() {
    const dpr = window.devicePixelRatio || 1;
    cx = canvas.width / dpr / 2;
    cy = canvas.height / dpr * 0.5;
    const maxDim = Math.min(canvas.width / dpr, canvas.height / dpr) * 0.45;
    unit = maxDim / Math.max(baseLen, heightLen);
}

function renderFormulas() {
    const b = baseLen, h = heightLen;
    katex.render('S_{\\text{平行四边形}} = ' + b + ' \\times ' + h + ' = ' + (b * h), formulaLine1, { throwOnError: false });
    katex.render('S_{\\text{三角形}} = \\frac{1}{2} \\times ' + (b * h), formulaLine2, { throwOnError: false });
    katex.render('S = \\frac{1}{2} \\times ' + b + ' \\times ' + h + ' = ' + (b * h / 2), formulaLine3, { throwOnError: false });
}

function updateFormulaHudOpacity() {
    const f = getPhase(progress, 0.80, 1.00);
    const o1 = clamp((f - 0.0) / 0.25, 0, 1);
    const o2 = clamp((f - 0.35) / 0.30, 0, 1);
    const o3 = clamp((f - 0.65) / 0.30, 0, 1);
    formulaLine1.style.opacity = o1;
    formulaLine2.style.opacity = o2;
    formulaLine3.style.opacity = o3;
}

function updateSummarySteps() {
    const p1 = getPhase(progress, 0.00, 0.15);
    const p3 = getPhase(progress, 0.30, 0.65);
    const p4 = getPhase(progress, 0.65, 0.80);
    const f = getPhase(progress, 0.80, 1.00);
    const el = (id) => document.getElementById(id);
    const s1 = el('step1'), s2 = el('step2'), s3 = el('step3'), s4 = el('step4');
    if (s1) s1.classList.toggle('active', p1 > 0.5);
    if (s2) s2.classList.toggle('active', p3 > 0.3);
    if (s3) s3.classList.toggle('active', p4 > 0.3);
    if (s4) s4.classList.toggle('active', f > 0);
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

document.querySelectorAll('.typeBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.typeBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        triType = btn.dataset.type;
        calculateDimensions();
        renderFormulas();
        progress = 0;
        progressSlider.value = 0;
        isPlaying = true;
        playPauseBtn.textContent = '暂停';
    });
});

function drawBackgroundGrid() {
    const d = window.devicePixelRatio || 1;
    const w = canvas.width / d, h = canvas.height / d;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
}

function drawTriangle(pts, fillColor, strokeColor, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function drawBaseAndHeight(p1) {
    const pts = getTriVertices();
    const baseMid = { x: (pts[0].x + pts[1].x) / 2, y: pts[0].y };
    const heightFoot = { x: pts[2].x, y: pts[0].y };
    const heightTop = pts[2];

    const baseP = clamp((p1 - 0.3) / 0.4, 0, 1);
    if (baseP > 0) {
        ctx.save();
        ctx.globalAlpha = baseP;
        ctx.strokeStyle = '#ff44aa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();

        ctx.fillStyle = '#ff44aa';
        ctx.font = 'bold 16px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('b = ' + baseLen, baseMid.x, baseMid.y + 10);
        ctx.restore();
    }

    const hP = clamp((p1 - 0.5) / 0.4, 0, 1);
    if (hP > 0) {
        ctx.save();
        ctx.globalAlpha = hP;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(heightTop.x, heightTop.y);
        ctx.lineTo(heightFoot.x, heightFoot.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Consolas, Monaco, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('h = ' + heightLen, heightTop.x + 10, (heightTop.y + heightFoot.y) / 2);
        ctx.restore();
    }
}

function drawVertexLabels(alpha) {
    if (alpha <= 0) return;
    const pts = getTriVertices();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('A', pts[0].x - 14, pts[0].y + 18);
    ctx.fillText('B', pts[1].x + 14, pts[1].y + 18);
    ctx.fillText('C', pts[2].x, pts[2].y - 10);
    ctx.restore();
}

function drawRotatedCopy(p3) {
    if (p3 <= 0) return;
    const pts = getTriVertices();
    const baseMid = { x: (pts[0].x + pts[1].x) / 2, y: pts[0].y };

    const rotatedPts = pts.map(p => rotatePoint180(p, baseMid));

    const alpha = easeInOutQuad(p3);
    drawTriangle(rotatedPts, 'rgba(255, 200, 0, 0.18)', 'rgba(255, 200, 0, 0.6)', alpha);

    if (alpha > 0.5) {
        ctx.save();
        ctx.globalAlpha = (alpha - 0.5) * 2;
        ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
        ctx.font = '12px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('旋转180°拼合', cx, baseMid.y + 24);
        ctx.restore();
    }
}

function drawParallelogram(p4) {
    if (p4 <= 0) return;
    const pts = getTriVertices();
    const baseMid = { x: (pts[0].x + pts[1].x) / 2, y: pts[0].y };
    const rotatedPts = pts.map(p => rotatePoint180(p, baseMid));

    const allPts = [pts[0], pts[1], rotatedPts[1], rotatedPts[2]];
    const q = easeInOutQuad(p4);

    ctx.save();
    ctx.globalAlpha = q * 0.3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(allPts[0].x, allPts[0].y);
    for (let i = 1; i < allPts.length; i++) {
        ctx.lineTo(allPts[i].x, allPts[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (q > 0.3) {
        const lp = clamp((q - 0.3) / 0.4, 0, 1);
        ctx.save();
        ctx.globalAlpha = lp;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 14px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('平行四边形面积 = ' + baseLen + ' × ' + heightLen + ' = ' + (baseLen * heightLen), cx, baseMid.y + 44);
        ctx.restore();
    }

    if (q > 0.6) {
        const lp = clamp((q - 0.6) / 0.3, 0, 1);
        ctx.save();
        ctx.globalAlpha = lp;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.font = 'bold 14px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('三角形是平行四边形的一半', cx, baseMid.y + 66);
        ctx.restore();
    }
}

function draw() {
    const d = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / d, canvas.height / d);

    if (isPlaying) {
        progress = Math.min(1, progress + 0.0015);
        progressSlider.value = progress * 1000;
        if (progress >= 1) {
            isPlaying = false;
            playPauseBtn.textContent = '播放';
        }
    }

    drawBackgroundGrid();

    const p1 = getPhase(progress, 0.00, 0.15);
    const p2 = getPhase(progress, 0.15, 0.30);
    const p3 = getPhase(progress, 0.30, 0.65);
    const p4 = getPhase(progress, 0.65, 0.80);

    const pts = getTriVertices();
    const triAlpha = clamp(1 - getPhase(progress, 0.30, 0.45) * 2, 0.3, 1);
    drawTriangle(pts, 'rgba(0, 255, 255, 0.18)', 'rgba(0, 255, 255, 0.7)', triAlpha);

    drawVertexLabels(clamp(p1 * 3, 0, 1));
    drawBaseAndHeight(p2);

    drawRotatedCopy(p3);
    drawParallelogram(p4);

    updateFormulaHudOpacity();
    updateSummarySteps();
    requestAnimationFrame(draw);
}

draw();
