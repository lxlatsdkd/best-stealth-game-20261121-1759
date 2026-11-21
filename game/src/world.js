// The rules of The Quiet Gallery: movement and collision, line of sight, vision cones,
// the detection meter, guard patrols and chases, and the steal-then-escape objective.
//
// Events are bit flags returned by step(): the loop plays a sound and changes screen on them.
import { DETECTION, GUARD, PLAYER, STEP, WORLD_HEIGHT, WORLD_WIDTH } from './config.js';
import { LEVELS } from './levels.js';

export const EVENT_NONE = 0;
export const EVENT_STOLEN = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_LEVEL_CLEAR = 4;
export const EVENT_ALARM = 8;
export const EVENT_SPOTTED = 16;

/** A guard's live state: where it is, where it looks, which waypoint it walks to. */
function createGuard(def) {
  const first = def.waypoints[0];
  const second = def.waypoints[1] ?? first;
  return {
    x: first.x,
    y: first.y,
    angle: Math.atan2(second.y - first.y, second.x - first.x),
    waypointIndex: 1 % def.waypoints.length,
    pauseLeft: 0,
    pauseSeconds: def.pauseSeconds,
    chasing: false,
    chaseLeft: 0,
    waypoints: def.waypoints,
  };
}

export function createWorld(random) {
  const state = {
    levelIndex: 0,
    player: { x: 0, y: 0, angle: -Math.PI / 2, crouched: false, moving: false },
    guards: [],
    detection: 0,
    stolen: false,
    alarm: false,
    alarmLeft: 0,
    caught: false,
    cleared: false,
    time: 0,
    footsteps: 0,
  };
  const world = { state, random, loadLevel, reset, step, lineBlocked, rayDistance, inShadow, guardSeesPlayer };

  function loadLevel(index) {
    const level = LEVELS[index];
    state.levelIndex = index;
    state.player.x = level.playerStart.x;
    state.player.y = level.playerStart.y;
    state.player.angle = -Math.PI / 2;
    state.player.crouched = false;
    state.guards = level.guards.map(createGuard);
    state.detection = 0;
    state.stolen = false;
    state.alarm = false;
    state.alarmLeft = 0;
    state.caught = false;
    state.cleared = false;
    state.time = 0;
  }

  function reset() {
    loadLevel(0);
  }

  /** Every rectangle that blocks movement and sight on this level. */
  function blockers() {
    const level = LEVELS[state.levelIndex];
    return level.walls.concat(level.cover);
  }

  /** Does the segment (x1,y1)-(x2,y2) cross any blocker? Walls and cover hide the thief. */
  function lineBlocked(x1, y1, x2, y2) {
    for (const rect of blockers()) {
      if (segmentHitsRect(x1, y1, x2, y2, rect)) return true;
    }
    return false;
  }

  function segmentHitsRect(x1, y1, x2, y2, rect) {
    if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
    const edges = [
      [rect.x, rect.y, rect.x + rect.w, rect.y],
      [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
      [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
      [rect.x, rect.y + rect.h, rect.x, rect.y],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
    }
    return false;
  }

  function pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
    const d1 = cross(x3, y3, x4, y4, x1, y1);
    const d2 = cross(x3, y3, x4, y4, x2, y2);
    const d3 = cross(x1, y1, x2, y2, x3, y3);
    const d4 = cross(x1, y1, x2, y2, x4, y4);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }

  function cross(ax, ay, bx, by, px, py) {
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  }

  /** Distance along a ray before it hits a blocker (or the view distance). */
  function rayDistance(x, y, angle, maxDistance) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let best = maxDistance;
    for (const rect of blockers()) {
      const hit = rayRect(x, y, dx, dy, rect);
      if (hit !== null && hit < best) best = hit;
    }
    return best;
  }

  function rayRect(x, y, dx, dy, rect) {
    let tMin = 0;
    let tMax = Infinity;
    const slabs = [
      [rect.x, rect.x + rect.w, dx, x],
      [rect.y, rect.y + rect.h, dy, y],
    ];
    for (const [min, max, d, origin] of slabs) {
      if (Math.abs(d) < 1e-9) {
        if (origin < min || origin > max) return null;
      } else {
        let t1 = (min - origin) / d;
        let t2 = (max - origin) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
      }
    }
    return tMin;
  }

  /** Is the thief standing in a dark corner? Shadows slow the detection meter. */
  function inShadow(x, y) {
    for (const zone of LEVELS[state.levelIndex].shadows) {
      if (pointInRect(x, y, zone)) return true;
    }
    return false;
  }

  /** Can this guard see the thief right now? Inside the cone, in range, line of sight clear. */
  function guardSeesPlayer(guard) {
    const level = LEVELS[state.levelIndex];
    const dx = state.player.x - guard.x;
    const dy = state.player.y - guard.y;
    const distance = Math.hypot(dx, dy);
    const viewDistance = GUARD.viewDistance * level.viewDistanceScale;
    if (distance > viewDistance) return false;
    const halfAngle = GUARD.viewHalfAngle * level.viewAngleScale;
    let delta = Math.atan2(dy, dx) - guard.angle;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    if (Math.abs(delta) > halfAngle) return false;
    return !lineBlocked(guard.x, guard.y, state.player.x, state.player.y);
  }

  function moveCircle(entity, dx, dy, radius) {
    const nextX = entity.x + dx;
    const nextY = entity.y + dy;
    if (!circleHitsBlocker(nextX, entity.y, radius)) entity.x = nextX;
    if (!circleHitsBlocker(entity.x, nextY, radius)) entity.y = nextY;
    entity.x = Math.min(WORLD_WIDTH - 24 - radius, Math.max(24 + radius, entity.x));
    entity.y = Math.min(WORLD_HEIGHT - 24 - radius, Math.max(24 + radius, entity.y));
  }

  function circleHitsBlocker(x, y, radius) {
    for (const rect of blockers()) {
      const closestX = Math.min(rect.x + rect.w, Math.max(rect.x, x));
      const closestY = Math.min(rect.y + rect.h, Math.max(rect.y, y));
      if (Math.hypot(x - closestX, y - closestY) < radius) return true;
    }
    return false;
  }

  function moveGuard(guard, dt, chasing) {
    const speed = chasing ? GUARD.chaseSpeed : GUARD.patrolSpeed;
    if (chasing) {
      const dx = state.player.x - guard.x;
      const dy = state.player.y - guard.y;
      const distance = Math.hypot(dx, dy) || 1;
      guard.angle = Math.atan2(dy, dx);
      moveCircle(guard, (dx / distance) * speed * dt, (dy / distance) * speed * dt, GUARD.radius);
      return;
    }
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      return;
    }
    const target = guard.waypoints[guard.waypointIndex];
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      guard.pauseLeft = guard.pauseSeconds;
      return;
    }
    guard.angle = Math.atan2(dy, dx);
    moveCircle(guard, (dx / distance) * speed * dt, (dy / distance) * speed * dt, GUARD.radius);
  }

  /**
   * Advance the world one fixed step. `move` is {x, y} in [-1, 1]; `crouched` slows the
   * thief and the meter. Returns event flags for sounds and screen changes.
   */
  function step(dt, move, crouched) {
    if (state.caught || state.cleared) return EVENT_NONE;
    state.time += dt;
    let events = EVENT_NONE;

    const player = state.player;
    const speed = crouched ? PLAYER.crouchSpeed : PLAYER.walkSpeed;
    const length = Math.hypot(move.x, move.y);
    player.moving = length > 0.1;
    if (player.moving) {
      const nx = move.x / (length || 1);
      const ny = move.y / (length || 1);
      player.angle = Math.atan2(ny, nx);
      const before = { x: player.x, y: player.y };
      moveCircle(player, nx * speed * dt, ny * speed * dt, PLAYER.radius);
      if (Math.hypot(player.x - before.x, player.y - before.y) > 0.5) state.footsteps += 1;
    }
    player.crouched = crouched;

    // Detection: any guard with eyes on the thief fills the meter; darkness and
    // crouching buy time, and breaking line of sight lets it drain again.
    let seen = false;
    for (const guard of state.guards) {
      if (guardSeesPlayer(guard)) {
        seen = true;
        break;
      }
    }
    if (seen) {
      let rate = DETECTION.risePerSecond;
      const nearest = Math.min(...state.guards.map((g) => Math.hypot(g.x - player.x, g.y - player.y)));
      if (nearest < DETECTION.closeDistance) rate *= DETECTION.closeMultiplier;
      if (crouched) rate *= DETECTION.crouchMultiplier;
      if (inShadow(player.x, player.y)) rate *= DETECTION.shadowMultiplier;
      const before = state.detection;
      state.detection = Math.min(1, state.detection + rate * dt);
      if (before < DETECTION.warnThreshold && state.detection >= DETECTION.warnThreshold) events |= EVENT_SPOTTED;
    } else {
      state.detection = Math.max(0, state.detection - DETECTION.decayPerSecond * dt);
    }

    if (state.detection >= 1 && !state.alarm) {
      state.alarm = true;
      state.alarmLeft = DETECTION.alarmSeconds;
      for (const guard of state.guards) {
        guard.chasing = true;
        guard.chaseLeft = DETECTION.alarmSeconds;
      }
      events |= EVENT_ALARM;
    }

    for (const guard of state.guards) {
      if (guard.chasing) {
        guard.chaseLeft -= dt;
        if (guard.chaseLeft <= 0) guard.chasing = false;
      }
      moveGuard(guard, dt, guard.chasing);
      if (Math.hypot(guard.x - player.x, guard.y - player.y) < GUARD.catchDistance) {
        state.caught = true;
        return events | EVENT_CAUGHT;
      }
    }
    if (state.alarm) {
      state.alarmLeft -= dt;
      if (state.alarmLeft <= 0) state.alarm = false;
    }

    const level = LEVELS[state.levelIndex];
    if (!state.stolen && Math.hypot(player.x - level.artifact.x, player.y - level.artifact.y) < PLAYER.grabRadius) {
      state.stolen = true;
      events |= EVENT_STOLEN;
    }
    if (state.stolen && Math.hypot(player.x - level.exit.x, player.y - level.exit.y) < PLAYER.exitRadius) {
      state.cleared = true;
      return events | EVENT_LEVEL_CLEAR;
    }
    return events;
  }

  loadLevel(0);
  return world;
}

export { STEP };
