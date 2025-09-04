import { hashNumberFromString, seededRandom, subversionRandom } from "@/utils/base";
import { brandRandom } from "@/utils/equipment";
import { sendToWindow } from "@/utils/message";
import { debounce } from "@/utils/timer";

// 
// --- notification ---
// 
let fpNoticePool: Record<string, number> = {}
let iframeNoticePool: Record<string, number> = {}

/**
 * 记录指纹数量
 */
export const notify = (key: string) => {
  fpNoticePool[key] = (fpNoticePool[key] ?? 0) + 1
  sendFpRecord()
}

const sendFpRecord = debounce(() => {
  sendToWindow(window.top ?? window, {
    type: 'notice.push.fp',
    data: fpNoticePool,
  })
  fpNoticePool = {}
})

/**
 * 记录iframe数量
 */
export const notifyIframeOrigin = (key?: string) => {
  if (!key || key === 'null') key = 'about:blank';
  iframeNoticePool[key] = (iframeNoticePool[key] ?? 0) + 1
  sendIframeRecord()
}

const sendIframeRecord = debounce(() => {
  sendToWindow(window.top ?? window, {
    type: 'notice.push.iframe',
    data: iframeNoticePool,
  })
  iframeNoticePool = {}
})

// 
// --- random ---
// 

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

/**
 * 获取随机屏幕尺寸
 */
export const randomScreenSize = (screen: Screen, seed: number) => {
  const offset = Math.round(seededRandom(seed, 100, -100))
  const ratio = screen.width / screen.height;

  let width: number
  let height: number
  if (screen.width >= screen.height) {
    // 偏移宽度
    width = screen.width + offset;
    height = Math.round(width / ratio);
  } else {
    // 偏移高度
    height = screen.height + offset;
    width = Math.round(height * ratio);
  }

  return { width, height };
}


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

  const Arr = Uint8ClampedArray;
  const center = new Arr(4)
  const up = new Arr(4)
  const down = new Arr(4)
  const left = new Arr(4)
  const right = new Arr(4)

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