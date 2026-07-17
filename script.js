const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let cx = canvas.width / 2;
let cy = canvas.height * 0.42;
let MAX_R = Math.max(120, Math.min(canvas.width * 0.22, canvas.height * 0.22, 220));
const CIRCLE_COUNT = 30;

let isPlaying = true;
let progress = 0; // 0 to 1

const playPauseBtn = document.getElementById('playPauseBtn');
const progressSlider = document.getElementById('progressSlider');
const formulaOverlay = document.getElementById('formulaOverlay');
const formulaHud = formulaOverlay.querySelector('.formula-hud');

katex.render('\\text{等腰三角形面积} = \\frac{1}{2} \\times \\text{底边} \\times \\text{高}', document.getElementById('formulaLine1'), { throwOnError: false });
katex.render('\\text{圆面积}\\; S = \\frac{1}{2} \\times 2\\pi r \\times r = \\pi r^{2}', document.getElementById('formulaLine2'), { throwOnError: false });

function updateSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cx = canvas.width / 2;
    cy = canvas.height * 0.42;
    MAX_R = Math.max(120, Math.min(canvas.width * 0.22, canvas.height * 0.22, 220));
    updateFormulaHudPosition();
}
window.addEventListener('resize', updateSize);
updateSize();

playPauseBtn.addEventListener('click', () => {
    if (progress >= 1) {
        progress = 0;
        progressSlider.value = 0;
    }
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '暂停' : '播放';
});

progressSlider.addEventListener('input', (e) => {
    progress = e.target.value / 1000;
    isPlaying = false;
    playPauseBtn.textContent = '播放';
});

// Easing function for smooth individual circle morphs
function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

// Draw holographic grid background
function drawBackgroundGrid() {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    
    const gridSize = 40;
    
    // Draw vertical lines
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw subtle measurement crosshairs near corners
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    const pad = 20;
    const len = 10;
    
    const corners = [
        [pad, pad],
        [canvas.width - pad, pad],
        [pad, canvas.height - pad],
        [canvas.width - pad, canvas.height - pad]
    ];
    
    corners.forEach(([ccx, ccy]) => {
        ctx.beginPath();
        ctx.moveTo(ccx - len, ccy); ctx.lineTo(ccx + len, ccy);
        ctx.moveTo(ccx, ccy - len); ctx.lineTo(ccx, ccy + len);
        ctx.stroke();
    });
}

// Pulsating Holographic Energy Core at the Center
function drawEnergyCore() {
    const time = Date.now();
    const pulse = 1 + 0.15 * Math.sin(time / 200);
    
    // 1. Central high-intensity dot
    ctx.fillStyle = 'rgba(0, 255, 255, 1)';
    ctx.save();
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 2. Pulse ring
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 / pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    
    // 3. Rotating dash ring
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time / 1200);
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// Main morphing logic
function drawMorphingCircles() {
    // Pass 1: Draw ghost circles in the background (so active lines draw on top)
    for (let i = 0; i < CIRCLE_COUNT; i++) {
        const r = (MAX_R / CIRCLE_COUNT) * (i + 1);
        
        // Faint ghost circle representing original circular boundaries
        // Always drawn at a soft, weak opacity so children can track the original circle's outline
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.48)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Pass 2: Draw the morphing shapes
    for (let i = 0; i < CIRCLE_COUNT; i++) {
        const r = (MAX_R / CIRCLE_COUNT) * (i + 1);
        
        // Timing logic: Outer circles (i = CIRCLE_COUNT - 1) morph first, inner (i = 0) morph last
        const idx = CIRCLE_COUNT - 1 - i;
        const startThreshold = idx / CIRCLE_COUNT;
        const endThreshold = (idx + 1) / CIRCLE_COUNT;
        
        let easedT = 0;
        if (progress > endThreshold) {
            easedT = 1;
        } else if (progress >= startThreshold) {
            const localP = (progress - startThreshold) / (endThreshold - startThreshold);
            easedT = easeInOutQuad(localP);
        }
        
        const drawPath = () => {
            if (easedT === 0) {
                // Perfect Circle
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
            } else if (easedT === 1) {
                // Perfect flat horizontal line
                const halfW = Math.PI * r;
                ctx.moveTo(cx - halfW, cy + r);
                ctx.lineTo(cx + halfW, cy + r);
            } else {
                // Peeling & unrolling morphing curve (concave bowl shape, no crossover)
                const segments = Math.max(16, Math.floor(48 * (r / MAX_R)));
                for (let j = 0; j <= segments; j++) {
                    // alpha runs from -PI (top-left endpoint) to PI (top-right endpoint)
                    const alpha = -Math.PI + (Math.PI * 2 * j) / segments;
                    
                    // Circular coords
                    const xCircle = cx + r * Math.sin(alpha);
                    const yCircle = cy + r * Math.cos(alpha);
                    
                    // Flat coords (centered flat line at y = cy + r)
                    const xFlat = cx + r * alpha;
                    const yFlat = cy + r;
                    
                    // Symmetrical non-crossing linear interpolation
                    const x = xCircle * (1 - easedT) + xFlat * easedT;
                    const y = yCircle * (1 - easedT) + yFlat * easedT;
                    
                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            }
        };

        // Advanced Sci-Fi Glow Color-coding
        let strokeColor, glowColor, lineWidth;
        if (easedT === 1) {
            // Matured triangle base line - deep stable cyan
            strokeColor = 'rgba(0, 240, 240, 0.65)';
            glowColor = 'rgba(0, 240, 240, 0.08)';
            lineWidth = 1;
        } else if (easedT === 0) {
            // Untouched circular layers - bright electric cyan
            strokeColor = 'rgba(150, 255, 255, 0.9)';
            glowColor = 'rgba(0, 255, 255, 0.25)';
            lineWidth = 1.2;
        } else {
            // Transitioning (peeling) wires - super intense white-hot/yellow-cyan core
            strokeColor = 'rgba(230, 255, 255, 1)';
            glowColor = 'rgba(0, 255, 255, 0.5)';
            lineWidth = 1.8;
        }

        // Draw dual-pass simulated bloom/glow (high performance, GPU friendly)
        ctx.save();
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = lineWidth * 3.5;
        ctx.beginPath();
        drawPath();
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        drawPath();
        ctx.stroke();
        ctx.restore();
    }
}

// Dynamic Helper Lines & Text Annotations
function drawDynamicAnnotations() {
    // 1. Vertical Radius Line (r) - going UP (fades out)
    const radiusOpacity = Math.max(0, 1 - progress * 2.0);
    if (radiusOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = radiusOpacity;
        
        // Dashed radius line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy - MAX_R);
        ctx.stroke();
        
        // Arrowhead pointing up
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - MAX_R + 8);
        ctx.lineTo(cx, cy - MAX_R);
        ctx.lineTo(cx + 4, cy - MAX_R + 8);
        ctx.stroke();
        
        // Label r
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Consolas, Monaco, monospace';
        ctx.fillText('半径 r', cx + 12, cy - MAX_R / 2 + 5);
        
        ctx.restore();
    }
    
    // 2. Triangle Height (h = r) - going DOWN (fades in)
    const heightOpacity = Math.max(0, (progress - 0.4) * 1.66);
    if (heightOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = heightOpacity;
        
        // Dashed height line
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + MAX_R);
        ctx.stroke();
        
        // Height labeling
        ctx.fillStyle = '#00ffff';
        ctx.font = '14px Consolas, Monaco, monospace';
        ctx.fillText('高 h = r', cx + 12, cy + MAX_R / 2 + 5);
        
        ctx.restore();
    }
}

