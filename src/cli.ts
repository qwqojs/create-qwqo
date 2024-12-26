#!/usr/bin/env node

const { resolve } = require('path')
const fs = require('fs')
const prompts = require('prompts')
const { blue, green, red, yellow, dim } = require('kolorist')
const { execSync } = require('child_process')
const os = require('os')

/**
 * 模板目录路径
 */
const templateDir: string = resolve(__dirname, '../template')

/**
 * 包管理器枚举
 */
enum PackageManager {
  NPM = 'npm',
  PNPM = 'pnpm',
  YARN = 'yarn',
}

/**
 * 包注册表枚举
 */
enum Registry {
  NPM = 'npm',
  TAOBAO = 'taobao',
}

/**
 * 注册表 URL 映射
 */
const REGISTRY_URLS = {
  [Registry.NPM]: 'https://registry.npmjs.org',
  [Registry.TAOBAO]: 'https://registry.npmmirror.com',
} as const

/**
 * 注册表名称映射
 */
const REGISTRY_NAMES = {
  'https://registry.npmjs.org': 'npm 官方源',
  'https://registry.npmmirror.com': '淘宝镜像源',
} as const

/**
 * 安装命令映射
 */
const INSTALL_COMMANDS = {
  [PackageManager.NPM]: 'npm install',
  [PackageManager.PNPM]: 'pnpm install',
  [PackageManager.YARN]: 'yarn',
} as const

const isWin = os.platform() === 'win32'

/**
 * 获取当前包管理器使用的注册表
 * @param pm 包管理器
 * @returns 注册表名称
 */
const getCurrentRegistry = (pm: PackageManager): string => {
  try {
    const registry = execSync(`${pm} config get registry`).toString().trim()
    return REGISTRY_NAMES[registry as keyof typeof REGISTRY_NAMES] || registry
  } catch {
    return '未知'
  }
}

/**
 * 检查包管理器是否已安装
 * @param pm 包管理器
 * @returns 是否已安装
 */
