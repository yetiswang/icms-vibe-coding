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

const sceneGrid = document.getElementById('scene-grid');
const helpOverlay = document.getElementById('help-overlay');

function buildSceneGrid() {
  const grid = sceneGrid.querySelector('.grid');
  grid.innerHTML = '';
  scenes.forEach((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const title = s.querySelector('.title')?.textContent?.trim() || s.querySelector('.eyebrow')?.textContent?.trim() || `Scene ${num}`;
    const tile = document.createElement('div');
    tile.className = 'tile';
    const numEl = document.createElement('div');
    numEl.className = 'num';
    numEl.textContent = num;
    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    tile.appendChild(numEl);
    tile.appendChild(titleEl);
    tile.addEventListener('click', () => {
      state.current = i;
      state.beat = 0;
      sceneGrid.hidden = true;
      render();
    });
    grid.appendChild(tile);
  });
}

function toggleSceneGrid() {
  if (helpOverlay.hidden === false) helpOverlay.hidden = true;
  sceneGrid.hidden = !sceneGrid.hidden;
  if (!sceneGrid.hidden) buildSceneGrid();
}

function toggleHelp() {
  if (sceneGrid.hidden === false) sceneGrid.hidden = true;
  helpOverlay.hidden = !helpOverlay.hidden;
}

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch (e.key) {
    case ' ':
    case 'ArrowRight':
      if (sceneGrid.hidden && helpOverlay.hidden) { e.preventDefault(); advance(); }
      break;
    case 'ArrowLeft':
      if (sceneGrid.hidden && helpOverlay.hidden) { e.preventDefault(); retreat(); }
      break;
    case 'Escape':
      e.preventDefault();
      toggleSceneGrid();
      break;
    case '?':
      e.preventDefault();
      toggleHelp();
      break;
  }
});

render();

// expose for console testing
window.deck = { state, advance, retreat, scenes, render };
