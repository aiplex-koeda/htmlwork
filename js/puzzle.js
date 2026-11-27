// ドラッグで入れ替えるパズル
(() => {
  const root = document.getElementById('puzzle');
  if (!root) return;

  const board = root.querySelector('.puzzle-board');
  const status = root.querySelector('.puzzle-status');
  const preview = root.querySelector('.puzzle-preview');
  const image = makeImage();
  preview.src = image;

  let n = 3;
  let order = [];   // order[位置] = ピース番号
  let tiles = [];   // tiles[ピース番号] = 要素
  let solved = false;
  let selected = null;
  let moves = 0;

  // パズル用の絵をコードで描く
  function makeImage() {
    const s = 600;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');

    const sky = g.createLinearGradient(0, 0, 0, s);
    sky.addColorStop(0, '#7dd3fc');
    sky.addColorStop(1, '#e0f2fe');
    g.fillStyle = sky;
    g.fillRect(0, 0, s, s);

    // にじ
    g.lineWidth = 18;
    ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'].forEach((col, i) => {
      g.strokeStyle = col;
      g.beginPath();
      g.arc(260, 470, 240 - i * 18, Math.PI, 0);
      g.stroke();
    });

    // たいよう
    g.fillStyle = '#fde047';
    g.beginPath();
    g.arc(500, 100, 55, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#fde047';
    g.lineWidth = 8;
    g.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(500 + Math.cos(a) * 70, 100 + Math.sin(a) * 70);
      g.lineTo(500 + Math.cos(a) * 88, 100 + Math.sin(a) * 88);
      g.stroke();
    }

    // くも
    const cloud = (x, y, k) => {
      g.fillStyle = '#ffffff';
      [[0, 0, 30], [30, -16, 38], [66, 0, 30], [32, 10, 30]].forEach(([dx, dy, r]) => {
        g.beginPath();
        g.arc(x + dx * k, y + dy * k, r * k, 0, Math.PI * 2);
        g.fill();
      });
    };
    cloud(60, 90, 1.1);
    cloud(300, 60, 0.8);

    // おか
    g.fillStyle = '#4ade80';
    g.beginPath();
    g.moveTo(0, 460);
    g.quadraticCurveTo(150, 360, 320, 450);
    g.quadraticCurveTo(470, 520, 600, 420);
    g.lineTo(600, 600);
    g.lineTo(0, 600);
    g.fill();

    // いえ
    g.fillStyle = '#fef3c7';
    g.fillRect(410, 430, 110, 90);
    g.fillStyle = '#dc2626';
    g.beginPath();
    g.moveTo(395, 435);
    g.lineTo(465, 372);
    g.lineTo(535, 435);
    g.fill();
    g.fillStyle = '#92400e';
    g.fillRect(450, 470, 30, 50);
    g.fillStyle = '#93c5fd';
    g.fillRect(420, 450, 22, 22);
    g.fillRect(488, 450, 22, 22);

    g.fillStyle = '#16a34a';
    g.beginPath();
    g.moveTo(0, 530);
    g.quadraticCurveTo(200, 470, 380, 540);
    g.quadraticCurveTo(500, 575, 600, 515);
    g.lineTo(600, 600);
    g.lineTo(0, 600);
    g.fill();

    // はな
    [[60, 560, '#f472b6'], [140, 545, '#facc15'], [230, 565, '#f472b6'], [320, 580, '#ffffff'], [540, 570, '#facc15']].forEach(([x, y, col]) => {
      g.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.beginPath();
        g.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#f97316';
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
    });

    return c.toDataURL('image/png');
  }

  function setup(size) {
    n = size;
    board.innerHTML = '';
    board.style.setProperty('--n', n);
    tiles = [];
    for (let p = 0; p < n * n; p++) {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'tile';
      t.dataset.piece = p;
      t.style.backgroundImage = `url(${image})`;
      t.style.backgroundSize = `${n * 100}% ${n * 100}%`;
      t.style.backgroundPosition = `${((p % n) / (n - 1)) * 100}% ${(Math.floor(p / n) / (n - 1)) * 100}%`;
      t.setAttribute('aria-label', `ピース ${p + 1}`);
      attach(t);
      board.appendChild(t);
      tiles.push(t);
    }
    shuffle();
  }

  function isSolved() {
    return order.every((p, pos) => p === pos);
  }

  function shuffle() {
    order = [...Array(n * n).keys()];
    do {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    } while (isSolved());
    solved = false;
    selected = null;
    moves = 0;
    board.classList.remove('solved');
    render();
    updateStatus();
  }

  function render() {
    order.forEach((p, pos) => {
      const t = tiles[p];
      t.style.left = `${((pos % n) * 100) / n}%`;
      t.style.top = `${(Math.floor(pos / n) * 100) / n}%`;
      t.classList.toggle('selected', p === selected);
    });
  }

  function updateStatus() {
    status.textContent = solved ? `🎉 完成！ ${moves} 手でクリア` : `手数: ${moves}`;
  }

  function posAt(x, y) {
    const r = board.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return -1;
    const col = Math.min(n - 1, Math.floor(((x - r.left) / r.width) * n));
    const row = Math.min(n - 1, Math.floor(((y - r.top) / r.height) * n));
    return row * n + col;
  }

  function swap(a, b) {
    [order[a], order[b]] = [order[b], order[a]];
    moves++;
    selected = null;
    render();
    if (isSolved()) {
      solved = true;
      board.classList.add('solved');
      Sound.arpeggio([523.25, 659.25, 783.99, 1046.5], { type: 'triangle', dur: 0.3, vol: 0.25, step: 0.12 });
    } else {
      Sound.tone({ freq: 330, type: 'triangle', dur: 0.12, vol: 0.2 });
    }
    updateStatus();
  }

  function tapTile(p) {
    if (solved) return;
    if (selected === null) {
      selected = p;
      Sound.tone({ freq: 660, type: 'sine', dur: 0.08, vol: 0.15 });
      render();
    } else if (selected === p) {
      selected = null;
      render();
    } else {
      swap(order.indexOf(selected), order.indexOf(p));
    }
  }

  function attach(t) {
    let start = null;
    t.addEventListener('pointerdown', (e) => {
      if (solved || (e.pointerType === 'mouse' && e.button !== 0)) return;
      t.setPointerCapture(e.pointerId);
      start = { x: e.clientX, y: e.clientY, moved: false };
    });
    t.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 6) return;
      if (!start.moved) {
        start.moved = true;
        selected = null;
        render();
        t.classList.add('dragging');
      }
      t.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    const end = (e) => {
      if (!start) return;
      const s = start;
      start = null;
      t.classList.remove('dragging');
      t.style.transform = '';
      if (e.type === 'pointercancel') return;
      const p = Number(t.dataset.piece);
      if (s.moved) {
        const from = order.indexOf(p);
        const to = posAt(e.clientX, e.clientY);
        if (to !== -1 && to !== from) swap(from, to);
      } else {
        tapTile(p);
      }
    };
    t.addEventListener('pointerup', end);
    t.addEventListener('pointercancel', end);
    // キーボード操作（Enter / Space）
    t.addEventListener('click', (e) => { if (e.detail === 0) tapTile(Number(t.dataset.piece)); });
  }

  const gridButtons = [...root.querySelectorAll('[data-grid]')];
  gridButtons.forEach((b) => b.addEventListener('click', () => {
    gridButtons.forEach((g) => g.setAttribute('aria-pressed', String(g === b)));
    setup(Number(b.dataset.grid));
  }));
  root.querySelector('[data-action="shuffle"]').addEventListener('click', shuffle);

  setup(3);
})();
