// Keyboard and mouse input: WASD or arrow keys to move, Shift to crouch-walk, Space or
// click to confirm, P or Escape to pause, R to restart the level, M to mute.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

const MOVE_KEYS = {
  KeyW: { x: 0, y: -1 },
  ArrowUp: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

export function createInput(canvas) {
  const held = new Set();
  let queuedActions = 0;
  let crouched = false;

  function onKeyDown(event) {
    if (event.code in MOVE_KEYS) {
      held.add(event.code);
      event.preventDefault();
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      crouched = true;
    } else if (event.code === 'Space' || event.code === 'Enter') {
      queuedActions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      queuedActions |= ACTION_PAUSE;
    } else if (event.code === 'KeyR') {
      queuedActions |= ACTION_RESTART;
    } else if (event.code === 'KeyM') {
      queuedActions |= ACTION_MUTE;
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') crouched = false;
  }

  function onClick() {
    queuedActions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onClick);

  return {
    /** The current movement vector, normalised, from held keys. */
    direction() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        x += MOVE_KEYS[code].x;
        y += MOVE_KEYS[code].y;
      }
      const length = Math.hypot(x, y);
      return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
    },
    isCrouched() {
      return crouched;
    },
    /** One-shot actions since the last read. */
    takeActions() {
      const actions = queuedActions;
      queuedActions = 0;
      return actions;
    },
  };
}
