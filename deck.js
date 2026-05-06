const scenes = [...document.querySelectorAll('.scene')];

const state = {
  current: 0,
  beat: 0,
};

function totalScenes() {
  return scenes.length;
}

function activeScene() {
  return scenes[state.current];
}

function maxBeat(scene) {
  return parseInt(scene.dataset.beats || '1', 10);
}

function render() {
  scenes.forEach((s, i) => s.classList.toggle('active', i === state.current));
  const scene = activeScene();
  if (!scene) return;
  scene.querySelectorAll('[data-beat]').forEach(el => {
    const b = parseInt(el.dataset.beat, 10);
    el.classList.toggle('revealed', b <= state.beat);
  });
  const counter = scene.querySelector('.scene-counter');
  if (counter) counter.textContent = `${String(state.current + 1).padStart(2, '0')} / ${String(totalScenes()).padStart(2, '0')}`;
}

function advance() {
  const scene = activeScene();
  if (state.beat < maxBeat(scene)) {
    state.beat++;
  } else if (state.current < totalScenes() - 1) {
    state.current++;
    state.beat = 0;
  }
  render();
}

function retreat() {
  if (state.beat > 0) {
    state.beat--;
  } else if (state.current > 0) {
    state.current--;
    state.beat = maxBeat(activeScene());
  }
  render();
}

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch (e.key) {
    case ' ':
    case 'ArrowRight':
      e.preventDefault();
      advance();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      retreat();
      break;
  }
});

render();

// expose for console testing
window.deck = { state, advance, retreat, scenes, render };