// Draw outer triangle borders & base lines
function drawTriangleOutline() {
    if (progress > 0) {
        const waistOpacity = Math.min(1, progress * 1.5);
        ctx.save();
        ctx.globalAlpha = waistOpacity;
        
        const baseLeftX = cx - Math.PI * MAX_R;
        const baseRightX = cx + Math.PI * MAX_R;
        const baseY = cy + MAX_R;
        const apexX = cx;
        const apexY = cy;

        // Linear growing endpoints for triangle's waistlines (starting from bottom to top apex)
        const currentLeftX = baseLeftX + (apexX - baseLeftX) * progress;
        const currentLeftY = baseY + (apexY - baseY) * progress;
        const currentRightX = baseRightX + (apexX - baseRightX) * progress;
        const currentRightY = baseY + (apexY - baseY) * progress;

        // Outer glow pass for the borders
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseY); ctx.lineTo(currentLeftX, currentLeftY);
        ctx.moveTo(baseRightX, baseY); ctx.lineTo(currentRightX, currentRightY);
        ctx.stroke();

        // Sharp core pass
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseY); ctx.lineTo(currentLeftX, currentLeftY);
        ctx.moveTo(baseRightX, baseY); ctx.lineTo(currentRightX, currentRightY);
        ctx.stroke();

        ctx.restore();
    }

    // Ground Baseline + ticks
    if (progress > 0) {
        const baseOpacity = Math.min(1, progress * 1.5);
        ctx.save();
        ctx.globalAlpha = baseOpacity;
        
        const xL = cx - Math.PI * MAX_R;
        const xR = cx + Math.PI * MAX_R;
        const yB = cy + MAX_R;
        
        // Ground line
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xL, yB);
        ctx.lineTo(xR, yB);
        ctx.stroke();
        
        // Precision measurement ticks at each end
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(xL, yB - 6); ctx.lineTo(xL, yB + 6);
        ctx.moveTo(xR, yB - 6); ctx.lineTo(xR, yB + 6);
        ctx.stroke();
        
        // Label "底边 Base = 2πr" centered below base
        ctx.fillStyle = '#00ffff';
        ctx.font = '14px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('底边 Base = 2πr', cx, yB + 22);
        
        ctx.restore();
    }
}

// Update KaTeX formula HUD overlay position and opacity
function updateFormulaHudPosition() {
    formulaHud.style.left = cx + 'px';
    formulaHud.style.top = (cy + MAX_R + 50) + 'px';
}

function updateFormulaHudOpacity() {
    const opacity = Math.max(0, Math.min(1, (progress - 0.78) * 4.54));
    formulaHud.style.opacity = opacity;
    if (opacity > 0) {
        formulaHud.style.display = 'block';
    } else {
        formulaHud.style.display = 'none';
    }
}

// Master loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update progress
    if (isPlaying) {
        progress = Math.min(1, progress + 0.0018);
        progressSlider.value = progress * 1000;
        
        if (progress >= 1) {
            isPlaying = false;
            playPauseBtn.textContent = '播放';
        }
    }

    // 1. Draw grid background
    drawBackgroundGrid();
    
    // 2. Draw energy core
    drawEnergyCore();
    
    // 3. Draw morphing layered paths
    drawMorphingCircles();
    
    // 4. Draw static/dynamic annotations
    drawDynamicAnnotations();
    
    // 5. Draw the triangle's borders
    drawTriangleOutline();
    
    // 6. Update formula HUD opacity
    updateFormulaHudOpacity();

    requestAnimationFrame(draw);
}

// Start rendering
draw();
