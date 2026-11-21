// The three gallery floors. Each level is plain data: walls and cover block movement and
// sight, shadow zones slow detection, guards walk their waypoint loop, and the thief must
// reach the exhibit, then the exit, unseen.
//
// Rects are {x, y, w, h}. Walls are tall partitions; cover is display cases, statues and
// plants — low enough to read at a glance, tall enough to hide behind.
import { WORLD_HEIGHT, WORLD_WIDTH } from './config.js';

function borderWalls() {
  const t = 24;
  return [
    { x: 0, y: 0, w: WORLD_WIDTH, h: t },
    { x: 0, y: WORLD_HEIGHT - t, w: WORLD_WIDTH, h: t },
    { x: 0, y: 0, w: t, h: WORLD_HEIGHT },
    { x: WORLD_WIDTH - t, y: 0, w: t, h: WORLD_HEIGHT },
  ];
}

function guard(waypoints, pauseSeconds = 1.2) {
  return { waypoints, pauseSeconds };
}

export const LEVELS = [
  {
    name: 'Level 1 — The Marble Hall',
    subtitle: 'Two guards. Learn the patrols, mind the light.',
    playerStart: { x: 90, y: 640 },
    artifact: { x: 640, y: 120, label: 'The Jade Fox' },
    exit: { x: 1190, y: 640, label: 'Service Door' },
    viewDistanceScale: 0.9,
    viewAngleScale: 0.9,
    walls: [
      ...borderWalls(),
      { x: 560, y: 24, w: 26, h: 330 },
      { x: 700, y: 430, w: 380, h: 26 },
      { x: 300, y: 480, w: 26, h: 216 },
    ],
    cover: [
      { x: 180, y: 130, w: 150, h: 60, kind: 'case', label: 'Porcelain' },
      { x: 900, y: 130, w: 150, h: 60, kind: 'case', label: 'Bronze Age' },
      { x: 610, y: 300, w: 70, h: 70, kind: 'statue', label: 'Marble Horse' },
      { x: 820, y: 520, w: 70, h: 70, kind: 'statue', label: 'Stone Owl' },
      { x: 60, y: 300, w: 56, h: 56, kind: 'plant', label: 'Fern' },
      { x: 1160, y: 300, w: 56, h: 56, kind: 'plant', label: 'Fern' },
      { x: 420, y: 560, w: 150, h: 60, kind: 'case', label: 'Silk Scrolls' },
    ],
    shadows: [
      { x: 40, y: 40, w: 200, h: 150 },
      { x: 1040, y: 500, w: 200, h: 170 },
    ],
    guards: [
      guard([
        { x: 400, y: 150 }, { x: 400, y: 420 }, { x: 180, y: 420 }, { x: 180, y: 150 },
      ]),
      guard([
        { x: 900, y: 250 }, { x: 1130, y: 250 }, { x: 1130, y: 560 }, { x: 900, y: 560 },
      ]),
    ],
  },
  {
    name: 'Level 2 — The East Wing',
    subtitle: 'Three guards, wider eyes. The shadows are your friends.',
    playerStart: { x: 90, y: 90 },
    artifact: { x: 640, y: 600, label: 'The Star Sapphire' },
    exit: { x: 1190, y: 90, label: 'Service Door' },
    viewDistanceScale: 1.0,
    viewAngleScale: 1.0,
    walls: [
      ...borderWalls(),
      { x: 400, y: 24, w: 26, h: 300 },
      { x: 850, y: 380, w: 26, h: 316 },
      { x: 500, y: 380, w: 280, h: 26 },
      { x: 100, y: 380, w: 200, h: 26 },
    ],
    cover: [
      { x: 180, y: 480, w: 150, h: 60, kind: 'case', label: 'Roman Glass' },
      { x: 980, y: 120, w: 150, h: 60, kind: 'case', label: 'Gold Masks' },
      { x: 610, y: 130, w: 70, h: 70, kind: 'statue', label: 'Bronze Dancer' },
      { x: 480, y: 500, w: 70, h: 70, kind: 'statue', label: 'Stone Lion' },
      { x: 1160, y: 480, w: 56, h: 56, kind: 'plant', label: 'Fern' },
      { x: 60, y: 560, w: 56, h: 56, kind: 'plant', label: 'Fern' },
    ],
    shadows: [
      { x: 1040, y: 40, w: 200, h: 150 },
      { x: 40, y: 520, w: 180, h: 160 },
      { x: 560, y: 240, w: 180, h: 120 },
    ],
    guards: [
      guard([
        { x: 250, y: 180 }, { x: 250, y: 600 }, { x: 500, y: 600 }, { x: 500, y: 180 },
      ]),
      guard([
        { x: 700, y: 120 }, { x: 1050, y: 120 }, { x: 1050, y: 300 }, { x: 700, y: 300 },
      ], 0.8),
      guard([
        { x: 950, y: 480 }, { x: 700, y: 480 }, { x: 700, y: 640 }, { x: 950, y: 640 },
      ]),
    ],
  },
  {
    name: 'Level 3 — The Grand Gallery',
    subtitle: 'Four guards, long sightlines. One mistake and the hall wakes.',
    playerStart: { x: 640, y: 650 },
    artifact: { x: 640, y: 90, label: 'The Moon Pearl' },
    exit: { x: 90, y: 90, label: 'Service Door' },
    viewDistanceScale: 1.15,
    viewAngleScale: 1.1,
    walls: [
      ...borderWalls(),
      { x: 300, y: 24, w: 26, h: 260 },
      { x: 950, y: 24, w: 26, h: 260 },
      { x: 300, y: 430, w: 26, h: 266 },
      { x: 950, y: 430, w: 26, h: 266 },
    ],
    cover: [
      { x: 430, y: 150, w: 150, h: 60, kind: 'case', label: 'Ivory Carvings' },
      { x: 700, y: 150, w: 150, h: 60, kind: 'case', label: 'Jade Armour' },
      { x: 610, y: 350, w: 70, h: 70, kind: 'statue', label: 'The Watcher' },
      { x: 430, y: 500, w: 150, h: 60, kind: 'case', label: 'Ancient Coins' },
      { x: 700, y: 500, w: 150, h: 60, kind: 'case', label: 'Silk Tapestry' },
    ],
    shadows: [
      { x: 40, y: 40, w: 170, h: 140 },
      { x: 1070, y: 40, w: 170, h: 140 },
      { x: 40, y: 540, w: 170, h: 140 },
    ],
    guards: [
      guard([
        { x: 180, y: 180 }, { x: 180, y: 540 }, { x: 480, y: 540 }, { x: 480, y: 180 },
      ], 0.7),
      guard([
        { x: 800, y: 180 }, { x: 1100, y: 180 }, { x: 1100, y: 540 }, { x: 800, y: 540 },
      ], 0.7),
      guard([
        { x: 500, y: 330 }, { x: 780, y: 330 },
      ], 1.6),
      guard([
        { x: 640, y: 220 }, { x: 640, y: 480 },
      ], 1.6),
    ],
  },
];
