// らくがき帳（保存機能なし）
(() => {
  const root = document.getElementById('doodle');
  if (!root) return;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const COLORS = [
    ['くろ', '#1f2328'], ['あか', '#ef4444'], ['オレンジ', '#f97316'], ['きいろ', '#facc15'],
    ['みどり', '#22c55e'], ['あお', '#3b82f6'], ['むらさき', '#8b5cf6'], ['ピンク', '#ec4899'],
  ];
  let color = COLORS[0][1];
  let size = 8;
  let erasing = false;

  // パレット
  const palette = root.querySelector('.palette');
  const swatches = COLORS.map(([name, value], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = value;
    b.setAttribute('aria-label', name);
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => {
      color = value;
      setEraser(false);
      swatches.forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
    });
    palette.appendChild(b);
    return b;
  });

  // 太さ
  const sizeButtons = [...root.querySelectorAll('[data-size]')];
  sizeButtons.forEach((b) => b.addEventListener('click', () => {
    size = Number(b.dataset.size);
    sizeButtons.forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
  }));

  // 消しゴム・全消し
  const eraserBtn = root.querySelector('[data-tool="eraser"]');
  function setEraser(on) {
    erasing = on;
    eraserBtn.setAttribute('aria-pressed', String(on));
  }
  eraserBtn.addEventListener('click', () => setEraser(!erasing));
  root.querySelector('[data-tool="clear"]').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // 画面サイズに合わせて解像度を調整（描いた絵は残す）
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (!w || !h || (w === canvas.width && h === canvas.height)) return;
    let prev = null;
    if (canvas.width && canvas.height) {
      prev = document.createElement('canvas');
      prev.width = canvas.width;
      prev.height = canvas.height;
      prev.getContext('2d').drawImage(canvas, 0, 0);
    }
    canvas.width = w;
    canvas.height = h;
    if (prev) ctx.drawImage(prev, 0, 0, w, h);
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);

  // 描画
  let drawing = false;
  let last = null;

  function point(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale, scale };
  }

  function stroke(from, to) {
    ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = (erasing ? size * 2 : size) * to.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (from.x === to.x && from.y === to.y) {
      ctx.beginPath();
      ctx.arc(to.x, to.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    last = point(e);
    stroke(last, last);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (events.length ? events : [e])) {
      const p = point(ev);
      stroke(last, p);
      last = p;
    }
  });
  const end = () => { drawing = false; last = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
})();
