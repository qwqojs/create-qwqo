#!/usr/bin/env node
"use strict";
const { resolve } = require('path');
const fs = require('fs');
const prompts = require('prompts');
const { blue, green, red, yellow, dim } = require('kolorist');
const { execSync } = require('child_process');
const os = require('os');
// 获取模板目录
const templateDir = resolve(__dirname, '../template');
const REGISTRY_URLS = {
    npm: 'https://registry.npmjs.org',
    taobao: 'https://registry.npmmirror.com',
};
const isWin = os.platform() === 'win32';
function getCurrentRegistry(pm) {
    try {
        return execSync(`${pm} config get registry`).toString().trim();
    }
    catch {
        return '未知';
    }
}
function checkPMInstalled(pm) {
    if (pm === 'npm')
        return true;
    try {
        execSync(`${pm} --version`, { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
async function init() {
    let targetDir = '';
    const questions = [
        {
            type: 'text',
            name: 'projectName',
            message: '项目名称:',
            initial: 'qwqo-project',
        },
        {
            type: 'select',
            name: 'language',
            message: '选择开发语言:',
            choices: [
                { title: 'TypeScript', value: 'ts' },
                { title: 'JavaScript', value: 'js' },
            ],
            initial: 0,
        },
        {
            type: 'select',
            name: 'moduleType',
            message: '选择模块类型:',
            choices: [
                { title: 'CommonJS', value: 'cjs' },
                { title: 'ES Modules', value: 'esm' },
            ],
            initial: 0,
        },
        {
            type: 'select',
            name: 'packageManager',
            message: '选择包管理器:',
            choices: [
                { title: 'npm', value: 'npm' },
                { title: 'pnpm', value: 'pnpm' },
                { title: 'yarn', value: 'yarn' },
            ],
            initial: 0,
        },
        {
            type: 'select',
            name: 'registry',
            message: (prev) => {
                const currentRegistry = getCurrentRegistry(prev);
                return `选择 npm 源 ${dim(`(当前: ${currentRegistry})`)}`;
            },
            choices: [
                { title: 'npm 官方源', value: 'npm' },
                { title: '淘宝镜像源', value: 'taobao' },
            ],
            initial: 0,
        },
        {
            type: 'confirm',
            name: 'autoInstall',
            message: '是否自动安装依赖?',
            initial: true,
        },
    ];
    const answers = await prompts(questions);
    const { projectName, language, moduleType, packageManager, registry, autoInstall } = answers;
    targetDir = projectName;
    if (fs.existsSync(targetDir)) {
        console.log(red(`目录 ${targetDir} 已存在，请选择一个新的项目名称`));
        return;
    }
    // 检查包管理器是否安装
    if (autoInstall && packageManager !== 'npm' && !checkPMInstalled(packageManager)) {
        console.log(yellow(`\n未检测到 ${packageManager}，请先安装 ${packageManager}`));
        return;
    }
    console.log(blue(`\n正在创建项目 ${targetDir}...`));
    // 复制模板文件
    fs.mkdirSync(targetDir);
    const templatePath = resolve(templateDir, language);
    copyDir(templatePath, targetDir);
    // 根据选择修改 package.json
    const pkgPath = resolve(targetDir, 'package.json');
    const pkg = require(pkgPath);
    pkg.name = projectName;
    pkg.type = moduleType === 'esm' ? 'module' : 'commonjs';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(green('\n项目创建成功! 🎉'));
    if (autoInstall) {
        console.log(blue('\n正在安装依赖...\n'));
        const installCommand = {
            npm: 'npm install',
            pnpm: 'pnpm install',
            yarn: 'yarn',
        }[packageManager];
        try {
            // 设置 registry
            execSync(`${packageManager} config set registry ${REGISTRY_URLS[registry]}`, { stdio: 'inherit' });
            execSync(installCommand, { cwd: targetDir, stdio: 'inherit' });
            console.log(green('\n依赖安装完成! 🎉'));
            console.log(green(`已将 ${packageManager} 源设置为: ${REGISTRY_URLS[registry]}`));
            console.log('\n开始使用:\n');
            console.log(blue(`  cd ${targetDir}`));
            console.log(blue(`  ${packageManager} run dev`));
        }
        catch (e) {
            console.log(red('\n依赖安装失败，请手动安装'));
            printManualCommands(targetDir, packageManager);
        }
    }
    else {
        printManualCommands(targetDir, packageManager);
    }
}
function printManualCommands(targetDir, packageManager) {
    console.log('\n请手动执行以下命令:\n');
    if (isWin) {
        console.log(blue(`  cd ${targetDir}`));
        console.log(blue(`  ${packageManager} install && ${packageManager} run dev`));
        console.log(blue(`  ${packageManager} install; ${packageManager} run dev`));
    }
    else {
        console.log(blue(`  cd ${targetDir} && ${packageManager} install && ${packageManager} run dev`));
    }
}
function copyDir(srcDir, destDir) {
    fs.readdirSync(srcDir).forEach((file) => {
        const srcFile = resolve(srcDir, file);
        const destFile = resolve(destDir, file);
        const stat = fs.statSync(srcFile);
        if (stat.isDirectory()) {
            fs.mkdirSync(destFile);
            copyDir(srcFile, destFile);
        }
        else {
            fs.copyFileSync(srcFile, destFile);
        }
    });
}
init().catch((e) => {
    console.error(e);
});