const checkPMInstalled = (pm: PackageManager): boolean => {
  if (pm === PackageManager.NPM) return true
  try {
    execSync(`${pm} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * 项目配置选项
 */
interface ProjectConfig {
  projectName: string
  language: 'ts' | 'js'
  moduleType: 'cjs' | 'esm'
  packageManager: PackageManager
  registry: Registry
  autoInstall: boolean
}

/**
 * 添加安装包管理器的函数
 * @param pm 包管理器
 * @returns 是否安装成功
 */
const installPackageManager = (pm: PackageManager): boolean => {
  console.log(blue(`\n正在安装 ${pm}...`))
  try {
    if (isWin) {
      execSync(`npm install -g ${pm}`, { stdio: 'inherit' })
    } else {
      execSync(`sudo npm install -g ${pm}`, { stdio: 'inherit' })
    }
    return true
  } catch (e) {
    console.log(red(`\n安装 ${pm} 失败，请手动安装`))
    return false
  }
}

/**
 * 初始化项目
 */
const init = async () => {
  let targetDir = ''
  let result: ProjectConfig | null = null

  const validateProjectName = async (input: string) => {
    const dir = input.replace(/\//g, '-').replace(/^@/, '')
    if (fs.existsSync(dir)) {
      return '目录已存在，请选择一个新的项目名称'
    }
    return true
  }

  const questions = [
    {
      type: 'text',
      name: 'projectName',
      message: '项目名称:',
      initial: 'qwqo-project',
      validate: validateProjectName,
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
        { title: 'npm', value: PackageManager.NPM },
        { title: 'pnpm', value: PackageManager.PNPM },
        { title: 'yarn', value: PackageManager.YARN },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'registry',
      message: (prev: PackageManager) => {
        const currentRegistry = getCurrentRegistry(prev)
        return `选择 npm 源 ${dim(`(当前: ${currentRegistry})`)}`
      },
      choices: [
        { title: 'npm 官方源', value: Registry.NPM },
        { title: '淘宝镜像源', value: Registry.TAOBAO },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'autoInstall',
      message: '是否自动安装依赖?',
      initial: true,
    },
  ]

  while (!result) {
    result = await prompts(questions, {
      onCancel: () => {
        console.log(red('\n操作已取消'))
        process.exit(0)
      },
    }) as ProjectConfig
  }

  const { projectName, language, moduleType, packageManager, registry, autoInstall } = result

  targetDir = projectName.replace(/\//g, '-').replace(/^@/, '')

  if (autoInstall && packageManager !== PackageManager.NPM && !checkPMInstalled(packageManager)) {
    console.log(yellow(`\n未检测到 ${packageManager}`))
    const shouldInstall = await prompts({
      type: 'confirm',
      name: 'value',
      message: `是否安装 ${packageManager}?`,
      initial: true,
    })

    if (shouldInstall.value) {
      const installed = installPackageManager(packageManager)
      if (!installed) return
    } else {
      console.log(yellow(`\n请先安装 ${packageManager} 后再试`))
      return
    }
  }

  console.log(blue(`\n正在创建项目 ${targetDir}...`))

  // 创建项目目录结构
  await createProjectStructure(targetDir, language, moduleType, projectName)

  console.log(green('\n项目创建成功! 🎉'))

  if (autoInstall) {
    await installDependencies(targetDir, packageManager, registry)
  } else {
    printManualCommands(targetDir, packageManager)
  }
}

/**
 * 创建项目目录结构
 * @param targetDir 项目目录
 * @param language 开发语言
 * @param moduleType 模块类型
 * @param originalName 原始名称
 */
const createProjectStructure = async (
  targetDir: string,
  language: string,
  moduleType: string,
  originalName: string
) => {
  fs.mkdirSync(targetDir)
  const templatePath = resolve(templateDir, language)
  copyDir(templatePath, targetDir)

  // 更新 package.json
  const pkgPath = resolve(targetDir, 'package.json')
  const pkg = require(pkgPath)
  pkg.name = originalName
  pkg.type = moduleType === 'esm' ? 'module' : 'commonjs'
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
}

/**
 * 安装项目依赖
 * @param targetDir 项目目录
 * @param packageManager 包管理器
 * @param registry 注册表
 */
const installDependencies = async (
  targetDir: string,
  packageManager: PackageManager,
  registry: Registry
) => {
  console.log(blue('\n正在安装依赖...\n'))

  try {
    // 设置 registry
    execSync(
      `${packageManager} config set registry ${REGISTRY_URLS[registry]}`,
      { stdio: 'inherit' }
    )
    console.log(green(`已将 ${packageManager} 源设置为: ${REGISTRY_URLS[registry]}`))

    // 安装依赖
    execSync(INSTALL_COMMANDS[packageManager], { cwd: targetDir, stdio: 'inherit' })

    console.log(green('\n依赖安装完成! 🎉'))
    console.log('\n开始使用:\n')
    console.log(green(`  cd ${targetDir}`))
    console.log(green(`  ${packageManager} run dev`))
  } catch (e) {
    console.log(red('\n依赖安装失败，请手动安装'))
    printManualCommands(targetDir, packageManager)
  }
}

/**
 * 打印手动安装命令
 * @param targetDir 项目目录
 * @param packageManager 包管理器
 */
const printManualCommands = (targetDir: string, packageManager: PackageManager) => {
  console.log('\n请手动执行以下命令:\n')
  if (isWin) {
    console.log(green(`  cd ${targetDir}`))
    console.log(green(`  ${packageManager} install && ${packageManager} run dev`))
  } else {
    console.log(green(`  cd ${targetDir} && ${packageManager} install && ${packageManager} run dev`))
  }
}

/**
 * 复制目录
 * @param srcDir 源目录
 * @param destDir 目标目录
 */
const copyDir = (srcDir: string, destDir: string) => {
  fs.readdirSync(srcDir).forEach((file: string) => {
    const srcFile = resolve(srcDir, file)
    const destFile = resolve(destDir, file)

    const stat = fs.statSync(srcFile)
    if (stat.isDirectory()) {
      fs.mkdirSync(destFile)
      copyDir(srcFile, destFile)
    } else {
      fs.copyFileSync(srcFile, destFile)
    }
  })
}

/**
 * 初始化项目
 */
init().catch((e) => {
  console.error(e)
})
