const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let a = 3, b = 4, c = 5;
let isPlaying = true;
let progress = 0;

let cx, cy, unit;
let bigSize, bigBLx, bigBLy;

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
}

function lerpPt(p1, p2, t) {
    return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
}

function getPhase(p, start, end) {
    if (end <= start) return p >= start ? 1 : 0;
    return clamp((p - start) / (end - start), 0, 1);
}

function rigidInterpTri(tri1, tri2, t) {
    const n = 3;
    let cx1 = 0, cy1 = 0, cx2 = 0, cy2 = 0;
    for (let i = 0; i < n; i++) {
        cx1 += tri1[i].x; cy1 += tri1[i].y;
        cx2 += tri2[i].x; cy2 += tri2[i].y;
    }
    cx1 /= n; cy1 /= n; cx2 /= n; cy2 /= n;

    const p1 = tri1.map(p => ({ x: p.x - cx1, y: p.y - cy1 }));
    const p2 = tri2.map(p => ({ x: p.x - cx2, y: p.y - cy2 }));

    let Sxx = 0, Sxy = 0, Syx = 0, Syy = 0;
    for (let i = 0; i < n; i++) {
        Sxx += p1[i].x * p2[i].x;
        Sxy += p1[i].x * p2[i].y;
        Syx += p1[i].y * p2[i].x;
        Syy += p1[i].y * p2[i].y;
    }

    const theta = Math.atan2(Sxy - Syx, Sxx + Syy);
    const ang = theta * t;
    const ct = Math.cos(ang);
    const st = Math.sin(ang);

    const cx = cx1 + (cx2 - cx1) * t;
    const cy = cy1 + (cy2 - cy1) * t;

    return p1.map(p => ({
        x: cx + p.x * ct - p.y * st,
        y: cy + p.x * st + p.y * ct
    }));
}

function getSingleTriVerts() {
    const aPx = a * unit, bPx = b * unit;
    const ra = { x: cx - aPx * 0.6, y: cy + bPx * 0.3 };
    const shortEnd = { x: ra.x, y: ra.y - aPx };
    const longEnd = { x: ra.x + bPx, y: ra.y };
    return [ra, shortEnd, longEnd];
}

const playPauseBtn = document.getElementById('playPauseBtn');
const progressSlider = document.getElementById('progressSlider');
const formulaLine1 = document.getElementById('formulaLine1');
const formulaLine2 = document.getElementById('formulaLine2');
const formulaLine3 = document.getElementById('formulaLine3');

function renderFormulas() {
    katex.render('\\text{\u7B2C\u4E00\u79CD\u6392\u5217: } S_{\\text{\u7A7A\u767D}} = c^{2}', formulaLine1, { throwOnError: false });
    katex.render('\\text{\u7B2C\u4E8C\u79CD\u6392\u5217: } S_{\\text{\u7A7A\u767D}} = a^{2} + b^{2}', formulaLine2, { throwOnError: false });
    katex.render('\\therefore c^{2} = a^{2} + b^{2} \\quad (\\text{\u52FE\u80A1\u5B9A\u7406})', formulaLine3, { throwOnError: false });
}

function calculateDimensions() {
    const dpr = window.devicePixelRatio || 1;
    cx = canvas.width / dpr / 2;
    cy = canvas.height / dpr * 0.5;
    const maxDim = Math.min(canvas.width / dpr, canvas.height / dpr) * 0.55;
    unit = maxDim / (a + b);
    bigSize = (a + b) * unit;
    bigBLx = cx - bigSize / 2;
    bigBLy = cy + bigSize / 2;
}

function toC(px, py) {
    return { x: bigBLx + px * unit, y: bigBLy - py * unit };
}

