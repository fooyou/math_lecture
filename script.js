const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const cx = canvas.width / 2;
const cy = canvas.height / 2;
const MAX_R = 100;
const CIRCLE_COUNT = 30;

let isPlaying = true;
let progress = 0; // 0 to 1

const playPauseBtn = document.getElementById('playPauseBtn');
const progressSlider = document.getElementById('progressSlider');

playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '暂停' : '播放';
});

progressSlider.addEventListener('input', (e) => {
    progress = e.target.value / 1000;
    isPlaying = false;
    playPauseBtn.textContent = '播放';
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isPlaying) {
        progress = Math.min(1, progress + 0.0015);
        progressSlider.value = progress * 1000;
    }

    // 绘制所有圆
    for (let i = CIRCLE_COUNT - 1; i >= 0; i--) {
        const r = (MAX_R / CIRCLE_COUNT) * (i + 1);
        
        // 关键逻辑：决定该圆是否应该“下垂”
        const threshold = (1 - (i + 1) / CIRCLE_COUNT);
        
        // 1. 绘制圆 (未展开时高亮，展开后变幽灵)
        const isUnfolded = progress > threshold;
        ctx.strokeStyle = isUnfolded ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        if (isUnfolded) {
            // 2. 已下垂：绘制成线段
            const unfoldProgress = Math.min(1, (progress - threshold) / 0.1);
            const width = (2 * Math.PI * r) * unfoldProgress;
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.moveTo(cx - width / 2, cy + r);
            ctx.lineTo(cx + width / 2, cy + r);
            ctx.stroke();
        }
    }

    // 绘制顶点 (圆心)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // 绘制三角形辅助边框 (动态: 从底边端点向上方顶点延伸生长)
    if (progress > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // 三角形参数
        const baseLeftX = cx - Math.PI * MAX_R;
        const baseRightX = cx + Math.PI * MAX_R;
        const baseY = cy + MAX_R;
        const apexX = cx;
        const apexY = cy;

        // 计算当前生长点: 从底边向顶点插值
        const currentLeftX = baseLeftX + (apexX - baseLeftX) * progress;
        const currentLeftY = baseY + (apexY - baseY) * progress;
        
        const currentRightX = baseRightX + (apexX - baseRightX) * progress;
        const currentRightY = baseY + (apexY - baseY) * progress;

        // 绘制左腰线：从底端点开始，指向当前生长点
        ctx.moveTo(baseLeftX, baseY);
        ctx.lineTo(currentLeftX, currentLeftY);
        
        // 绘制右腰线：从底端点开始，指向当前生长点
        ctx.moveTo(baseRightX, baseY);
        ctx.lineTo(currentRightX, currentRightY);
        
        ctx.stroke();
    }

    if (progress >= 1) drawFinalLabels();

    requestAnimationFrame(draw);
}

function drawFinalLabels() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('底边 Base = 2πr', cx - 70, cy + MAX_R + 40);
    ctx.fillText('高 Height = r', cx + Math.PI * MAX_R + 20, cy + MAX_R / 2);
    ctx.font = '24px Arial';
    ctx.fillText('圆面积 Area = 1/2 * 底边 * 高 = πr²', cx - 180, cy + MAX_R + 90);
}

draw();
