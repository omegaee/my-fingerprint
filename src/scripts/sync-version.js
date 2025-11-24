const fs = require('fs');
const path = require('path');

// 读取新版本号（必须从命令行参数传入）
const newVersion = process.argv[2];
if (!newVersion) {
    console.error('❌ 请提供新版本号，例如：npm run sync-version 2.x.x');
    process.exit(1);
}

try {
    // 获取根目录：从 src/scripts/ 回到项目根目录需要 ../../（上两级）
    const projectRoot = path.resolve(__dirname, '../../');

    // 1. 更新 manifest.ts（项目根目录下）
    const manifestPath = path.resolve(projectRoot, 'manifest.ts');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`未找到 manifest.ts，路径：${manifestPath}`);
    }
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    // 精确匹配 version 字段（避免误改其他内容）
    manifestContent = manifestContent.replace(/version: '(.*?)'/, `version: '${newVersion}'`);
    fs.writeFileSync(manifestPath, manifestContent);

    // 2. 更新 updates.xml（项目根目录下）
    const updatesPath = path.resolve(projectRoot, 'updates.xml');
    if (!fs.existsSync(updatesPath)) {
        throw new Error(`未找到 updates.xml，路径：${updatesPath}`);
    }
    let updatesContent = fs.readFileSync(updatesPath, 'utf8');
    // 同步版本号和 codebase 下载链接
    updatesContent = updatesContent
        .replace(/version="(.*?)"/, `version="${newVersion}"`)
        .replace(/download\/v(.*?)\/my-fingerprint-chrome-v(.*?)\.zip/,
            `download/v${newVersion}/my-fingerprint-chrome-v${newVersion}.zip`);
    fs.writeFileSync(updatesPath, updatesContent);

    console.log(`✅ 版本已同步为：${newVersion}`);
} catch (error) {
    console.error('❌ 更新版本号失败：', error.message);
    process.exit(1);
}