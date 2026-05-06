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

function advance(opts = {}) {
  const scene = activeScene();
  if (!scene) return;
  const tw = typewriters.get(scene.dataset.scene);

  if (tw && !tw.isDone()) {
    tw.advanceLine();
    return;
  }

  if (state.beat < maxBeat(scene)) {
    state.beat++;
  } else if (state.current < totalScenes() - 1) {
    state.current++;
    state.beat = 0;
    const nextTw = typewriters.get(activeScene().dataset.scene);
    if (nextTw) nextTw.reset();
  }
  render();
}

function retreat() {
  const scene = activeScene();
  const tw = typewriters.get(scene.dataset.scene);

  if (tw && (tw.lineIndex > 0 || tw.timer)) {
    tw.reset();
    return;
  }

  if (state.beat > 0) {
    state.beat--;
  } else if (state.current > 0) {
    state.current--;
    state.beat = maxBeat(activeScene());
    const prevTw = typewriters.get(activeScene().dataset.scene);
    if (prevTw) {
      if (prevTw.timer) { clearInterval(prevTw.timer); prevTw.timer = null; }
      prevTw.lineIndex = prevTw.lines.length;
      prevTw.charIndex = 0;
      prevTw.currentLine = null;
      prevTw.currentLineEl = null;
      prevTw.body.innerHTML = '';
      prevTw.lines.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'term-line';
        line.segments.forEach((s, i) => {
          const span = document.createElement('span');
          if (s.cls) span.className = s.cls;
          span.textContent = s.text;
          span.dataset.seg = String(i);
          el.appendChild(span);
        });
        prevTw.body.appendChild(el);
        prevTw.body.appendChild(document.createTextNode('\n'));
      });
    }
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

class Typewriter {
  constructor(rootEl, lines) {
    this.root = rootEl;
    this.body = rootEl.querySelector('.terminal .body');
    this.lines = lines;
    this.lineIndex = 0;
    this.charIndex = 0;
    this.timer = null;
    this.charsPerSec = 30;
    this.currentLineEl = null;
    this.currentLine = null;
  }

  reset() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.lineIndex = 0;
    this.charIndex = 0;
    this.currentLineEl = null;
    this.currentLine = null;
    this.body.innerHTML = '';
    this.appendCursor();
  }

  appendCursor() {
    this.removeCursor();
    const cursor = document.createElement('span');
    cursor.className = 'term-cursor';
    cursor.dataset.cursor = '1';
    this.body.appendChild(cursor);
  }

  removeCursor() {
    this.body.querySelectorAll('[data-cursor]').forEach(el => el.remove());
  }

  advanceLine() {
    if (this.lineIndex >= this.lines.length) return false;

    if (this.timer) {
      // mid-typing: complete current line instantly, do NOT start next line
      this.completeCurrentLine();
      return true;
    }

    this.startLine(this.lines[this.lineIndex]);
    return true;
  }

  startLine(line) {
    this.removeCursor();
    const el = document.createElement('span');
    el.className = 'term-line';
    el.dataset.lineIndex = String(this.lineIndex);
    this.body.appendChild(el);
    this.body.appendChild(document.createTextNode('\n'));
    this.charIndex = 0;
    this.currentLineEl = el;
    this.currentLine = line;
    const ms = 1000 / this.charsPerSec;
    this.timer = setInterval(() => this.tick(), ms);
  }

  tick() {
    const seg = this.currentLine.segments;
    let count = 0;
    for (let i = 0; i < seg.length; i++) {
      const len = seg[i].text.length;
      if (this.charIndex < count + len) {
        const localIdx = this.charIndex - count;
        const partial = seg[i].text.slice(0, localIdx + 1);
        let span = this.currentLineEl.querySelector(`[data-seg="${i}"]`);
        if (!span) {
          span = document.createElement('span');
          span.dataset.seg = String(i);
          if (seg[i].cls) span.className = seg[i].cls;
          this.currentLineEl.appendChild(span);
        }
        span.textContent = partial;
        this.charIndex++;
        return;
      }
      count += len;
    }
    this.completeCurrentLine();
  }

  completeCurrentLine() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (!this.currentLine || !this.currentLineEl) return;
    this.currentLineEl.innerHTML = '';
    this.currentLine.segments.forEach((s, i) => {
      const span = document.createElement('span');
      if (s.cls) span.className = s.cls;
      span.textContent = s.text;
      span.dataset.seg = String(i);
      this.currentLineEl.appendChild(span);
    });
    this.lineIndex++;
    this.currentLine = null;
    this.currentLineEl = null;
    this.appendCursor();
  }

  isDone() {
    return this.lineIndex >= this.lines.length && !this.timer;
  }
}

const typewriters = new Map();

function registerTypewriter(sceneEl, lines) {
  const tw = new Typewriter(sceneEl, lines);
  typewriters.set(sceneEl.dataset.scene, tw);
  return tw;
}

// expose for console testing
window.deck = { state, advance, retreat, scenes, render, registerTypewriter };