function triArr1(idx) {
    const s = a + b;
    switch (idx) {
        case 0: return [toC(0, 0), toC(0, a), toC(b, 0)];
        case 1: return [toC(s, 0), toC(b, 0), toC(s, b)];
        case 2: return [toC(s, s), toC(s, b), toC(a, s)];
        case 3: return [toC(0, s), toC(a, s), toC(0, a)];
    }
}

function triArr2(idx) {
    const s = a + b;
    switch (idx) {
        case 0: return [toC(0, a), toC(a, a), toC(0, s)];
        case 1: return [toC(a, s), toC(0, s), toC(a, a)];
        case 2: return [toC(a, 0), toC(a, a), toC(s, 0)];
        case 3: return [toC(s, a), toC(s, 0), toC(a, a)];
    }
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
        playPauseBtn.textContent = '\u6682\u505C';
        return;
    }
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '\u6682\u505C' : '\u64AD\u653E';
});

progressSlider.addEventListener('input', (e) => {
    progress = e.target.value / 1000;
    isPlaying = false;
    playPauseBtn.textContent = '\u64AD\u653E';
});

document.querySelectorAll('.tripleBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tripleBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        a = parseInt(btn.dataset.a);
        b = parseInt(btn.dataset.b);
        c = Math.round(Math.sqrt(a * a + b * b));
        calculateDimensions();
        renderFormulas();
        progress = 0;
        progressSlider.value = 0;
        isPlaying = true;
        playPauseBtn.textContent = '\u6682\u505C';
    });
});

function drawGrid() {
    const d = window.devicePixelRatio || 1;
    const w = canvas.width / d, h = canvas.height / d;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const gs = 40;
    for (let x = 0; x < w; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
}

function updateFormulaHudOpacity() {
    const f = getPhase(progress, 0.85, 1.00);
    const o1 = clamp((f - 0.0) / 0.25, 0, 1);
    const o2 = clamp((f - 0.35) / 0.30, 0, 1);
    const o3 = clamp((f - 0.65) / 0.30, 0, 1);
    formulaLine1.style.opacity = o1;
    formulaLine2.style.opacity = o2;
    formulaLine3.style.opacity = o3;
}

function updateSummarySteps() {
    const p3 = getPhase(progress, 0.40, 0.70);
    const p4 = getPhase(progress, 0.70, 0.90);
    const f = getPhase(progress, 0.85, 1.00);
    const mT = easeInOutQuad(clamp((p4 - 0.0) / 0.5, 0, 1));
    const el = (id) => document.getElementById(id);
    const s1 = el('step1'), s2 = el('step2'), s3 = el('step3'), s4 = el('step4');
    if (s1) s1.classList.toggle('active', p3 > 0.1);
    if (s2) s2.classList.toggle('active', p3 > 0.1 && mT < 0.5);
    if (s3) s3.classList.toggle('active', mT > 0.5);
    if (s4) s4.classList.toggle('active', f > 0);
}

function draw() {
    const d = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / d, canvas.height / d);

    if (isPlaying) {
        progress = Math.min(1, progress + 0.0015);
        progressSlider.value = progress * 1000;
        if (progress >= 1) {
            isPlaying = false;
            playPauseBtn.textContent = '\u64AD\u653E';
        }
    }

    drawGrid();

    const p1 = getPhase(progress, 0.00, 0.20);
    const p2 = getPhase(progress, 0.20, 0.40);
    const p3 = getPhase(progress, 0.40, 0.70);
    const p4 = getPhase(progress, 0.70, 0.90);

    const singleAlpha = clamp(1 - p3 * 2.5, 0, 1);
    if (singleAlpha > 0) {
        drawTriAndSq(p1, p2, singleAlpha);
    }

    if (p3 > 0) {
        const puzzleAlpha = clamp(p3 * 2.5, 0, 1);
        const p4t = easeInOutQuad(clamp(p4, 0, 1));

        let tris;
        if (p4 <= 0) {
            const a1 = [triArr1(0), triArr1(1), triArr1(2), triArr1(3)];
            const singleTri = getSingleTriVerts();
            tris = a1.map((target, i) => {
                const tStart = i / 4, tEnd = (i + 1) / 4;
                const localT = easeOutQuad(clamp((p3 - tStart) / (tEnd - tStart), 0, 1));
                return rigidInterpTri(singleTri, target, localT);
            });
        } else {
            const a1 = [triArr1(0), triArr1(1), triArr1(2), triArr1(3)];
            const a2 = [triArr2(2), triArr2(3), triArr2(1), triArr2(0)];
            tris = [
                [0,1,2].map(i => lerpPt(a1[0][i], a2[0][i], p4t)),
                [0,1,2].map(i => lerpPt(a1[1][i], a2[1][i], p4t)),
                [0,1,2].map(i => lerpPt(a1[2][i], a2[2][i], p4t)),
                [0,1,2].map(i => lerpPt(a1[3][i], a2[3][i], p4t)),
            ];
        }

        drawConstructedSq(p3);
        drawPuzTris(tris, puzzleAlpha);
        drawHighlight(p3, p4t, tris, puzzleAlpha);
        drawLabels(p3, p4t, puzzleAlpha);
    }

    updateFormulaHudOpacity();
    updateSummarySteps();
    requestAnimationFrame(draw);
}

