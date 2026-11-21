// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between title, play, paused, caught, level-clear and win screens.
//
// ?seed=N fixes the random stream. ?shot=start|play|alert|win|caught (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ALARM, EVENT_CAUGHT, EVENT_LEVEL_CLEAR, EVENT_SPOTTED, EVENT_STOLEN } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  createRenderer,
  SCREEN_CAUGHT,
  SCREEN_CLEAR,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './render.js';
import { stageShot } from './shots.js';
import { LEVELS } from './levels.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  // Paint synchronously, twice, so a headless screenshot taken right after load
  // already holds the finished frame (no waiting on requestAnimationFrame).
  const scene = stageShot(name, world);
  renderer.draw(world.state, world, scene.screen, scene.best, false);
  renderer.draw(world.state, world, scene.screen, scene.best, false);
  window.__shotReady = true;
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startLevel(index) {
    world.loadLevel(index);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Playing ${LEVELS[index].name}.`);
  }

  function playEvents(events) {
    if (events & EVENT_STOLEN) audio.steal();
    if (events & EVENT_SPOTTED) audio.spotted();
    if (events & EVENT_ALARM) audio.alarm();
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // The hall idles behind the title: guards walk their patrols while the thief
      // waits at the entrance, out of sight, so the meter never rises here.
      world.step(STEP, { x: 0, y: 0 }, false);
      world.state.detection = 0;
      world.state.alarm = false;
      return;
    }
    const events = world.step(STEP, input.direction(), input.isCrouched());
    playEvents(events);
    if (events & EVENT_CAUGHT) {
      screen = SCREEN_CAUGHT;
      audio.caught();
      announce('Caught! Press R to try the level again.');
    } else if (events & EVENT_LEVEL_CLEAR) {
      audio.clear();
      if (world.state.levelIndex + 1 >= LEVELS.length) {
        screen = SCREEN_WIN;
        best = Math.max(best, LEVELS.length);
        saveBest(best);
        announce('You stole every exhibit and slipped away. You win!');
      } else {
        screen = SCREEN_CLEAR;
        best = Math.max(best, world.state.levelIndex + 1);
        saveBest(best);
        announce('Level clear. Press Space for the next gallery.');
      }
    } else if (events & EVENT_STOLEN) {
      announce('Exhibit stolen. Reach the green EXIT unseen.');
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_PLAY || screen === SCREEN_CAUGHT)) {
      audio.click();
      startLevel(world.state.levelIndex);
      return;
    }
    if (actions & ACTION_CONFIRM && screen === SCREEN_TITLE) {
      audio.unlock();
      audio.click();
      startLevel(0);
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_CLEAR) {
      audio.click();
      startLevel(world.state.levelIndex + 1);
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_WIN) {
      audio.click();
      startLevel(0);
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_CAUGHT) {
      audio.click();
      startLevel(world.state.levelIndex);
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, world, screen, best, audio.isMuted());
  }

  // Leaving the tab pauses a running game rather than letting guards close in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('The Quiet Gallery. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
