document.getElementById('year').textContent = new Date().getFullYear();

// 音のオン/オフ
const soundToggle = document.getElementById('sound-toggle');
soundToggle.addEventListener('click', () => {
  const on = !Sound.isEnabled();
  Sound.setEnabled(on);
  soundToggle.setAttribute('aria-pressed', String(on));
  soundToggle.textContent = on ? '🔊 音あり' : '🔇 音なし';
});
