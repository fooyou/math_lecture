const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let n1 = 1, d1 = 3, n2 = 1, d2 = 6;
let cx, cy, radius;
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

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
    return (a * b) / gcd(a, b);
}

function calculateDimensions() {
    const dpr = window.devicePixelRatio || 1;
    cx = canvas.width / dpr / 2;
    cy = canvas.height / dpr * 0.5;
    const maxDim = Math.min(canvas.width / dpr, canvas.height / dpr);
    radius = maxDim * 0.2;
}

function renderFormulas() {
    const commonD = lcm(d1, d2);
    const newN1 = n1 * (commonD / d1);
    const newN2 = n2 * (commonD / d2);
    const sumN = newN1 + newN2;
    const g = gcd(sumN, commonD);
    const finalN = sumN / g;
    const finalD = commonD / g;

    katex.render('\\frac{' + n1 + '}{' + d1 + '} + \\frac{' + n2 + '}{' + d2 + '} = \\frac{' + newN1 + '}{' + commonD + '} + \\frac{' + newN2 + '}{' + commonD + '}', formulaLine1, { throwOnError: false });
    katex.render('= \\frac{' + sumN + '}{' + commonD + '}', formulaLine2, { throwOnError: false });
    if (finalD === 1) {
        katex.render('= ' + finalN, formulaLine3, { throwOnError: false });
    } else {
        katex.render('= \\frac{' + finalN + '}{' + finalD + '}', formulaLine3, { throwOnError: false });
    }
}

function updateFormulaHudOpacity() {
    const f = getPhase(progress, 0.90, 1.00);
    const o1 = clamp((f - 0.0) / 0.25, 0, 1);
    const o2 = clamp((f - 0.35) / 0.30, 0, 1);
    const o3 = clamp((f - 0.65) / 0.30, 0, 1);
    formulaLine1.style.opacity = o1;
    formulaLine2.style.opacity = o2;
    formulaLine3.style.opacity = o3;
}

