import { subversionRandom } from "@/utils/base";
import { brandRandom } from "@/utils/equipment";
import { debounce } from "@/utils/timer";

// 
// --- notification ---
// 
const notifyPool = new Map<string, number>()

export const notify = (key: string) => {
  const count = notifyPool.get(key) ?? 0
  notifyPool.set(key, count + 1)
  notifyContent()
}

const notifyContent = debounce(() => {
  // sendContentMessage(window.top ?? window, {
  //   type: MContentType.SetHookRecords,
  //   data: Object.fromEntries(hookRecords),
  // }, '*')
})

// // record缓存
// const hookRecords: Map<string, number> = new Map()

// /**
//  * 发送record消息
//  */
// export const sendRecordMessage = debounce(() => {
//   sendContentMessage(window.top ?? window, {
//     type: MContentType.SetHookRecords,
//     data: Object.fromEntries(hookRecords),
//   }, '*')
// })

// /**
//  * 记录并发送消息
//  */
// export const recordHook = function (key: string) {
//   const parts = key.split('.')
//   key = parts[parts.length - 1]
//   const oldValue = hookRecords.get(key) ?? 0
//   hookRecords.set(key, oldValue + 1)
//   sendRecordMessage()
// }

// export const recordHookDebounce = debounceByFirstArg(recordHook, 200)


// 
// --- other ---
// 

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

/**
 * 在2d画布绘制噪音
 */
export const drawNoise = (
  rawFunc: typeof CanvasRenderingContext2D.prototype.getImageData,
  noise: number[],
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, sw: number, sh: number, settings?: ImageDataSettings
) => {
  const imageData = rawFunc.call(ctx, sx, sy, sw, sh, settings)

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

/**
 * 代理UserAgentData
 */
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

/**
 * 在webgl上下文绘制噪音点
 * @param noisePosition 区间[-1, 1]
 */
export const drawNoiseToWebgl = (gl: WebGLRenderingContext | WebGL2RenderingContext, noisePosition: [number, number]) => {
  const vertexShaderSource = `attribute vec4 noise;void main() {gl_Position = noise;gl_PointSize = 0.001;}`;
  const fragmentShaderSource = `void main() {gl_FragColor = vec4(0.0, 0.0, 0.0, 0.01);}`;

  const createShader = (gl: WebGLRenderingContext | WebGL2RenderingContext, type: GLenum, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positions = new Float32Array(noisePosition);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const noise = gl.getAttribLocation(program, 'noise');
  gl.enableVertexAttribArray(noise);
  gl.vertexAttribPointer(noise, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.POINTS, 0, 1);
}

/**
 * 获取属性
 */
export const getOwnProperties = (src: any): HookOwnProperties => ({
  names: Object.getOwnPropertyNames(src),
  symbols: Object.getOwnPropertySymbols(src),
  descriptors: Object.getOwnPropertyDescriptors(src),
  keys: Reflect.ownKeys(src),
})