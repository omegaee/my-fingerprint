/** 日志输出 */

// #region log level and style

// 保留副本，避免被网站清空
const log = console.log;
const warn = console.warn;
const error = console.error;

/** 日志等级。数字越大，等级越高，输出的日志越少。
 *
 * 注意日志等级顺序固定，方便后续过滤日志。
 *
 * 比如设置日志等级为 INFO，则 DEBUG 级别的日志不会输出，INFO 及以上级别的日志会输出。
 *
 */
export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  /** 不输出任何日志 */
  NONE,
}

/** 输出日志时的 css style */
const LogStyle: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "color: #bc64a4", // 若紫
  [LogLevel.INFO]: "color: #ff8936", // 橘黄
  [LogLevel.WARN]: "color: #f2be45", // 赤金
  [LogLevel.ERROR]: "color: #cb3a56", // 茜色
  [LogLevel.NONE]: "", // 不输出日志时不需要样式
};

// #endregion

// #region script scope

type ScriptScope =
  | "Window"
  | "IFrame"
  | "Worker"
  | "SharedWorker"
  | "ServiceWorker";

const ScopeMap: Record<string, ScriptScope> = {
  Window: "Window",
  DedicatedWorkerGlobalScope: "Worker",
  SharedWorkerGlobalScope: "SharedWorker",
  ServiceWorkerGlobalScope: "ServiceWorker",
};

/** 获取当前脚本所在的作用域。
 *
 * 因为脚本会注入到网站的不同上下文中，如 worker 等等，需要标识它们，以便区分日志来源。
 */
function getScriptScope(global: any = globalThis): ScriptScope {
  const name = Reflect.get(global, Symbol.toStringTag);
  if (!name) {
    return "Window";
  }

  let scope = ScopeMap[name];
  // @ts-ignore
  if (scope === "Window" && global !== global.top) {
    scope = "IFrame";
  }

  return scope;
}

// #endregion

/** 日志输出。
 *
 * 可以每一个文件都有独自的 Logger 实例，设置其前缀为文件的路径，
 *
 * 以便区分日志来源，方便后续排查问题。
 */
class Logger {
  /** 当前日志等级 */
  private level: LogLevel;
  /** 日志前缀，用于区分不同功能 */
  private readonly prefix: string;
  private static readonly extensionName = "my-fingerprint";
  /** 输出插件名称、prefix 的样式，青碧色 */
  private static readonly prefixStyle = "color: #48c0a3";
  /** 输出时间戳时的样式 */
  private static readonly timestampStyle = "color: #aaa";
  /** 输出脚本所在作用域的样式，竹青色 */
  private static readonly scopeStyle = "color: #789262";
  /** 当前脚本所在的作用域 */
  private scope = getScriptScope();
  /** 不同日志等级使用对应的日志输出方法 */
  private static readonly LogMethodMap: Record<
    LogLevel,
    (...args: unknown[]) => void
  > = {
      [LogLevel.DEBUG]: log,
      [LogLevel.INFO]: log,
      [LogLevel.WARN]: warn,
      [LogLevel.ERROR]: error,
      [LogLevel.NONE]: () => { },
    };

  constructor(level: LogLevel, prefix: string) {
    this.level = level;
    this.prefix = prefix;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  setScope(global: any) {
    this.scope = getScriptScope(global);
  }

  /** 输出特定等级的日志 */
  private logLevel(level: LogLevel, args: unknown[]) {
    // 当【日志级别 >= 当前设置级别的日志】才输出
    if (level < this.level || this.level === LogLevel.NONE) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const log = Logger.LogMethodMap[level];

    log(
      `%c${timestamp} %c[${Logger.extensionName}] %c@${this.scope} - %c${levelName} %c[${this.prefix}]`,
      Logger.timestampStyle,
      Logger.prefixStyle,
      Logger.scopeStyle,
      LogStyle[level],
      Logger.prefixStyle,
      ...args,
    );
  }

  /** 输出 debug 级别日志 */
  debug(...args: any[]) {
    this.logLevel(LogLevel.DEBUG, args);
  }

  /** 输出 info 级别日志 */
  info(...args: any[]) {
    this.logLevel(LogLevel.INFO, args);
  }

  /** 输出 warn 级别日志 */
  warn(...args: any[]) {
    this.logLevel(LogLevel.WARN, args);
  }

  /** 输出 error 级别日志 */
  error(...args: any[]) {
    this.logLevel(LogLevel.ERROR, args);
  }
}

/** 管理所有创建的日志，方便统一调整它们的日志等级 */
class LogManager {
  private loggers: Logger[] = [];
  /** 当前插件设置的日志等级 */
  private current_level: LogLevel = LogLevel.INFO;

  /** 创建一个新的 Logger 实例，默认输出 INFO 日志，并添加到管理器中。
   *
   * @param prefix 通常是文件路径，或者模块、功能的名称
   */
  createLogger(prefix: string, level = LogLevel.INFO): Logger {
    level = Math.max(level, this.current_level);
    const logger = new Logger(level, prefix);
    this.loggers.push(logger);
    return logger;
  }

  /** 清空所有日志实例 */
  clear() {
    // 避免其它地方调用时依然有输出
    this.setLevel(LogLevel.NONE);
    this.loggers = [];
  }

  /** 设置所有 Logger 实例的日志等级 */
  setLevel(level: LogLevel | LogLevelString) {
    const v = typeof level === "string" ? LogLevel[level] : level;
    this.current_level = v;
    this.loggers.forEach((logger) => logger.setLevel(v));
  }

  getLevel(): LogLevel {
    return this.current_level;
  }

  getLevelString(): LogLevelString {
    return LogLevel[this.current_level] as LogLevelString;
  }
}

/** 日志管理器，同一个作用域下只有一个该实例。
 *
 * 在插件的 `background`、`content`、`popup` 等不同上下文中，
 *  都会使用这个日志管理器创建 Logger 实例。
 *
 * ```ts
 * // 标识日志前缀，方便区分日志来源
 * const logger = logManager.createLogger("core", LogLevel.DEBUG);
 * ```
 */
export const logManager = new LogManager();
