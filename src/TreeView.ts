import _ from "lodash";
import path from "path";
import { Inject, Service, Container } from "typedi";
import * as vscode from "vscode";
import { PackageManager } from "./PackageManager";
import { IPackage } from "./packages/interface";

@Service()
export class TreeProvider implements vscode.TreeDataProvider<IPackage> {
  @Inject() packageManager!: PackageManager;
  private context: vscode.ExtensionContext = Container.get("context");

  // tree view event
  private privateOnDidChangeTreeData: vscode.EventEmitter<IPackage | undefined> = new vscode.EventEmitter<IPackage | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<IPackage | undefined> = this.privateOnDidChangeTreeData.event;

  public refresh(item?: IPackage): void {
    this.privateOnDidChangeTreeData.fire(item);
  }

  public getTreeItem(element: IPackage): vscode.TreeItem {
    if (!element.parent) {
      return {
        label: element.name.toUpperCase(),
        contextValue: "registry",
        description: element.version,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        iconPath: {
          dark: this.context.asAbsolutePath(path.join("resources", "dark", element.name + ".svg")),
          light: this.context.asAbsolutePath(path.join("resources", "light", element.name + ".svg")),
        },
      };
    } else {
      return {
        label: element.name,
        contextValue: "package",
        description: element.version,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        tooltip: element.desc,
      };
    }
  }

  public async getChildren(element?: IPackage): Promise<IPackage[]> {
    // get all possible packages
    if (!element) {
      const registries = this.packageManager.getRegistries();
      const packages: IPackage[] = [];

      for (const reg of registries) {
        packages.push({
          package: reg.name,
          name: reg.name,
          version: await reg.version(),
        });
      }

      return packages;
    }

    if (!element.parent) {
      return (await this.packageManager.getDependencies(element.name)).map((v) => {
        return {
          ...v,
          parent: element,
        };
      });
    }

    return [];
  }
}
