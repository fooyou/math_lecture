const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let n = 10;
let cx, cy, barWidth, barHeightUnit, startX, baseY;
let isPlaying = true;
let progress = 0;

function calculateDimensions() {
    const dpr = window.devicePixelRatio || 1;
    cx = canvas.width / dpr / 2;
    cy = canvas.height / dpr * 0.5;
    const totalWidth = Math.min(canvas.width / dpr * 0.7, 800);
    barWidth = Math.max(4, totalWidth / n);
    const totalHeight = Math.min(canvas.height / dpr * 0.45, 450);
    barHeightUnit = totalHeight / (n + 1);
    startX = cx - (n * barWidth) / 2;
    baseY = cy + totalHeight / 2;
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

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function getPhaseProgress(progress, start, end) {
    if (end <= start) return progress >= start ? 1 : 0;
    return clamp((progress - start) / (end - start), 0, 1);
}

const playPauseBtn = document.getElementById('playPauseBtn');
const progressSlider = document.getElementById('progressSlider');
const formulaLine1 = document.getElementById('formulaLine1');
const formulaLine2 = document.getElementById('formulaLine2');
const formulaLine3 = document.getElementById('formulaLine3');
const formulaResult = document.getElementById('formulaResult');

function renderFormulas() {
    katex.render('S = 1 + 2 + 3 + \\cdots + ' + n, formulaLine1, { throwOnError: false });
    katex.render('\\text{矩形面积} = ' + n + ' \\times ' + (n + 1) + ' = ' + (n * (n + 1)), formulaLine2, { throwOnError: false });
    katex.render('S = \\dfrac{1}{2} \\times ' + n + ' \\times ' + (n + 1) + ' = ' + (n * (n + 1) / 2), formulaLine3, { throwOnError: false });
    if (formulaResult) formulaResult.textContent = n * (n + 1) / 2;
}

function updateFormulaHudOpacity() {
    const buildP = getPhaseProgress(progress, 0, 0.20);
    const rectP = getPhaseProgress(progress, 0.60, 0.72);
    const formulaP = getPhaseProgress(progress, 0.72, 1.00);

    let o1 = 0, o2 = 0, o3 = 0;

    if (buildP >= 1) {
        o1 = clamp(getPhaseProgress(progress, 0.20, 0.35) * 2, 0, 1);
    }
    if (rectP >= 0.5) {
        o2 = clamp(getPhaseProgress(progress, 0.60, 0.72) * 2, 0, 1);
    }
    if (formulaP >= 0.5) {
        o1 = Math.max(0, 1 - (formulaP - 0.5) * 2);
        o2 = Math.max(0, 1 - (formulaP - 0.5) * 2);
        o3 = clamp((formulaP - 0.5) * 2, 0, 1);
    }

    formulaLine1.style.opacity = o1;
    formulaLine2.style.opacity = o2;
    formulaLine3.style.opacity = o3;
}

function updateSummarySteps() {
    const buildP = getPhaseProgress(progress, 0, 0.20);
    const mirrorP = getPhaseProgress(progress, 0.28, 0.60);
    const rectP = getPhaseProgress(progress, 0.60, 0.72);
    const formulaP = getPhaseProgress(progress, 0.72, 1.00);
    const el = (id) => document.getElementById(id);
    const s1 = el('step1'), s2 = el('step2'), s3 = el('step3'), s4 = el('step4');
    if (s1) s1.classList.toggle('active', buildP > 0.5);
    if (s2) s2.classList.toggle('active', mirrorP > 0.2);
    if (s3) s3.classList.toggle('active', rectP > 0.5);
    if (s4) s4.classList.toggle('active', formulaP > 0.3);
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

document.querySelectorAll('.nBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        n = parseInt(btn.dataset.n);
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
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
}

function drawOriginalStaircase(buildP) {
    for (let i = 0; i < n; i++) {
        const colH = (i + 1) * barHeightUnit;
        const x = startX + i * barWidth;
        const gap = Math.max(1, barWidth * 0.08);

        const colStart = i / n;
        const colEnd = (i + 1) / n;
        let p = 0;
        if (buildP > colEnd) p = 1;
        else if (buildP >= colStart) p = easeOutQuad((buildP - colStart) / (1 / n));

        const curTop = lerp(baseY, baseY - colH, p);
        const curH = baseY - curTop;

        if (curH <= 0) continue;

        const rectX = x + gap / 2;
        const rectW = barWidth - gap;

        ctx.fillStyle = `rgba(0, 200, 255, ${0.85 * p})`;
        ctx.fillRect(rectX, curTop, rectW, curH);

        ctx.strokeStyle = `rgba(100, 230, 255, ${0.95 * p})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, curTop, rectW, curH);

        if (p > 0.5 && (n <= 20 || i % Math.ceil(n / 10) === 0 || i === n - 1 || i === 0)) {
            const labelA = clamp((p - 0.5) / 0.3, 0, 1);
            ctx.fillStyle = `rgba(255, 255, 255, ${labelA})`;
            ctx.font = 'bold 14px Consolas, Monaco, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(i + 1, x + barWidth / 2, curTop - 5);
        }
    }
}

function drawMirrorStaircase(mirrorP) {
    if (mirrorP <= 0) return;
    const p = easeInOutQuad(mirrorP);
    const offset = (1 - p) * (n + 1) * barHeightUnit;
    const gap = Math.max(1, barWidth * 0.08);

    for (let i = 0; i < n; i++) {
        const x = startX + i * barWidth;
        const finalBottom = baseY - (i + 1) * barHeightUnit;
        const finalTop = baseY - (n + 1) * barHeightUnit;

        const curTop = finalTop - offset;
        const curBottom = finalBottom - offset;
        const curH = curBottom - curTop;

        const hLim = canvas.height / (window.devicePixelRatio || 1) + 50;
        if (curH <= 0 || curBottom < -50 || curTop > hLim) continue;

        const rectX = x + gap / 2;
        const rectW = barWidth - gap;

        ctx.fillStyle = `rgba(255, 200, 0, ${0.7 * p})`;
        ctx.fillRect(rectX, curTop, rectW, curH);

        ctx.strokeStyle = `rgba(255, 220, 80, ${0.95 * p})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, curTop, rectW, curH);
    }

    if (p > 0.3) {
        const labelP = clamp((p - 0.3) / 0.4, 0, 1);
        ctx.fillStyle = `rgba(255, 200, 0, ${labelP * 0.9})`;
        ctx.font = 'bold 14px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('翻转拼接', cx, baseY - (n + 1) * barHeightUnit - offset - 28);
    }
}

function drawAnnotations(progress) {
    const totalH = (n + 1) * barHeightUnit;
    const rectP = getPhaseProgress(progress, 0.60, 0.72);

    if (rectP > 0) {
        const rp = easeInOutQuad(rectP);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * rp})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(startX, baseY - totalH, n * barWidth, totalH);
        ctx.setLineDash([]);

        if (rp > 0.2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${clamp((rp - 0.2) / 0.3, 0, 1)})`;
            ctx.font = 'bold 16px Consolas, Monaco, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`宽 = ${n}`, cx, baseY + 10);
        }

        if (rp > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${clamp((rp - 0.5) / 0.3, 0, 1)})`;
            ctx.font = 'bold 16px Consolas, Monaco, monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`高 = ${n + 1}`, startX + n * barWidth + 14, baseY - totalH / 2);
        }
    }

    const titleP = Math.min(1, progress * 4);
    if (titleP > 0) {
        ctx.fillStyle = `rgba(0, 255, 255, ${titleP})`;
        ctx.font = 'bold 22px Consolas, Monaco, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`高斯求和  S = 1 + 2 + 3 + ... + ${n}`, 20, 50);
    }
}

function draw() {
    const d = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / d, canvas.height / d);

    if (isPlaying) {
        progress = Math.min(1, progress + 0.002);
        progressSlider.value = progress * 1000;
        if (progress >= 1) {
            isPlaying = false;
            playPauseBtn.textContent = '播放';
        }
    }

    drawBackgroundGrid();

    const buildP = getPhaseProgress(progress, 0, 0.20);
    drawOriginalStaircase(buildP);

    const mirrorP = getPhaseProgress(progress, 0.28, 0.60);
    drawMirrorStaircase(mirrorP);

    drawAnnotations(progress);
    updateFormulaHudOpacity();
    updateSummarySteps();

    requestAnimationFrame(draw);
}

draw();