draw();

function drawTriAndSq(p1, p2, alpha) {
    const p = easeOutQuad(clamp(p1, 0, 1));
    const aPx = a * unit, bPx = b * unit;
    const C = { x: cx - aPx * 0.6, y: cy + bPx * 0.3 };
    const A = { x: C.x + bPx, y: C.y };
    const B = { x: C.x, y: C.y - aPx };

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(0, 255, 255, 0.12)';
    ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.closePath();
    ctx.stroke();

    if (p > 0.4) {
        const lp = clamp((p - 0.4) / 0.3, 0, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + lp + ')';
        ctx.font = 'bold 16px Consolas, Monaco, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('C', C.x - 14, C.y + 18);
        ctx.fillText('A', A.x + 14, A.y + 18);
        ctx.fillText('B', B.x - 14, B.y - 10);

        ctx.font = '14px Consolas, Monaco, monospace'; ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255, 100, 100, ' + lp + ')';
        ctx.fillText('c', (A.x + B.x) / 2 + 10, (A.y + B.y) / 2 - 6);
        ctx.fillStyle = 'rgba(255, 68, 170, ' + lp + ')';
        ctx.fillText('a', B.x + 10, B.y + (C.y - B.y) / 2);
        ctx.fillStyle = 'rgba(0, 255, 255, ' + lp + ')';
        ctx.fillText('b', C.x + (A.x - C.x) / 2 - 10, C.y + 8);
    }

    const gP = clamp((easeOutQuad(clamp(p2, 0, 1)) - 0.15) / 0.6, 0, 1);
    if (gP > 0) {
        drawSq(C, { x: -aPx, y: 0 }, { x: 0, y: -aPx }, 'rgba(255, 68, 170, 1)', 'a\u00B2', gP);
        drawSq(C, { x: 0, y: bPx }, { x: bPx, y: 0 }, 'rgba(0, 255, 255, 1)', 'b\u00B2', gP);
        const hdx = B.x - A.x, hdy = B.y - A.y;
        const hl = Math.sqrt(hdx * hdx + hdy * hdy);
        if (hl > 0) {
            const px = -hdy / hl * c * unit, py = hdx / hl * c * unit;
            drawSq(A, { x: B.x - A.x, y: B.y - A.y }, { x: px, y: py }, 'rgba(255, 200, 0, 1)', 'c\u00B2', gP);
        }
    }
    ctx.restore();
}

