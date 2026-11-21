// Everything the player sees: the night gallery drawn by hand on one canvas — floor
// tiles, shadow pools, walls, display cases, statues and plants, the guards with their
// vision cones clipped by cover, the thief, the exhibit and the exit — plus the HUD
// (level, detection meter, objective) and the title, pause, caught, clear and win screens.
import { COLORS, GUARD, WORLD_HEIGHT, WORLD_WIDTH } from './config.js';
import { LEVELS } from './levels.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_WIN = 'win';

const CONE_RAYS = 26;

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');

  function fitCanvas() {
    const scale = Math.min(window.innerWidth / WORLD_WIDTH, window.innerHeight / WORLD_HEIGHT);
    canvas.width = WORLD_WIDTH;
    canvas.height = WORLD_HEIGHT;
    canvas.style.width = `${Math.floor(WORLD_WIDTH * scale)}px`;
    canvas.style.height = `${Math.floor(WORLD_HEIGHT * scale)}px`;
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  function drawFloor() {
    context.fillStyle = COLORS.floor;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.fillStyle = COLORS.floorTile;
    const tile = 64;
    for (let y = 0; y < WORLD_HEIGHT; y += tile) {
      for (let x = 0; x < WORLD_WIDTH; x += tile) {
        if (((x + y) / tile) % 2 === 0) context.fillRect(x, y, tile, tile);
      }
    }
    context.strokeStyle = COLORS.floorEdge;
    context.lineWidth = 1;
    for (let x = 0; x <= WORLD_WIDTH; x += tile) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, WORLD_HEIGHT);
      context.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += tile) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
      context.stroke();
    }
  }

  function drawShadows(level) {
    for (const zone of level.shadows) {
      context.fillStyle = COLORS.shadowZone;
      context.globalAlpha = 0.55;
      context.fillRect(zone.x, zone.y, zone.w, zone.h);
      context.globalAlpha = 1;
      context.strokeStyle = 'rgba(150, 140, 200, 0.25)';
      context.setLineDash([6, 6]);
      context.strokeRect(zone.x, zone.y, zone.w, zone.h);
      context.setLineDash([]);
      context.fillStyle = 'rgba(190, 180, 230, 0.55)';
      context.font = '12px sans-serif';
      context.fillText('DARK — hard to spot here', zone.x + 10, zone.y + 20);
    }
  }

  function drawCover(level) {
    for (const item of level.cover) {
      if (item.kind === 'case') {
        context.fillStyle = COLORS.coverCase;
        context.fillRect(item.x, item.y, item.w, item.h);
        context.fillStyle = COLORS.coverCaseTop;
        context.fillRect(item.x + 5, item.y + 5, item.w - 10, item.h - 10);
        context.fillStyle = 'rgba(255, 255, 255, 0.18)';
        context.fillRect(item.x + 8, item.y + 8, item.w - 16, 10);
      } else if (item.kind === 'statue') {
        context.fillStyle = COLORS.statue;
        context.beginPath();
        context.arc(item.x + item.w / 2, item.y + item.h / 2, item.w / 2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = COLORS.statueTop;
        context.beginPath();
        context.arc(item.x + item.w / 2, item.y + item.h / 2, item.w / 2 - 8, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = COLORS.plant;
        context.beginPath();
        context.arc(item.x + item.w / 2, item.y + item.h / 2, item.w / 2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = COLORS.plantTop;
        context.beginPath();
        context.arc(item.x + item.w / 2 - 6, item.y + item.h / 2 - 6, item.w / 4, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = 'rgba(240, 230, 210, 0.75)';
      context.font = '11px sans-serif';
      context.textAlign = 'center';
      context.fillText(item.label, item.x + item.w / 2, item.y + item.h + 14);
      context.textAlign = 'left';
    }
  }

  function drawWalls(level) {
    for (const wall of level.walls) {
      context.fillStyle = COLORS.wall;
      context.fillRect(wall.x, wall.y, wall.w, wall.h);
      context.fillStyle = COLORS.wallTop;
      if (wall.w > wall.h) context.fillRect(wall.x, wall.y, wall.w, 5);
      else context.fillRect(wall.x, wall.y, 5, wall.h);
    }
  }

  function drawCone(world, guard) {
    const level = LEVELS[world.state.levelIndex];
    const viewDistance = GUARD.viewDistance * level.viewDistanceScale;
    const halfAngle = GUARD.viewHalfAngle * level.viewAngleScale;
    const sees = world.guardSeesPlayer(guard);
    context.beginPath();
    context.moveTo(guard.x, guard.y);
    for (let i = 0; i <= CONE_RAYS; i += 1) {
      const angle = guard.angle - halfAngle + (2 * halfAngle * i) / CONE_RAYS;
      const distance = world.rayDistance(guard.x, guard.y, angle, viewDistance);
      context.lineTo(guard.x + Math.cos(angle) * distance, guard.y + Math.sin(angle) * distance);
    }
    context.closePath();
    context.fillStyle = guard.chasing || sees ? COLORS.coneAlert : COLORS.cone;
    context.fill();
  }

  function drawPatrolPath(guard) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    context.setLineDash([4, 8]);
    context.beginPath();
    const points = guard.waypoints;
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) context.lineTo(points[i].x, points[i].y);
    context.closePath();
    context.stroke();
    context.setLineDash([]);
  }

  function drawGuard(guard) {
    context.fillStyle = guard.chasing ? COLORS.guardChase : COLORS.guard;
    context.beginPath();
    context.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#2b0d08';
    context.lineWidth = 2;
    context.stroke();
    // Facing tick and helmet brim.
    context.strokeStyle = '#ffd9c9';
    context.beginPath();
    context.moveTo(guard.x, guard.y);
    context.lineTo(guard.x + Math.cos(guard.angle) * (GUARD.radius + 8), guard.y + Math.sin(guard.angle) * (GUARD.radius + 8));
    context.stroke();
    context.fillStyle = '#ffffff';
    context.font = 'bold 15px sans-serif';
    context.textAlign = 'center';
    context.fillText(guard.chasing ? '!' : 'G', guard.x, guard.y + 5);
    context.textAlign = 'left';
  }

  function drawPlayer(state) {
    const player = state.player;
    const inShadow = state.inShadowNow;
    context.fillStyle = 'rgba(0, 0, 0, 0.35)';
    context.beginPath();
    context.ellipse(player.x, player.y + 10, 14, 6, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = player.crouched ? COLORS.playerCrouch : COLORS.player;
    context.beginPath();
    context.arc(player.x, player.y, player.crouched ? 11 : 13, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#3a2a08';
    context.lineWidth = 2;
    context.stroke();
    // Hood point and facing tick.
    context.fillStyle = '#3a2a08';
    context.beginPath();
    context.moveTo(player.x + Math.cos(player.angle) * 16, player.y + Math.sin(player.angle) * 16);
    context.lineTo(
      player.x + Math.cos(player.angle + 2.5) * 9,
      player.y + Math.sin(player.angle + 2.5) * 9,
    );
    context.lineTo(
      player.x + Math.cos(player.angle - 2.5) * 9,
      player.y + Math.sin(player.angle - 2.5) * 9,
    );
    context.closePath();
    context.fill();
    if (inShadow) {
      context.fillStyle = 'rgba(190, 180, 230, 0.9)';
      context.font = '11px sans-serif';
      context.textAlign = 'center';
      context.fillText('hidden in shadow', player.x, player.y - 20);
      context.textAlign = 'left';
    }
  }

  function drawArtifact(level, state, time) {
    if (state.stolen) return;
    const pulse = 1 + 0.12 * Math.sin(time * 3);
    const { x, y } = level.artifact;
    context.save();
    context.shadowColor = COLORS.artifactGlow;
    context.shadowBlur = 22;
    context.fillStyle = COLORS.artifact;
    context.beginPath();
    context.moveTo(x, y - 16 * pulse);
    context.lineTo(x + 12 * pulse, y);
    context.lineTo(x, y + 16 * pulse);
    context.lineTo(x - 12 * pulse, y);
    context.closePath();
    context.fill();
    context.restore();
    context.fillStyle = COLORS.hudText;
    context.font = 'bold 13px sans-serif';
    context.textAlign = 'center';
    context.fillText(level.artifact.label, x, y - 26);
    context.textAlign = 'left';
  }

  function drawExit(level, state, time) {
    const { x, y } = level.exit;
    const glow = 0.5 + 0.3 * Math.sin(time * 2.5);
    context.save();
    context.globalAlpha = glow;
    context.fillStyle = COLORS.exitGlow;
    context.fillRect(x - 34, y - 34, 68, 68);
    context.restore();
    context.fillStyle = COLORS.exit;
    context.fillRect(x - 26, y - 26, 52, 52);
    context.fillStyle = '#0d2b18';
    context.font = 'bold 13px sans-serif';
    context.textAlign = 'center';
    context.fillText('EXIT', x, y + 5);
    context.fillStyle = COLORS.hudText;
    context.font = '12px sans-serif';
    context.fillText(state.stolen ? 'Escape!' : level.exit.label, x, y - 40);
    context.textAlign = 'left';
  }

  function drawHud(state, screen, muted) {
    const level = LEVELS[state.levelIndex];
    context.fillStyle = 'rgba(10, 8, 14, 0.72)';
    context.fillRect(0, 0, WORLD_WIDTH, 44);
    context.fillStyle = COLORS.hudText;
    context.font = 'bold 17px sans-serif';
    context.fillText(level.name, 16, 28);
    context.font = '13px sans-serif';
    context.fillStyle = COLORS.hudDim;
    const objective = state.stolen
      ? 'Got it! Reach the EXIT unseen.'
      : `Steal ${level.artifact.label}, then reach the EXIT.`;
    context.fillText(objective, 330, 28);

    // Detection meter.
    const barX = 880;
    const barWidth = 260;
    context.fillStyle = '#3a2a28';
    context.fillRect(barX, 14, barWidth, 16);
    const fill = state.detection * barWidth;
    context.fillStyle = state.detection >= 0.55 ? '#ff5040' : state.detection > 0 ? '#ffb13a' : '#3fae6a';
    context.fillRect(barX, 14, fill, 16);
    context.strokeStyle = COLORS.hudText;
    context.strokeRect(barX, 14, barWidth, 16);
    context.fillStyle = COLORS.hudText;
    context.font = 'bold 12px sans-serif';
    context.fillText(state.alarm ? 'ALARM!' : state.detection > 0 ? 'SEEN' : 'UNSEEN', barX - 62, 27);
    context.fillText(muted ? 'M — muted' : 'M — sound on', 1160, 27);
    if (screen === SCREEN_PLAY) {
      context.fillStyle = COLORS.hudDim;
      context.font = '12px sans-serif';
      context.fillText('WASD / arrows — move · Shift — crouch · R — restart level · P — pause', 16, WORLD_HEIGHT - 12);
    }
  }

  function drawAlarmVignette(state) {
    if (!state.alarm) return;
    const gradient = context.createRadialGradient(
      WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_HEIGHT * 0.3,
      WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_HEIGHT * 0.75,
    );
    gradient.addColorStop(0, 'rgba(255, 40, 30, 0)');
    gradient.addColorStop(1, 'rgba(255, 40, 30, 0.35)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.fillStyle = '#ff6a5a';
    context.font = 'bold 26px sans-serif';
    context.textAlign = 'center';
    context.fillText('ALARM — RUN!', WORLD_WIDTH / 2, 84);
    context.textAlign = 'left';
  }

  function overlay(title, lines, accent) {
    context.fillStyle = 'rgba(8, 6, 12, 0.78)';
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.fillStyle = accent;
    context.font = 'bold 52px sans-serif';
    context.textAlign = 'center';
    context.fillText(title, WORLD_WIDTH / 2, 250);
    context.fillStyle = COLORS.hudText;
    context.font = '19px sans-serif';
    lines.forEach((line, i) => {
      context.fillText(line, WORLD_WIDTH / 2, 310 + i * 32);
    });
    context.textAlign = 'left';
  }

  function drawTitle(state) {
    overlay('THE QUIET GALLERY', [
      'A thief. A museum after dark. Guards with lanterns and long memories.',
      'Steal the exhibit, slip past the patrols, and reach the green EXIT unseen.',
      '',
      'WASD / arrows — move · Shift — crouch in the dark · R — restart · P — pause',
      '',
      'Press Space or click to begin — Level 1: The Marble Hall',
    ], COLORS.artifact);
  }

  function drawPaused() {
    overlay('PAUSED', ['Take a breath. The guards wait for no one — except now.', '', 'Press P or Space to keep sneaking.'], COLORS.hudText);
  }

  function drawCaught() {
    overlay('CAUGHT!', ['A lantern swung your way and the hall woke up.', 'The exhibit stays where it is. For now.', '', 'Press R to try this level again.'], '#ff6a5a');
  }

  function drawClear(state) {
    const level = LEVELS[state.levelIndex];
    overlay('CLEAN GETAWAY', [
      `${level.artifact.label} is yours, and no one saw a thing.`,
      '',
      state.levelIndex + 1 < LEVELS.length ? 'Press Space for the next gallery.' : 'Press Space to see how it ends.',
    ], COLORS.exitGlow);
  }

  function drawWin(best) {
    overlay('THE QUIET GALLERY — COMPLETE', [
      'Three exhibits. Three galleries. Not one guard the wiser.',
      'The museum will notice by morning. You will be long gone.',
      '',
      `Best run: reached Level ${Math.max(1, best)} · Press Space to play again.`,
    ], COLORS.artifact);
  }

  function draw(state, world, screen, best, muted) {
    const level = LEVELS[state.levelIndex];
    state.inShadowNow = world.inShadow(state.player.x, state.player.y);
    drawFloor();
    drawShadows(level);
    for (const guard of state.guards) drawPatrolPath(guard);
    drawWalls(level);
    drawCover(level);
    drawArtifact(level, state, state.time);
    drawExit(level, state, state.time);
    for (const guard of state.guards) drawCone(world, guard);
    for (const guard of state.guards) drawGuard(guard);
    drawPlayer(state);
    drawAlarmVignette(state);
    drawHud(state, screen, muted);
    if (screen === SCREEN_TITLE) drawTitle(state);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_CAUGHT) drawCaught();
    else if (screen === SCREEN_CLEAR) drawClear(state);
    else if (screen === SCREEN_WIN) drawWin(best);
  }

  return { draw, fitCanvas };
}
