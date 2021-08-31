import "reflect-metadata";
import { Container } from "typedi";
import * as vscode from "vscode";
import * as i18n from "vscode-nls-i18n";
import { TreeProvider } from "./TreeView";
import { PackageManager } from "./PackageManager";
import { PackageManagerNPM } from "./packages/npm";
import { PackageManagerPNPM } from "./packages/pnpm";
import { PackageManagerYarn } from "./packages/yarn";
import { PackageManagerHomeBrew } from "./packages/homebrew";
import { PackageManagerPIP } from "./packages/pip";
import { PackageManagerPIP3 } from "./packages/pip3";
import { PackageManagerGem } from "./packages/gem";
import { PackageManagerChocolatey } from "./packages/chocolatey";

async function startUp(context: vscode.ExtensionContext) {
  const packageManager = Container.get(PackageManager);

  await packageManager.registry(new PackageManagerNPM());
  await packageManager.registry(new PackageManagerPNPM());
  await packageManager.registry(new PackageManagerYarn());
  await packageManager.registry(new PackageManagerHomeBrew());
  await packageManager.registry(new PackageManagerPIP());
  await packageManager.registry(new PackageManagerPIP3());
  await packageManager.registry(new PackageManagerGem());
  await packageManager.registry(new PackageManagerChocolatey());

  context.subscriptions.push(vscode.commands.registerCommand("pkg.upgradeSelf", packageManager.upgradeSelf.bind(packageManager)));

  context.subscriptions.push(vscode.commands.registerCommand("pkg.install", packageManager.install.bind(packageManager)));

  context.subscriptions.push(vscode.commands.registerCommand("pkg.uninstall", packageManager.uninstall.bind(packageManager)));

  context.subscriptions.push(vscode.commands.registerCommand("pkg.update", packageManager.update.bind(packageManager)));

  context.subscriptions.push(vscode.commands.registerCommand("pkg.refresh", packageManager.refreshTree.bind(packageManager)));

  // tree view
  context.subscriptions.push(vscode.window.registerTreeDataProvider("PackageManagerExplorer", Container.get(TreeProvider)));
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  i18n.init(context.extensionPath);

  Container.set("context", context);

  startUp(context);
}

export async function deactivate(context: vscode.ExtensionContext): Promise<void> {
  // empty block
}