function drawSq(org, d1, d2, color, label, gP) {
    const g2 = { x: org.x + d1.x, y: org.y + d1.y };
    const g4 = { x: org.x + d2.x * gP, y: org.y + d2.y * gP };
    const g3 = { x: org.x + d1.x + d2.x * gP, y: org.y + d1.y + d2.y * gP };

    ctx.fillStyle = color.replace('1)', (0.12 * gP) + ')');
    ctx.beginPath(); ctx.moveTo(org.x, org.y); ctx.lineTo(g2.x, g2.y); ctx.lineTo(g3.x, g3.y); ctx.lineTo(g4.x, g4.y); ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = color.replace('1)', (0.5 * gP) + ')');
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(org.x, org.y); ctx.lineTo(g2.x, g2.y); ctx.lineTo(g3.x, g3.y); ctx.lineTo(g4.x, g4.y); ctx.closePath();
    ctx.stroke();

    if (gP > 0.7) {
        const lp = clamp((gP - 0.7) / 0.2, 0, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + lp + ')';
        ctx.font = '12px Consolas, Monaco, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(label, (org.x + g3.x) / 2, (org.y + g3.y) / 2 - 4);
    }
}

function drawConstructedSq(p) {
    const q = clamp(p, 0, 1);
    if (q <= 0) return;
    const s = bigSize, bx = bigBLx, by = bigBLy;
    const aPx = a * unit, bPx = b * unit;
    const sides = [
        {x1: bx, y1: by, dx: s, dy: 0, labOffX: 0, labOffY: 14},
        {x1: bx + s, y1: by, dx: 0, dy: -s, labOffX: 14, labOffY: 0},
        {x1: bx + s, y1: by - s, dx: -s, dy: 0, labOffX: 0, labOffY: -18},
        {x1: bx, y1: by - s, dx: 0, dy: s, labOffX: -18, labOffY: 0},
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    const done = Math.floor(q * 4);
    const frac = (q * 4) - done;
    for (let i = 0; i < Math.min(done + 1, 4); i++) {
        const si = sides[i];
        const t = i < done ? 1 : frac;
        const ex = si.x1 + si.dx * t, ey = si.y1 + si.dy * t;
        ctx.beginPath(); ctx.moveTo(si.x1, si.y1); ctx.lineTo(ex, ey); ctx.stroke();
        const aEndFrac = aPx / s;
        if (t >= aEndFrac && i < 4) {
            const ax = si.x1 + si.dx * aEndFrac, ay = si.y1 + si.dy * aEndFrac;
            ctx.beginPath();
            ctx.moveTo(ax - si.dy / s * 5, ay + si.dx / s * 5);
            ctx.lineTo(ax + si.dy / s * 5, ay - si.dx / s * 5);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = '11px Consolas, Monaco, monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const nx = -si.dy / s, ny = si.dx / s;
            const hx = nx * 12, hy = ny * 12;
            ctx.fillText('a', si.x1 + si.dx * aEndFrac / 2 + hx + si.labOffX * 0.3,
                              si.y1 + si.dy * aEndFrac / 2 + hy + si.labOffY * 0.3);
            if (t > aEndFrac) {
                const bMid = (aEndFrac + t) / 2;
                ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
                ctx.fillText('b', si.x1 + si.dx * bMid + hx + si.labOffX * 0.3,
                                  si.y1 + si.dy * bMid + hy + si.labOffY * 0.3);
            }
        }
    }
    ctx.restore();
}

function drawTri(pts, fC, sC, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fC;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = sC;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

function drawPuzTris(tris, alpha) {
    if (alpha <= 0) return;
    const cols = [
        ['rgba(0, 200, 255, 0.18)', 'rgba(0, 200, 255, 0.6)'],
        ['rgba(255, 68, 170, 0.18)', 'rgba(255, 68, 170, 0.6)'],
        ['rgba(255, 200, 0, 0.18)', 'rgba(255, 200, 0, 0.6)'],
        ['rgba(0, 255, 200, 0.18)', 'rgba(0, 255, 200, 0.6)'],
    ];
    tris.forEach((t, i) => drawTri(t, cols[i % 4][0], cols[i % 4][1], alpha));
}

function findHyp(pts) {
    const l01 = (pts[0].x - pts[1].x)**2 + (pts[0].y - pts[1].y)**2;
    const l02 = (pts[0].x - pts[2].x)**2 + (pts[0].y - pts[2].y)**2;
    const l12 = (pts[1].x - pts[2].x)**2 + (pts[1].y - pts[2].y)**2;
    if (l01 > l02 && l01 > l12) return { e1: pts[0], e2: pts[1] };
    if (l02 > l01 && l02 > l12) return { e1: pts[0], e2: pts[2] };
    return { e1: pts[1], e2: pts[2] };
}

function drawHighlight(pPhase, mT, tris, alpha) {
    if (alpha <= 0) return;
    const apx = a * unit, bpx = b * unit;
    const s = bigSize;
    const bx = bigBLx, by = bigBLy;

    if (mT < 0.5) {
        const pp = clamp((pPhase - 0.1) / 0.4, 0, 1);
        const q = clamp(pp * (1 - mT * 2), 0, 1);
        if (q <= 0) return;

        const hyps = tris.map(findHyp);
        ctx.save();
        ctx.globalAlpha = alpha * q * 0.7;
        ctx.fillStyle = 'rgba(255, 200, 0, 0.06)';
        ctx.beginPath();
        ctx.moveTo(hyps[0].e2.x, hyps[0].e2.y);
        ctx.lineTo(hyps[1].e1.x, hyps[1].e1.y);
        ctx.lineTo(hyps[2].e2.x, hyps[2].e2.y);
        ctx.lineTo(hyps[3].e1.x, hyps[3].e1.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hyps[0].e2.x, hyps[0].e2.y);
        ctx.lineTo(hyps[1].e1.x, hyps[1].e1.y);
        ctx.lineTo(hyps[2].e2.x, hyps[2].e2.y);
        ctx.lineTo(hyps[3].e1.x, hyps[3].e1.y);
        ctx.closePath();
        ctx.stroke();

        if (q > 0.3) {
            const cx2 = bx + s / 2, cy2 = by - s / 2;
            ctx.fillStyle = 'rgba(255, 200, 0, ' + (0.8 * clamp((q - 0.3) / 0.4, 0, 1)) + ')';
            ctx.font = 'bold 16px Consolas, Monaco, monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('c\u00B2', cx2, cy2);
        }
        ctx.restore();
    } else {
        const q = clamp((mT - 0.5) * 2, 0, 1);
        if (q <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha * q * 0.3;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.06)';
        ctx.fillRect(bx + apx, by - bpx - apx, bpx, bpx);
        ctx.fillRect(bx, by - apx, apx, apx);

        ctx.globalAlpha = alpha * q;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx + apx, by - bpx - apx, bpx, bpx);
        ctx.strokeRect(bx, by - apx, apx, apx);

        ctx.font = '13px Consolas, Monaco, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillText('b\u00B2', bx + apx + bpx / 2, by - bpx / 2 - apx);
        ctx.fillText('a\u00B2', bx + apx / 2, by - apx / 2);
        ctx.restore();
    }
}

function drawLabels(p, mT, alpha) {
    const q = clamp((p - 0.1) / 0.3, 0, 1);
    if (q <= 0 || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha * q;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '13px Consolas, Monaco, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (mT < 0.5) {
        ctx.fillText('\u6392\u52171: \u56DB\u4E2A\u4E09\u89D2\u5F62 + c\u00B2 = (a+b)\u00B2', cx, bigBLy + 32);
    } else {
        ctx.fillText('\u6392\u52172: \u56DB\u4E2A\u4E09\u89D2\u5F62 + a\u00B2 + b\u00B2 = (a+b)\u00B2', cx, bigBLy + 32);
    }
    ctx.restore();
}
