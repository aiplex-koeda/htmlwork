// タッチすると音が鳴るキャラたち
(() => {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // ペンタトニック

  const FRIENDS = [
    {
      name: 'もも', color: '#f472b6',
      extra: '<circle cx="27" cy="22" r="11" fill="#f472b6"/><circle cx="73" cy="22" r="11" fill="#f472b6"/>',
      play: (i) => Sound.tone({ freq: SCALE[i], type: 'sine', dur: 0.4, vol: 0.28 }),
    },
    {
      name: 'そら', color: '#60a5fa',
      extra: '<path d="M50 14 Q54 0 62 -6" stroke="#1f2328" stroke-width="3" fill="none"/><circle cx="63" cy="-7" r="6" fill="#facc15"/>',
      play: (i) => Sound.tone({ freq: SCALE[i] / 2, type: 'triangle', dur: 0.5, vol: 0.35 }),
    },
    {
      name: 'きらり', color: '#facc15',
      extra: '<path d="M50 -12 L55 -1 L66 0 L58 8 L60 19 L50 13 L40 19 L42 8 L34 0 L45 -1Z" fill="#f97316"/>',
      play: (i) => {
        Sound.tone({ freq: SCALE[i] * 2, type: 'square', dur: 0.08, vol: 0.06 });
        Sound.tone({ freq: SCALE[(i + 2) % SCALE.length] * 2, type: 'square', dur: 0.14, vol: 0.06, delay: 0.09 });
      },
    },
    {
      name: 'ぼよん', color: '#4ade80',
      extra: '<path d="M50 14 Q48 4 50 -2" stroke="#15803d" stroke-width="3" fill="none"/><path d="M50 0 Q62 -14 74 -5 Q62 6 50 0Z" fill="#15803d"/><path d="M50 2 Q38 -10 28 -3 Q39 8 50 2Z" fill="#15803d"/>',
      play: (i) => Sound.tone({ freq: 380 + i * 50, type: 'sine', dur: 0.45, vol: 0.32, slideTo: 110 }),
    },
  ];

  function svg(f) {
    return `
<svg viewBox="0 -15 100 115" aria-hidden="true">
  <ellipse cx="50" cy="96" rx="30" ry="4" fill="rgba(0,0,0,.15)"/>
  ${f.extra}
  <path d="M50 12 C80 12 94 40 94 64 C94 86 74 94 50 94 C26 94 6 86 6 64 C6 40 20 12 50 12Z" fill="${f.color}"/>
  <ellipse cx="50" cy="76" rx="22" ry="12" fill="#fff" opacity=".25"/>
  <g class="eyes-open">
    <circle cx="36" cy="54" r="7" fill="#1f2328"/><circle cx="64" cy="54" r="7" fill="#1f2328"/>
    <circle cx="38.5" cy="51.5" r="2.4" fill="#fff"/><circle cx="66.5" cy="51.5" r="2.4" fill="#fff"/>
  </g>
  <g class="eyes-closed" stroke="#1f2328" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M30 49 L38 54 L30 59"/><path d="M70 49 L62 54 L70 59"/>
  </g>
  <ellipse cx="25" cy="66" rx="6" ry="4" fill="#fb7185" opacity=".55"/>
  <ellipse cx="75" cy="66" rx="6" ry="4" fill="#fb7185" opacity=".55"/>
  <path class="mouth" d="M44 66 Q50 72 56 66" stroke="#1f2328" stroke-width="3" stroke-linecap="round" fill="none"/>
  <ellipse class="mouth-open" cx="50" cy="69" rx="6" ry="7" fill="#7f1d1d"/>
</svg>`;
  }

  const states = FRIENDS.map((f) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'friend hidden';
    el.style.setProperty('--d', `${(Math.random() * -2.4).toFixed(2)}s`);
    el.setAttribute('aria-label', `${f.name}（タッチすると音が鳴ります）`);
    el.innerHTML = `<span class="friend-body">${svg(f)}</span><span class="friend-name">${f.name}</span>`;
    stage.appendChild(el);
    const st = { f, el, x: 0.5, hidden: true, timer: 0, tapTimer: 0, walkTimer: 0 };
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      tap(st);
    });
    el.addEventListener('click', (e) => { if (e.detail === 0) tap(st); });
    return st;
  });

  // ほかのキャラとなるべく重ならない位置を選ぶ
  function pickX(self) {
    let best = Math.random();
    let bestDist = -1;
    for (let i = 0; i < 12; i++) {
      const x = Math.random();
      const d = Math.min(...states.filter((s) => s !== self && !s.hidden).map((s) => Math.abs(s.x - x)), 1);
      if (d > bestDist) { best = x; bestDist = d; }
    }
    return best;
  }

  function setX(st, x) {
    st.x = x;
    st.el.style.setProperty('--x', x.toFixed(3));
  }

  function show(st) {
    setX(st, pickX(st));
    st.hidden = false;
    st.el.classList.remove('hidden');
  }

  function hide(st) {
    st.hidden = true;
    st.el.classList.add('hidden');
  }

  function walk(st) {
    st.el.classList.add('walking');
    setX(st, pickX(st));
    clearTimeout(st.walkTimer);
    st.walkTimer = setTimeout(() => st.el.classList.remove('walking'), reduceMotion ? 0 : 1400);
  }

  function schedule(st, base = 2500) {
    clearTimeout(st.timer);
    st.timer = setTimeout(() => act(st), base + Math.random() * 3500);
  }

  function act(st) {
    if (!document.hidden) {
      if (Math.random() < 0.3) {
        hide(st);
        setTimeout(() => show(st), 700 + Math.random() * 1200);
      } else {
        walk(st);
      }
    }
    schedule(st);
  }

  function tap(st) {
    if (st.hidden) return;
    const i = Math.floor(Math.random() * SCALE.length);
    st.f.play(i);

    st.el.classList.remove('tapped');
    void st.el.offsetWidth; // アニメーションを最初から再生
    st.el.classList.add('tapped');
    clearTimeout(st.tapTimer);
    st.tapTimer = setTimeout(() => st.el.classList.remove('tapped'), 420);

    // ♪ を飛ばす
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = Math.random() < 0.5 ? '♪' : '♫';
    note.style.setProperty('--c', st.f.color);
    note.style.setProperty('--dx', `${Math.round(Math.random() * 60 - 30)}px`);
    note.style.left = `${st.el.offsetLeft + st.el.offsetWidth / 2}px`;
    note.style.top = `${st.el.offsetTop - 10}px`;
    note.addEventListener('animationend', () => note.remove());
    stage.appendChild(note);
    setTimeout(() => note.remove(), 1500);

    // タッチされたら少しその場にとどまる
    schedule(st, 3000);
  }

  // ステージが見えたら順番に登場
  let started = false;
  function start() {
    if (started) return;
    started = true;
    states.forEach((st, idx) => {
      setTimeout(() => {
        show(st);
        schedule(st);
      }, 300 + idx * 450);
    });
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { start(); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(stage);
  } else {
    start();
  }
})();
