// A tiny seeded random generator (mulberry32) so a ?seed=N run is reproducible:
// the same seed always builds the same patrol jitter and the same shot frames.
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from the seeded stream. */
export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
