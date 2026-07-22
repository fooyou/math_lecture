# 圆面积逼近几何动画 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个写实科技风的圆面积转三角形动画原型。

**Architecture:** 使用 HTML5 Canvas 实现高性能绘图，利用 JavaScript 驱动几何形变动画，CSS 负责整体科技暗色调风格。

**Tech Stack:** HTML, CSS, JavaScript (Canvas API).

---

### Task 1: 初始化项目结构

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `script.js`

- [ ] **Step 1: 创建 HTML 结构**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Circle to Triangle</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <canvas id="animationCanvas"></canvas>
    <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 CSS 基础样式**
```css
body, html { margin: 0; padding: 0; overflow: hidden; background: #0a0b10; }
canvas { display: block; }
```

- [ ] **Step 3: 创建 JS 入口**
```javascript
const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
```

- [ ] **Step 4: Commit**
```bash
git add .
git commit -m "feat: setup project structure"
```

### Task 2: 绘制初始状态 (圆)

**Files:**
- Modify: `script.js`

- [ ] **Step 1: 实现圆的绘制逻辑**
```javascript
function drawCircle(x, y, radius) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
}
// 初次渲染
drawCircle(canvas.width / 2, canvas.height / 2, 100);
```

- [ ] **Step 2: Commit**
```bash
git add script.js
git commit -m "feat: draw initial circle"
```

### Task 3: 实现线性平滑形变逻辑

**Files:**
- Modify: `script.js`

- [ ] **Step 1: 编写形变动画函数**
```javascript
let progress = 0; // 0 to 1
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 根据 progress 在圆和三角形之间插值
    // 圆心 (cx, cy) = (canvas.width/2, canvas.height/2)
    // 三角形底边长度 = 2 * PI * r
    // 动画逻辑...
    progress += 0.005;
    if (progress <= 1) requestAnimationFrame(animate);
}
animate();
```

- [ ] **Step 2: Commit**
```bash
git add script.js
git commit -m "feat: implement animation loop"
```

### Task 4: 添加公式标注与最终态

**Files:**
- Modify: `script.js`

- [ ] **Step 1: 在 Canvas 上绘制动态文本**
```javascript
function drawLabels(x, y, base, height) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(`Base = ${base.toFixed(2)}`, x, y + height + 20);
    // ...
}
```

- [ ] **Step 2: Commit**
```bash
git add script.js
git commit -m "feat: add final labels"
```
