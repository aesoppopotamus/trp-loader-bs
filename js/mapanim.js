// js/mapanim.js
document.addEventListener('DOMContentLoaded', () => {
  const bracket = document.getElementById('bracket-container');
  const mapWrap = document.querySelector('.map-container');  // animate THIS
  const img     = document.querySelector('.map-image');      // don't transform this
  const scan    = document.querySelector('.holo-scanlines');

  if (!bracket || !mapWrap || !img) return;

  // Ensure the <img> is not carrying old inline transforms
  img.style.transform = 'none';
  img.style.opacity = '1';

  // Show the bracket and trigger the CSS entrance (scale/rotate on wrapper)
  bracket.style.display = 'block';
  if (scan) scan.style.display = 'block';
  requestAnimationFrame(() => bracket.classList.add('ready'));

  // Gentle, continuous pan + zoom on the wrapper (keeps aspect ratio intact)
  let t = 0;
  function loop() {
    t += 0.016;                            // ~60fps
    const scale = 1 + 0.02 * Math.sin(t);  // 2% in/out
    const tx = 6 * Math.sin(t * 0.6);      // subtle px pan
    const ty = 3 * Math.sin(t * 0.4);

    mapWrap.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    requestAnimationFrame(loop);
  }

  // Start after the entrance transition (match your CSS duration)
  setTimeout(loop, 1000);
});
