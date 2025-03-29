import { hashNumberFromString, seededRandom } from "./base"

/**
 * 随机canvas噪音
 */
export const randomCanvasNoise = (seed: number) => {
  const noise: number[] = []
  for (let i = 0; i < 10; i++) {
    noise.push(Math.floor(seededRandom(seed++, 255, 0)))
  }
  return noise
}

/**
 * 获取[x, y]，区间[-1, 1]
 */
export const randomWebglNoise = (seed: number): [number, number] => {
  return [seededRandom(seed, 1, -1), seededRandom(seed + 1, 1, -1)]
}

/**
 * 获取随机字体噪音
 */
export const randomFontNoise = (seed: number, mark: string): number => {
  const random = seededRandom((seed + hashNumberFromString(mark)) % Number.MAX_SAFE_INTEGER, 3, 0)
  if ((random * 10) % 1 < 0.9) return 0;
  return Math.floor(random) - 1;
}