function updateSummarySteps() {
    const p1 = getPhase(progress, 0.00, 0.15);
    const p3 = getPhase(progress, 0.30, 0.55);
    const p4 = getPhase(progress, 0.55, 0.75);
    const p5 = getPhase(progress, 0.75, 0.90);
    const el = (id) => document.getElementById(id);
    const s1 = el('step1'), s2 = el('step2'), s3 = el('step3'), s4 = el('step4');
    if (s1) s1.classList.toggle('active', p1 > 0.5);
    if (s2) s2.classList.toggle('active', p3 > 0.3);
    if (s3) s3.classList.toggle('active', p4 > 0.3);
    if (s4) s4.classList.toggle('active', p5 > 0.3);
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

document.querySelectorAll('.fracBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.fracBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        n1 = parseInt(btn.dataset.n1);
        d1 = parseInt(btn.dataset.d1);
        n2 = parseInt(btn.dataset.n2);
        d2 = parseInt(btn.dataset.d2);
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

function drawSector(cx, cy, r, startAngle, endAngle, fillColor, strokeColor, alpha) {
    if (alpha <= 0 || endAngle <= startAngle) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function drawCircleOutline(cx, cy, r, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawFractionLabel(cx, cy, r, num, den, alpha, color) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = 'bold 20px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num + '/' + den, cx, cy + r + 25);
    ctx.restore();
}

function drawFirstSector(p1) {
    if (p1 <= 0) return;
    const q = easeOutQuad(p1);
    const leftCx = cx - radius * 1.5;
    const angle = (n1 / d1) * Math.PI * 2 * q;

    drawCircleOutline(leftCx, cy, radius, q);
    drawSector(leftCx, cy, radius, -Math.PI / 2, -Math.PI / 2 + angle, 'rgba(0, 255, 255, 0.3)', 'rgba(0, 255, 255, 0.7)', q);
    drawFractionLabel(leftCx, cy, radius, n1, d1, q, '#00ffff');
}

function drawSecondSector(p2) {
    if (p2 <= 0) return;
    const q = easeOutQuad(p2);
    const rightCx = cx + radius * 1.5;
    const angle = (n2 / d2) * Math.PI * 2 * q;

    drawCircleOutline(rightCx, cy, radius, q);
    drawSector(rightCx, cy, radius, -Math.PI / 2, -Math.PI / 2 + angle, 'rgba(255, 200, 0, 0.3)', 'rgba(255, 200, 0, 0.7)', q);
    drawFractionLabel(rightCx, cy, radius, n2, d2, q, '#ffcc00');
}

function drawCommonDenominator(p3) {
    if (p3 <= 0) return;
    const commonD = lcm(d1, d2);
    const newN1 = n1 * (commonD / d1);
    const newN2 = n2 * (commonD / d2);
    const q = easeInOutQuad(p3);

    const leftCx = cx - radius * 1.5;
    const rightCx = cx + radius * 1.5;

    ctx.save();
    ctx.globalAlpha = q;
    drawCircleOutline(leftCx, cy, radius, 1);
    drawCircleOutline(rightCx, cy, radius, 1);

    const step1 = Math.floor(q * d1);
    const frac1 = q * d1 - step1;
    for (let i = 0; i <= step1 && i < d1; i++) {
        const startA = -Math.PI / 2 + (i / d1) * Math.PI * 2;
        const endA = -Math.PI / 2 + ((i + 1) / d1) * Math.PI * 2;
        const fillEnd = i < step1 ? endA : startA + frac1 * (Math.PI * 2 / d1);
        const isHighlighted = i < newN1;
        const color = isHighlighted ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)';
        drawSector(leftCx, cy, radius, startA, fillEnd, color, 'rgba(0, 255, 255, 0.5)', 1);
    }

    const step2 = Math.floor(q * d2);
    const frac2 = q * d2 - step2;
    for (let i = 0; i <= step2 && i < d2; i++) {
        const startA = -Math.PI / 2 + (i / d2) * Math.PI * 2;
        const endA = -Math.PI / 2 + ((i + 1) / d2) * Math.PI * 2;
        const fillEnd = i < step2 ? endA : startA + frac2 * (Math.PI * 2 / d2);
        const isHighlighted = i < newN2;
        const color = isHighlighted ? 'rgba(255, 200, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)';
        drawSector(rightCx, cy, radius, startA, fillEnd, color, 'rgba(255, 200, 0, 0.5)', 1);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('通分: ' + n1 + '/' + d1 + ' = ' + newN1 + '/' + commonD, leftCx, cy - radius - 10);
    ctx.fillText('通分: ' + n2 + '/' + d2 + ' = ' + newN2 + '/' + commonD, rightCx, cy - radius - 10);
    ctx.restore();
}

function drawMergedResult(p4) {
    if (p4 <= 0) return;
    const commonD = lcm(d1, d2);
    const newN1 = n1 * (commonD / d1);
    const newN2 = n2 * (commonD / d2);
    const sumN = newN1 + newN2;
    const q = easeOutQuad(p4);

    const centerCx = cx;
    const angle1 = (newN1 / commonD) * Math.PI * 2;
    const angle2 = (newN2 / commonD) * Math.PI * 2;

    drawCircleOutline(centerCx, cy, radius, q);
    drawSector(centerCx, cy, radius, -Math.PI / 2, -Math.PI / 2 + angle1 * q, 'rgba(0, 255, 255, 0.3)', 'rgba(0, 255, 255, 0.7)', q);
    drawSector(centerCx, cy, radius, -Math.PI / 2 + angle1 * q, -Math.PI / 2 + (angle1 + angle2) * q, 'rgba(255, 200, 0, 0.3)', 'rgba(255, 200, 0, 0.7)', q);

    ctx.save();
    ctx.globalAlpha = q;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(sumN + '/' + commonD, centerCx, cy + radius + 25);
    ctx.restore();
}

function drawSimplification(p5) {
    if (p5 <= 0) return;
    const commonD = lcm(d1, d2);
    const sumN = n1 * (commonD / d1) + n2 * (commonD / d2);
    const g = gcd(sumN, commonD);
    const finalN = sumN / g;
    const finalD = commonD / g;
    const q = easeOutQuad(p5);

    const centerCx = cx;

    ctx.save();
    ctx.globalAlpha = q;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 24px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (finalD === 1) {
        ctx.fillText('= ' + finalN, centerCx, cy + radius + 40);
    } else {
        ctx.fillText('= ' + finalN + '/' + finalD, centerCx, cy + radius + 40);
    }
    ctx.restore();
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
    const p3 = getPhase(progress, 0.30, 0.55);
    const p4 = getPhase(progress, 0.55, 0.75);
    const p5 = getPhase(progress, 0.75, 0.90);

    const showFirst = p4 <= 0;
    const showSecond = p4 <= 0;

    if (showFirst) drawFirstSector(p1);
    if (showSecond) drawSecondSector(p2);

    drawCommonDenominator(p3);
    drawMergedResult(p4);
    drawSimplification(p5);

    updateFormulaHudOpacity();
    updateSummarySteps();
    requestAnimationFrame(draw);
}

draw();
