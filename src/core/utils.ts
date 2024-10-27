import { subversionRandom } from "@/utils/base";
import { brandRandom } from "@/utils/equipment";

type U8Array = Uint8ClampedArray | Uint8Array;

const isPixelEqual = (p1: U8Array, p2: U8Array) => {
  return p1[0] === p2[0] && p1[1] === p2[1] && p1[2] === p2[2] && p1[3] === p2[3];
}

const pixelCopy = (src: U8Array, dst: U8Array, index: number) => {
  dst[0] = src[index]
  dst[1] = src[index + 1]
  dst[2] = src[index + 2]
  dst[3] = src[index + 3]
}

export const drawNoise = (
  rawFunc: typeof CanvasRenderingContext2D.prototype.getImageData,
  noise_str: string,
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, sw: number, sh: number, settings?: ImageDataSettings
) => {
  const imageData = rawFunc.call(ctx, sx, sy, sw, sh, settings)
  const noise = noise_str.split('').map(v => v.charCodeAt(0));

  let noiseIndex = 0;
  let isChanged = false

  const center = new Uint8ClampedArray(4)
  const up = new Uint8ClampedArray(4)
  const down = new Uint8ClampedArray(4)
  const left = new Uint8ClampedArray(4)
  const right = new Uint8ClampedArray(4)

  const pixelData = imageData.data

  outer: for (let row = 1; row < sh - 2; row += 2) {
    for (let col = 1; col < sw - 2; col += 2) {
      if (noise.length === noiseIndex) { break outer; }

      const index = (row * sw + col) * 4;
      pixelCopy(pixelData, center, index)

      pixelCopy(pixelData, up, ((row - 1) * sw + col) * 4)
      if (isPixelEqual(center, up)) continue;

      pixelCopy(pixelData, down, ((row + 1) * sw + col) * 4)
      if (isPixelEqual(center, down)) continue;

      pixelCopy(pixelData, left, (row * sw + (col - 1)) * 4)
      if (isPixelEqual(center, left)) continue;

      pixelCopy(pixelData, right, (row * sw + (col + 1)) * 4)
      if (isPixelEqual(center, right)) continue;

      pixelData[index + 3] = (noise[noiseIndex++] % 256)
      isChanged = true
    }
  }

  if (isChanged) {
    ctx.putImageData(imageData, sx, sy)
  }

  return imageData
}


export const proxyUserAgentData = (seed: number, userAgentData?: any) => {
  if (!userAgentData) return;

  return new Proxy(userAgentData, {
    get: (target, key) => {
      switch (key) {
        case 'brands': {
          const raw: Brand[] = target[key]
          const brands: Brand[] = raw?.map?.((brand: Brand) => brandRandom(seed, brand))
          return brands ?? raw
        }
        case 'toJSON': {
          const raw: () => NavigatorUADataAttr = target[key]
          return !raw ? raw : new Proxy(raw.bind(target), {
            apply: (target, thisArg, args: Parameters<typeof raw>) => {
              const rawRes = target.apply(thisArg, args)
              const brands = rawRes?.brands?.map?.((brand: Brand) => brandRandom(seed, brand))
              return brands ?? rawRes
            }
          })
        }
        case 'getHighEntropyValues': {
          const raw: (opt?: string[]) => Promise<HighEntropyValuesAttr> = target[key]
          return !raw ? raw : new Proxy(raw.bind(target), {
            apply: (target, thisArg, args: Parameters<typeof raw>) => {
              return target.apply(thisArg, args)?.then((data) => {
                if (!data) return data;
                return {
                  ...data,
                  brands: data.brands?.map?.((brand) => brandRandom(seed, brand)),
                  fullVersionList: data.fullVersionList?.map?.((brand) => brandRandom(seed, brand)),
                  uaFullVersion: data.uaFullVersion && subversionRandom(seed, data.uaFullVersion).full,
                }
              })
            }
          })
        }
      }

      const value = target[key]
      return typeof value === 'function' ? value.bind(target) : value
    }
  })
}