const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let cx = canvas.width / 2;
let cy = canvas.height * 0.42;
let MAX_R = Math.max(120, Math.min(canvas.width * 0.22, canvas.height * 0.22, 220));
const CIRCLE_COUNT = 30;

let isPlaying = true;
let progress = 0; // 0 到 1

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

// 缓动函数，使每个圆的形变更平滑
function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

// 绘制全息网格背景
function drawBackgroundGrid() {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.025)';
    ctx.lineWidth = 1;

    const gridSize = 40;

    // 绘制竖线
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // 绘制横线
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // 在四角绘制测量十字线
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

// 脉动的全息能量核心
function drawEnergyCore() {
    const time = Date.now();
    const pulse = 1 + 0.15 * Math.sin(time / 200);

    // 1. 中心高亮光点
    ctx.fillStyle = 'rgba(0, 255, 255, 1)';
    ctx.save();
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 脉冲光环
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 / pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // 3. 旋转虚线环
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

// 主形变逻辑
function drawMorphingCircles() {
    // 第一遍：先绘制幽灵圆（让活动线绘制在上层）
    for (let i = 0; i < CIRCLE_COUNT; i++) {
        const r = (MAX_R / CIRCLE_COUNT) * (i + 1);

        // 淡色幽灵圆，表示原始圆形边界
        // 以低透明度绘制，便于观察原始圆的轮廓
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.28)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 第二遍：绘制形变中的图形
    for (let i = 0; i < CIRCLE_COUNT; i++) {
        const r = (MAX_R / CIRCLE_COUNT) * (i + 1);

        // 时序逻辑：外层圆先形变，内层圆后形变
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
                // 完美圆形
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
            } else if (easedT === 1) {
                // 完美水平直线
                const halfW = Math.PI * r;
                ctx.moveTo(cx - halfW, cy + r);
                ctx.lineTo(cx + halfW, cy + r);
            } else {
                // 剥离展开中的形变曲线（凹碗形，不交叉）
                const segments = Math.max(16, Math.floor(48 * (r / MAX_R)));
                for (let j = 0; j <= segments; j++) {
                    // alpha 从 -PI（左端点）到 PI（右端点）
                    const alpha = -Math.PI + (Math.PI * 2 * j) / segments;

                    // 圆形坐标
                    const xCircle = cx + r * Math.sin(alpha);
                    const yCircle = cy + r * Math.cos(alpha);

                    // 直线坐标（居中水平线，y = cy + r）
                    const xFlat = cx + r * alpha;
                    const yFlat = cy + r;

                    // 对称不交叉的线性插值
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

        // 科幻发光色彩编码
        let strokeColor, glowColor;
        const lineWidth = 5;
        if (easedT === 1) {
            // 已展开的三角形底线——稳定的深青色
            strokeColor = 'rgba(0, 240, 240, 0.65)';
            glowColor = 'rgba(0, 240, 240, 0.12)';
        } else if (easedT === 0) {
            // 未形变的圆形层——明亮的电青色
            strokeColor = 'rgba(150, 255, 255, 0.65)';
            glowColor = 'rgba(0, 255, 255, 0.3)';
        } else {
            // 正在剥离的线——高亮白热/青黄色
            strokeColor = 'rgba(230, 255, 255, 1)';
            glowColor = 'rgba(0, 255, 255, 0.55)';
        }

        // 双层绘制模拟泛光效果（高性能，GPU 友好）
        ctx.save();
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = lineWidth * 1.8;
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

// 动态辅助线与文字标注
function drawDynamicAnnotations() {
    // 1. 垂直半径线 r——向上延伸（逐渐淡出）
    const radiusOpacity = Math.max(0, 1 - progress * 2.0);
    if (radiusOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = radiusOpacity;

        // 虚线半径
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy - MAX_R);
        ctx.stroke();

        // 向上的箭头
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - MAX_R + 8);
        ctx.lineTo(cx, cy - MAX_R);
        ctx.lineTo(cx + 4, cy - MAX_R + 8);
        ctx.stroke();

        // 标签"半径 r"
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Consolas, Monaco, monospace';
        ctx.fillText('半径 r', cx + 12, cy - MAX_R / 2 + 5);

        ctx.restore();
    }

    // 2. 三角形高 h = r——向下延伸（逐渐淡入）
    const heightOpacity = Math.max(0, (progress - 0.4) * 1.66);
    if (heightOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = heightOpacity;

        // 虚线高
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + MAX_R);
        ctx.stroke();

        // 高度标签
        ctx.fillStyle = '#00ffff';
        ctx.font = '14px Consolas, Monaco, monospace';
        ctx.fillText('高 h = r', cx + 12, cy + MAX_R / 2 + 5);

        ctx.restore();
    }
}

// 绘制三角形边框与底边
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

        // 三角形腰线的端点从底边向顶点线性生长
        const currentLeftX = baseLeftX + (apexX - baseLeftX) * progress;
        const currentLeftY = baseY + (apexY - baseY) * progress;
        const currentRightX = baseRightX + (apexX - baseRightX) * progress;
        const currentRightY = baseY + (apexY - baseY) * progress;

        // 边界的发光外层
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseY); ctx.lineTo(currentLeftX, currentLeftY);
        ctx.moveTo(baseRightX, baseY); ctx.lineTo(currentRightX, currentRightY);
        ctx.stroke();

        // 锐利核心层
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseY); ctx.lineTo(currentLeftX, currentLeftY);
        ctx.moveTo(baseRightX, baseY); ctx.lineTo(currentRightX, currentRightY);
        ctx.stroke();

        ctx.restore();
    }

    // 底边基线 + 刻度
    if (progress > 0) {
        const baseOpacity = Math.min(1, progress * 1.5);
        ctx.save();
        ctx.globalAlpha = baseOpacity;

        const xL = cx - Math.PI * MAX_R;
        const xR = cx + Math.PI * MAX_R;
        const yB = cy + MAX_R;

        // 底边线
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xL, yB);
        ctx.lineTo(xR, yB);
        ctx.stroke();

        // 两端精密度量刻度
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(xL, yB - 6); ctx.lineTo(xL, yB + 6);
        ctx.moveTo(xR, yB - 6); ctx.lineTo(xR, yB + 6);
        ctx.stroke();

        // 底边下方居中标签
        ctx.fillStyle = '#00ffff';
        ctx.font = '14px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('底边 Base = 2πr', cx, yB + 22);

        ctx.restore();
    }
}

// 更新 KaTeX 公式 HUD 浮层位置与透明度
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

// 主循环
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 更新进度
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

// 开始渲染
draw();
