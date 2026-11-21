// The deterministic screenshot scenes behind ?shot=start|play|alert|win&seed=1.
// Each scene sets the world to one fixed, hand-placed state — no randomness, no
// simulated play — so the same URL always paints the same frame, byte for byte.
import { SCREEN_CAUGHT, SCREEN_CLEAR, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { LEVELS } from './levels.js';

function placeGuard(world, index, x, y, angle) {
  const guard = world.state.guards[index];
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.chasing = false;
  return guard;
}

/**
 * Stage `name` on the level-1 world and return the screen to draw and the best level
 * to show. Unknown names fall back to the title scene.
 */
export function stageShot(name, world) {
  world.loadLevel(0);
  const state = world.state;
  const level = LEVELS[0];
  state.time = 4.2;

  if (name === 'play') {
    // The thief crouched behind the Marble Horse, a guard's cone sweeping past.
    state.player.x = 560;
    state.player.y = 400;
    state.player.crouched = true;
    state.player.angle = -Math.PI / 2;
    state.detection = 0.32;
    placeGuard(world, 0, 400, 250, 0.35);
    placeGuard(world, 1, 1000, 420, Math.PI);
    return { screen: SCREEN_PLAY, best: 1 };
  }

  if (name === 'alert') {
    // Spotted: the meter nearly full, the alarm up, a guard turning to chase.
    state.player.x = 700;
    state.player.y = 250;
    state.player.crouched = false;
    state.player.angle = Math.PI;
    state.detection = 0.92;
    state.alarm = true;
    state.alarmLeft = 5;
    const guard = placeGuard(world, 0, 560, 250, 0);
    guard.chasing = true;
    guard.chaseLeft = 5;
    placeGuard(world, 1, 1000, 500, Math.PI * 0.75);
    return { screen: SCREEN_PLAY, best: 1 };
  }

  if (name === 'win') {
    // The getaway: exhibit stolen, thief at the service door, hall cleared.
    state.stolen = true;
    state.player.x = level.exit.x - 10;
    state.player.y = level.exit.y;
    state.player.angle = 0;
    state.detection = 0;
    placeGuard(world, 0, 400, 150, Math.PI / 2);
    placeGuard(world, 1, 1000, 300, -Math.PI / 2);
    return { screen: SCREEN_WIN, best: 3 };
  }

  if (name === 'caught') {
    state.detection = 1;
    state.alarm = true;
    state.caught = true;
    placeGuard(world, 0, 300, 500, -0.5);
    placeGuard(world, 1, 900, 300, Math.PI);
    return { screen: SCREEN_CAUGHT, best: 1 };
  }

  // start: the title screen over the hall at rest, thief at the entrance.
  state.player.x = level.playerStart.x;
  state.player.y = level.playerStart.y;
  state.detection = 0;
  placeGuard(world, 0, 400, 150, Math.PI / 2);
  placeGuard(world, 1, 1000, 250, Math.PI);
  return { screen: SCREEN_TITLE, best: 1 };
}
