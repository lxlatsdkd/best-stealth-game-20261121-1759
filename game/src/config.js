// Shared constants for The Quiet Gallery: a top-down stealth game in a museum at night.
// All sizes are in world pixels; the world is a fixed 1280 x 720 gallery floor.
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const STEP = 1 / 60;
export const BEST_KEY = 'quiet-gallery-best-level';

export const PLAYER = {
  radius: 13,
  walkSpeed: 170,
  crouchSpeed: 95,
  grabRadius: 30,
  exitRadius: 34,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 150,
  viewDistance: 235,
  viewHalfAngle: 0.61, // ~35 degrees each side
  catchDistance: 26,
};

export const DETECTION = {
  risePerSecond: 1.15,
  closeMultiplier: 1.7,
  closeDistance: 130,
  crouchMultiplier: 0.45,
  shadowMultiplier: 0.4,
  decayPerSecond: 0.55,
  alarmSeconds: 6,
  warnThreshold: 0.55,
};

// Palette: night gallery, warm pools of light on a dark marble floor.
export const COLORS = {
  floor: '#23202b',
  floorTile: '#2a2733',
  floorEdge: '#17141d',
  wall: '#4a4238',
  wallTop: '#6b5f4e',
  coverCase: '#3d5a66',
  coverCaseTop: '#5d8291',
  statue: '#8a8378',
  statueTop: '#b0a894',
  plant: '#2e5233',
  plantTop: '#4a7a45',
  shadowZone: '#14121c',
  artifact: '#ffd76a',
  artifactGlow: '#ffedb0',
  exit: '#3fae6a',
  exitGlow: '#7be3a2',
  player: '#e8b23a',
  playerCrouch: '#c98f2e',
  guard: '#c94f42',
  guardChase: '#ff5a3c',
  cone: 'rgba(255, 214, 110, 0.20)',
  coneAlert: 'rgba(255, 80, 60, 0.28)',
  hudText: '#f2ead8',
  hudDim: '#b9ac93',
};
