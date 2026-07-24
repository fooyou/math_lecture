const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let a = 3, b = 4, c = 5;
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

function calculateDimensions() {
    const dpr = window.devicePixelRatio || 1;
    cx = canvas.width / dpr / 2;
    cy = canvas.height / dpr * 0.5;
    const maxDim = Math.min(canvas.width / dpr, canvas.height / dpr) * 0.5;
    unit = maxDim / Math.max(a, b + c);
}

function renderFormulas() {
    const sum = b + c;
    const total = a * sum;
    const left = a * b;
    const right = a * c;
    katex.render(a + ' \\times (' + b + ' + ' + c + ') = ' + total, formulaLine1, { throwOnError: false });
    katex.render(a + ' \\times ' + b + ' + ' + a + ' \\times ' + c + ' = ' + left + ' + ' + right, formulaLine2, { throwOnError: false });
    katex.render('\\therefore ' + a + ' \\times (' + b + ' + ' + c + ') = ' + a + ' \\times ' + b + ' + ' + a + ' \\times ' + c + ' = ' + total, formulaLine3, { throwOnError: false });
}

function updateFormulaHudOpacity() {
    const f = getPhase(progress, 0.75, 1.00);
    const o1 = clamp((f - 0.0) / 0.25, 0, 1);
    const o2 = clamp((f - 0.35) / 0.30, 0, 1);
    const o3 = clamp((f - 0.65) / 0.30, 0, 1);
    formulaLine1.style.opacity = o1;
    formulaLine2.style.opacity = o2;
    formulaLine3.style.opacity = o3;
}

function updateSummarySteps() {
    const p1 = getPhase(progress, 0.00, 0.15);
    const p2 = getPhase(progress, 0.15, 0.35);
    const p3 = getPhase(progress, 0.35, 0.55);
    const f = getPhase(progress, 0.75, 1.00);
    const el = (id) => document.getElementById(id);
    const s1 = el('step1'), s2 = el('step2'), s3 = el('step3'), s4 = el('step4');
    if (s1) s1.classList.toggle('active', p1 > 0.5);
    if (s2) s2.classList.toggle('active', p2 > 0.3);
    if (s3) s3.classList.toggle('active', p3 > 0.3);
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

document.querySelectorAll('.numBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.numBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        a = parseInt(btn.dataset.a);
        b = parseInt(btn.dataset.b);
        c = parseInt(btn.dataset.c);
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

function drawRectangle(p1) {
    const totalW = (b + c) * unit;
    const totalH = a * unit;
    const left = cx - totalW / 2;
    const top = cy - totalH / 2;
    const q = easeOutQuad(p1);

    ctx.save();
    ctx.globalAlpha = q;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.12)';
    ctx.fillRect(left, top, totalW * q, totalH);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, totalW * q, totalH);
    ctx.restore();

    if (q > 0.5) {
        const lp = clamp((q - 0.5) / 0.3, 0, 1);
        ctx.save();
        ctx.globalAlpha = lp;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('a = ' + a, left - 20, top + totalH / 2);
        ctx.textBaseline = 'top';
        ctx.fillText('b+c = ' + (b + c), left + totalW / 2, top + totalH + 10);
        ctx.restore();
    }
}

function drawSplitLine(p2) {
    if (p2 <= 0) return;
    const totalW = (b + c) * unit;
    const totalH = a * unit;
    const left = cx - totalW / 2;
    const top = cy - totalH / 2;
    const splitX = left + b * unit;
    const q = easeInOutQuad(p2);

    ctx.save();
    ctx.globalAlpha = q;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, top);
    ctx.lineTo(splitX, top + totalH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function drawAreaLabels(p3) {
    if (p3 <= 0) return;
    const totalW = (b + c) * unit;
    const totalH = a * unit;
    const left = cx - totalW / 2;
    const top = cy - totalH / 2;
    const splitX = left + b * unit;
    const q = easeOutQuad(p3);

    ctx.save();
    ctx.globalAlpha = q;

    ctx.fillStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.fillRect(left, top, b * unit, totalH);
    ctx.fillStyle = 'rgba(255, 200, 0, 0.25)';
    ctx.fillRect(splitX, top, c * unit, totalH);

    ctx.font = 'bold 18px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.fillText('a×b = ' + (a * b), left + b * unit / 2, top + totalH / 2);
    ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
    ctx.fillText('a×c = ' + (a * c), splitX + c * unit / 2, top + totalH / 2);

    ctx.restore();
}

function drawEquation(p4) {
    if (p4 <= 0) return;
    const totalW = (b + c) * unit;
    const totalH = a * unit;
    const left = cx - totalW / 2;
    const top = cy - totalH / 2;
    const q = easeOutQuad(p4);

    ctx.save();
    ctx.globalAlpha = q;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 20px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(a + '×(' + b + '+' + c + ') = ' + a + '×' + b + ' + ' + a + '×' + c + ' = ' + (a * b + a * c), cx, top + totalH + 30);
    ctx.restore();
}

function draw() {
    const d = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / d, canvas.height / d);

    if (isPlaying) {
        progress = Math.min(1, progress + 0.0018);
        progressSlider.value = progress * 1000;
        if (progress >= 1) {
            isPlaying = false;
            playPauseBtn.textContent = '播放';
        }
    }

    drawBackgroundGrid();

    const p1 = getPhase(progress, 0.00, 0.15);
    const p2 = getPhase(progress, 0.15, 0.35);
    const p3 = getPhase(progress, 0.35, 0.55);
    const p4 = getPhase(progress, 0.55, 0.75);

    drawRectangle(p1);
    drawSplitLine(p2);
    drawAreaLabels(p3);
    drawEquation(p4);

    updateFormulaHudOpacity();
    updateSummarySteps();
    requestAnimationFrame(draw);
}

draw();
