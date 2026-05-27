import { type Plugin } from "rollup";

/** 当前使用文件路径作为日志的前缀，需要在编译期间获取文件路径，替换提前准备好的占位符。
 *
 * 当前只处理 `src` 目录下的文件，将 `src/xxx` 中的 `xxx` 部分作为日志的前缀。
 *
 * @param placeholder 占位符名称
 * @param verbose 输出处理了哪些文件
 */
export default function genLogPrefix(
  placeholder: string,
  verbose = false,
): Plugin {
  const validExtensions = [".ts", ".js", ".tsx", ".jsx", ".mjs", ".cjs"];

  return {
    name: "gen-log-prefix",

    transform(code, id) {
      const windowsSrcIndex = id.indexOf("\\src\\");
      const srcIndex =
        windowsSrcIndex === -1 ? id.indexOf("/src/") : windowsSrcIndex;

      if (
        srcIndex === -1 ||
        id.includes("node_modules") ||
        !code.includes(placeholder)
      )
        return null;

      const hasValidExt = validExtensions.some((ext) => id.endsWith(ext));
      if (!hasValidExt) return null;

      const extIndex = id.lastIndexOf(".");
      const relativePath = id
        // +5 是跳过 /src/ 字符串
        .substring(srcIndex + 5, extIndex)
        .replaceAll("\\", "/");
      verbose && console.log("gen log prefix:", relativePath);
      const transformed = code.replaceAll(placeholder, `"${relativePath}"`);
      return transformed;
    },
  };
}
