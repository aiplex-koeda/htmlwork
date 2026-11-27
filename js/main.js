document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('greet').addEventListener('click', () => {
  document.getElementById('message').textContent = 'JavaScript が動いています。';
});
