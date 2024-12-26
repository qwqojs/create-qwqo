#!/usr/bin/env node
declare const resolve: any;
declare const fs: any;
declare const prompts: any;
declare const blue: any, green: any, red: any, yellow: any, dim: any;
declare const execSync: any;
declare const os: any;
declare const templateDir: any;
type PackageManager = 'npm' | 'pnpm' | 'yarn';
type Registry = 'npm' | 'taobao';
declare const REGISTRY_URLS: {
    readonly npm: "https://registry.npmjs.org";
    readonly taobao: "https://registry.npmmirror.com";
};
declare const isWin: boolean;
declare function getCurrentRegistry(pm: PackageManager): string;
declare function checkPMInstalled(pm: PackageManager): boolean;
declare function init(): Promise<void>;
declare function printManualCommands(targetDir: string, packageManager: PackageManager): void;
declare function copyDir(srcDir: string, destDir: string): void;
