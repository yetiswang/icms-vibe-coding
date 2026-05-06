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
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.type = 'button';
    const numEl = document.createElement('div');
    numEl.className = 'num';
    numEl.textContent = num;
    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    tile.appendChild(numEl);
    tile.appendChild(titleEl);
    const jump = () => {
      state.current = i;
      state.beat = 0;
      sceneGrid.hidden = true;
      const tw = typewriters.get(activeScene().dataset.scene);
      if (tw) tw.reset();
      render();
    };
    tile.addEventListener('click', jump);
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); }
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

  // Shift+Space → skip rest of current terminal line. No-op when no typewriter is active.
  if (e.key === ' ' && e.shiftKey) {
    e.preventDefault();
    const scene = activeScene();
    const tw = typewriters.get(scene?.dataset.scene);
    if (tw && tw.timer) tw.completeCurrentLine();
    return;
  }

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
    case 'f':
    case 'F':
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      break;
  }
});

render();

// === Touch / mobile navigation ===
const touchBack = document.getElementById('touch-back');
const touchFwd  = document.getElementById('touch-fwd');
const touchGrid = document.getElementById('touch-grid');

if (touchBack) touchBack.addEventListener('click', e => { e.stopPropagation(); retreat(); });
if (touchFwd)  touchFwd .addEventListener('click', e => { e.stopPropagation(); advance(); });
if (touchGrid) touchGrid.addEventListener('click', e => { e.stopPropagation(); toggleSceneGrid(); });

// === Theme toggle (light / dark) ===
const themeToggle = document.getElementById('theme-toggle');
function applyStoredTheme() {
  const stored = localStorage.getItem('deck-theme');
  if (stored === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
}
applyStoredTheme();
if (themeToggle) {
  themeToggle.addEventListener('click', e => {
    e.stopPropagation();
    const isLight = document.documentElement.dataset.theme === 'light';
    if (isLight) {
      delete document.documentElement.dataset.theme;
      localStorage.setItem('deck-theme', 'dark');
    } else {
      document.documentElement.dataset.theme = 'light';
      localStorage.setItem('deck-theme', 'light');
    }
  });
}

// Tap-anywhere advancement (touch / mouse). Skips iframes and interactive UI.
document.addEventListener('click', e => {
  if (sceneGrid.hidden === false || helpOverlay.hidden === false) return;
  if (e.target.closest('#touch-nav, iframe, button, a[href], input, .tile, .iframe-wrap')) return;
  const w = window.innerWidth;
  const x = e.clientX;
  if (x > w * 0.55) advance();
  else if (x < w * 0.30) retreat();
  // 30%–55% middle band: no-op (avoids accidental retreats on text drags)
});

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

const scene6 = scenes.find(s => s.dataset.scene === '6');
if (scene6) {
  registerTypewriter(scene6, [
    { segments: [
      { text: '$ ', cls: 'term-prompt' },
      { text: 'claude', cls: 'term-user' },
    ]},
    { segments: [
      { text: '> ', cls: 'term-prompt' },
      { text: 'read everything in My Templates, tell me my visual style', cls: 'term-user' },
    ]},
    { segments: [
      { text: '↪ thinking… ', cls: 'term-think' },
      { text: 'first list the folder, then read the style notes.', cls: 'term-think' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'list_files ', cls: 'term-key' },
      { text: '~/InfrastructureStrategy/My Templates/', cls: 'term-out' },
    ]},
    { segments: [
      { text: '   → latex/  html/  pptx/  assets/  STYLE_GUIDE.md  CLAUDE.md', cls: 'term-toolout' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'read_file ', cls: 'term-key' },
      { text: 'CLAUDE.md, STYLE_GUIDE.md, three .tex templates', cls: 'term-out' },
    ]},
    { segments: [
      { text: '↪ thinking… ', cls: 'term-think' },
      { text: 'same pattern across them all: dark band + red accent + three rings.', cls: 'term-think' },
    ]},
    { segments: [
      { text: 'palette: ', cls: 'term-out' },
      { text: 'TU/e Red #C8102E', cls: 'term-key' },
      { text: ', dark #1E1E28, light #F5F5F8', cls: 'term-out' },
    ]},
    { segments: [
      { text: 'font: ', cls: 'term-out' },
      { text: 'Avenir Next LT Pro', cls: 'term-key' },
      { text: ' (4 weights)', cls: 'term-out' },
    ]},
    { segments: [
      { text: 'motif: ', cls: 'term-out' },
      { text: 'three concentric red rings', cls: 'term-key' },
      { text: ' on a dark band', cls: 'term-out' },
    ]},
    { segments: [{ text: '✓ done in 4.1s', cls: 'term-ok' }]},
  ]);
}

const scene9 = scenes.find(s => s.dataset.scene === '9');
if (scene9) {
  registerTypewriter(scene9, [
    { segments: [
      { text: '$ ', cls: 'term-prompt' },
      { text: 'claude', cls: 'term-user' },
    ]},
    { segments: [
      { text: '> ', cls: 'term-prompt' },
      { text: 'build me a presentation about how I use Claude Code, in my visual style', cls: 'term-user' },
    ]},
    { segments: [
      { text: '↪ thinking… ', cls: 'term-think' },
      { text: 'reuse the visual style from My Templates so it feels familiar.', cls: 'term-think' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'read ', cls: 'term-key' },
      { text: 'My Templates/  → palette #C8102E, Avenir Next, ring motif', cls: 'term-out' },
    ]},
    { segments: [
      { text: '↪ thinking… ', cls: 'term-think' },
      { text: 'plan the story. five acts, eighteen scenes. live demos for the briefing site, the SDL globe, superresolution.nl.', cls: 'term-think' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'write ', cls: 'term-key' },
      { text: 'index.html', cls: 'term-out' },
      { text: '   → 18 sections + beat system', cls: 'term-toolout' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'write ', cls: 'term-key' },
      { text: 'styles.css', cls: 'term-out' },
      { text: '   → palette tokens, animations, terminal styles', cls: 'term-toolout' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'write ', cls: 'term-key' },
      { text: 'deck.js', cls: 'term-out' },
      { text: '   → keyboard nav + this terminal animation', cls: 'term-toolout' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'copy ', cls: 'term-key' },
      { text: 'fonts/, ICMS imagery, embedded LSRI + discoveryLabNL', cls: 'term-out' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'git ', cls: 'term-key' },
      { text: 'init && commit "scaffold deck"', cls: 'term-out' },
    ]},
    { segments: [
      { text: '↪ thinking… ', cls: 'term-think' },
      { text: 'now serve it locally and open the browser to test.', cls: 'term-think' },
    ]},
    { segments: [
      { text: '⚙ tool ', cls: 'term-tool' },
      { text: 'serve & open ', cls: 'term-key' },
      { text: 'http://localhost:8000', cls: 'term-out' },
    ]},
    { segments: [
      { text: '✓ ready. it\'s the deck you\'re watching right now.', cls: 'term-ok' },
    ]},
  ]);
}

// expose for console testing
window.deck = { state, advance, retreat, scenes, render, registerTypewriter };
