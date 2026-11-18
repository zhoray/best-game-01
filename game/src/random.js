function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const rng = mulberry32(seed);
  return {
    next() {
      return rng();
    },
    range(a, b) {
      return a + (b - a) * this.next();
    },
    int(a, b) {
      return Math.floor(this.range(a, b));
    },
    pick(array) {
      return array[this.int(0, array.length)];
    },
    chance(p) {
      return this.next() < p;
    }
  };
}
