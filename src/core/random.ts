/** A source of numbers in [0, 1). Randomness is always passed in and seeded, so every run can be repeated. */
export type Random = () => number;

/**
 * Dart's `Random(seed)` (the VM's multiply-with-carry generator, 64-bit state), so a seed gives the same run
 * as the Flutter original.
 */
export function seededRandom(seed: number): Random {
  let state = seedState(BigInt(seed));
  const nextState = () => {
    state = BigInt.asUintN(64, 0xffffda61n * (state & 0xffffffffn) + (state >> 32n));
  };
  const nextInt = (max: number): number => {
    if ((max & -max) === max) {
      nextState();
      return Number(state & 0xffffffffn) & (max - 1);
    }
    let rnd32: number;
    let result: number;
    do {
      nextState();
      rnd32 = Number(state & 0xffffffffn);
      result = rnd32 % max;
    } while (rnd32 - result + max > 2 ** 32);
    return result;
  };
  for (let i = 0; i < 4; i++) nextState();
  return () => (nextInt(1 << 26) * 2 ** 27 + nextInt(1 << 27)) / 2 ** 53;
}

/** Dart's `_setupSeed`: Thomas Wang's 64-bit integer mix. */
function seedState(seed: bigint): bigint {
  let n = BigInt.asUintN(64, seed);
  n = BigInt.asUintN(64, ~n + (n << 21n));
  n ^= n >> 24n;
  n = BigInt.asUintN(64, n * 265n);
  n ^= n >> 14n;
  n = BigInt.asUintN(64, n * 21n);
  n ^= n >> 28n;
  n = BigInt.asUintN(64, n + (n << 31n));
  return n === 0n ? 0x5a17n : n;
}

/** A copy of `items` in a random order (Fisher-Yates). */
export function shuffled<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
