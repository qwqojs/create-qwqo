# QWQO CLI

一个简单的项目脚手架工具,用于快速创建 TypeScript/JavaScript 项目模板。

## 特性

- 🚀 支持 TypeScript 和 JavaScript
- 📦 支持 CommonJS 和 ES Modules
- ⚡️ 支持多种包管理器(npm/yarn/pnpm)
- 🔄 支持切换 npm 镜像源
- 💡 交互式命令行界面
- 🎯 自动安装依赖

## 使用

只需运行以下命令即可创建新项目:

### npm

```bash
npm create qwqo@latest
```

### yarn

```bash
yarn create qwqo@latest
```

### pnpm

```bash
pnpm create qwqo@latest
```

然后按照提示进行操作:

1. 输入项目名称
2. 选择开发语言 (TypeScript/JavaScript)
3. 选择模块类型 (CommonJS/ES Modules)
4. 选择包管理器 (npm/yarn/pnpm)
5. 选择 npm 镜像源 (npm 官方源/淘宝镜像源)
6. 选择是否自动安装依赖

## 项目模板结构

```
project-name/
├── src/
│ └── index.[js|ts]
├── package.json
├── README.md
├── .gitignore
└── [tsconfig.json|eslint.config.mjs]
```

## 配置选项

### 开发语言

- TypeScript: 使用 TypeScript 开发
- JavaScript: 使用 JavaScript 开发

### 模块类型

- CommonJS: 使用 `require()/module.exports`
- ES Modules: 使用 `import/export`

### 包管理器

- npm: 默认的包管理器
- yarn: 更快的依赖安装
- pnpm: 节省磁盘空间的包管理器

### NPM 镜像源

- npm 官方源: `https://registry.npmjs.org`
- 淘宝镜像源: `https://registry.npmmirror.com`
